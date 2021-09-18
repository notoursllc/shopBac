const fse = require('fs-extra');
const path = require('path');
// const fileType = require('file-type');


function getStoragePath(fileName) {
    if(process.env.NODE_ENV === 'production') {
        return `${process.env.STORAGE_PATH}/${fileName}`;
    }

    return path.join(__dirname, '../../../../', `${process.env.STORAGE_PATH}/${fileName}`);
}


async function deleteFile(url) {
    try {
        global.logger.info(`REQUEST: StorageService.deleteFile`, {
            meta: { url }
        });

        if(!url) {
            return;
        }

        let arr = url.split('/');
        let fileName = arr[arr.length - 1];

        if(!fileName) {
            reject(`Can not delete file for url ${url}`);
            return;
        }

        await fse.remove(
            getStoragePath(fileName)
        )

        global.logger.info(`RESPONSE: StorageService.deleteFile`, {});
    }
    catch(err) {
        global.logger.error('StorageService.deleteFile: ', err);
        throw err;
    }

}


async function writeBuffer(fileBuffer, fileName) {
    try {
        // const { mime } = fileType.fromBuffer(fileBuffer);
        const filePath = getStoragePath(fileName);

        // await fse.writeFile(filePath, fileBuffer);
        await fse.outputFileSync(filePath, fileBuffer);

        global.logger.info(`RESPONSE: StorageService.deleteFile`, {
            meta: { filePath }
        });

        return filePath;
    }
    catch(err) {
        global.logger.error('StorageService.writeBuffer: ', err);
        throw err;
    }
}



module.exports.deleteFile = deleteFile;
module.exports.writeBuffer = writeBuffer;
