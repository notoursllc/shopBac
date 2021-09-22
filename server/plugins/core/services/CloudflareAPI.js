const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const isObject = require('lodash.isobject');

/*
* https://api.cloudflare.com/#cloudflare-images-properties
*/

function getAxios(headerObj) {
    return axios.create({
        baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/`,
        headers: Object.assign(
            {},
            (isObject(headerObj) ? headerObj : { 'Content-Type': 'application/json' }),
            { 'Authorization': `Bearer ${process.env.CLOUDFLARE_AUTH_TOKEN}` },
        ),
        timeout: 10000, // wait for 10s
        validateStatus() {
            return true;
        }
    });
}


async function postImage(file) {
    global.logger.info('REQUEST: CloudflareAPI.postImage', {
        meta: file
    });

    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(file.path));

        // update request headers:
        const instance = getAxios(
            form.getHeaders()
        );

        const res = await instance.post('images/v1', form);

        global.logger.info('REQUEST: CloudflareAPI.postImage - Cloudflare response', {
            meta: res.data
        });

        if(!res.data.success) {
            throw new Error(
                (Array.isArray(res.data.errors) && res.data.errors.length)
                    ?  res.data.errors.join(' / ')
                    : 'An error occured when uploading the file'
            );
        }

        return res.data.result;
    }
    catch (error) {
        if(instance.isAxiosError(error)) {
            throw new Error(error.response.data.errors)
        }
        throw new Error(error)
    }
}


async function deleteImage(id) {
    global.logger.info('REQUEST: CloudflareAPI.deleteImage', {
        meta: { id }
    });

    try {
        // update request headers:
        const instance = getAxios();
        const res = await instance.delete(`images/v1/${id}`);

        global.logger.info('RESPONSE: CloudflareAPI.deleteImage', {
            meta: res.data
        });

        // Sample response (res.data):
        // {"result":{},"result_info":null,"success":true,"errors":[],"messages":[]}

        return res.data.result;

    }
    catch (error) {
        if(instance.isAxiosError(error)) {
            throw new Error(error.response.data.errors)
        }
        throw new Error(error)
    }
}


module.exports = {
    postImage,
    deleteImage
};
