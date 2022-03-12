// https://docs.bunny.net/reference/storage-api

const axios = require('axios');
const fs = require('fs-extra');
const isObject = require('lodash.isobject');


function getAxios(headerObj) {
    return axios.create({
        baseURL: `${process.env.BUNNY_API_BASE_URL}/${process.env.BUNNY_API_STORAGE_ZONE}`,
        headers: Object.assign(
            {},
            (isObject(headerObj) ? headerObj : {}),
            { 'AccessKey': process.env.BUNNY_API_STORAGE_KEY },
        ),
        timeout: 20000, // wait for 20s
        validateStatus() {
            return true;
        }
    });
}


/**
 * Add a leading slash (if needed) and remove the last slash (if needed) on a path
 * @param {String} path path
 */
 function fixSlashes(path) {
    if(path) {
        // add leading slash
        if(path[0] !== '/') {
            path = `/${path}`;
        }

        // remove trailing slash
        if (path[path.length - 1] === '/') {
            path = path.slice(0, -1);
        }
    }

    return path;
}


async function uploadFile(path, fileName, file) {
    global.logger.info('REQUEST: BunnyAPI.uploadFile', {
        meta: file
    });


    try {
        const instance = getAxios(
            {'Content-Type': 'application/octet-stream'}
        );

        path = fixSlashes(path);
        const filePath = `${path}/${fileName}`;

        const res = await instance.put(
            filePath,
            fs.createReadStream(file.path)
        );

        if(parseInt(res.data.HttpCode, 10) !== 201) {
            throw new Error(res.data.Message || 'An error occured when uploading the file');
        }

        global.logger.info('RESPONSE: BunnyAPI.uploadFile', {
            meta: filePath
        });

        return filePath;
    }
    catch (error) {
        throw new Error(error)
    }
}


async function deleteFile(url) {
    global.logger.info('REQUEST: BunnyAPI.deleteImage', {
        meta: { url }
    });

    const instance = getAxios();

    try {
        const res = await instance.delete(url);

        global.logger.info('RESPONSE: BunnyAPI.deleteImage', {
            meta: res.data
        });

        return url;
    }
    catch (error) {
        if(instance.isAxiosError(error)) {
            throw new Error(error.response.data.errors)
        }
        throw new Error(error)
    }
}


module.exports = {
    uploadFile,
    deleteFile
};
