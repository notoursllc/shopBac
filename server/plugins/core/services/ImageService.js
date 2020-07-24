const FileType = require('file-type');
const isObject = require('lodash.isobject');
const Jimp = require('jimp');
const Hoek = require('@hapi/hoek');
const uuidV4 = require('uuid/v4');
const StorageService = require('./StorageService');

const imageMimeTypeWhiteList = [
    'image/png',
    'image/gif',
    'image/jpeg',
    'image/pjpeg'
];


function getBufferFromBase64(image_b64) {
    const imageParts = image_b64.split(',');
    return Buffer.from(imageParts[1], 'base64');
}


// https://www.npmjs.com/package/file-type
function getFileTypeFromBuffer(buffer) {
    return FileType.fromBuffer(buffer);
}


async function bufferIsImage(buffer) {
    const result = await getFileTypeFromBuffer(buffer);
    // return isObject(result) && imageMimeTypeWhiteList.indexOf(result.mime) > -1;
    if(isObject(result) && imageMimeTypeWhiteList.indexOf(result.mime) > -1) {
        return result;
    }
    return false;
}


/**
 * Resizes an image from a base64 string
 *
 * @param {*} image_b64
 * @param {*} width
 * @param {*} height
 * @param {*} quality
 * @returns {ext: 'png', mime: 'image/png', base64: ''}
 */
async function resizeBase64(image_b64, options, saveResult) {
    const buffer = await getBufferFromBase64(image_b64);
    const imageType = await bufferIsImage(buffer);

    if(!imageType) {
        throw new Error('File type must be one of: ' + imageMimeTypeWhiteList.join(','));
    }

    const settings = Hoek.applyToDefaults(
        {
            width: 600,
            height: Jimp.AUTO,
            quality: 60,
            returnBase64: false,
            returnBuffer: false
        },
        options || {}
    );

    const img = await Jimp.read(buffer);
    const mimeType = img.getMIME();
    const j = img.resize(settings.width, settings.height).quality(settings.quality);

    const imageResultBuffer = await j.getBufferAsync(mimeType);

    imageType.width = settings.width;
    imageType.height = settings.height;
    imageType.image_url = saveResult ? await StorageService.writeBuffer(imageResultBuffer, `${uuidV4()}.${imageType.ext}`) : null;

    if(settings.returnBase64) {
        imageType.result = await j.getBase64Async(mimeType);
    }
    else if(settings.returnBuffer) {
        imageType.result = imageResultBuffer;
    }

    return imageType;
}


module.exports.getBufferFromBase64 = getBufferFromBase64;
module.exports.bufferIsImage = bufferIsImage;
module.exports.resizeBase64 = resizeBase64;
