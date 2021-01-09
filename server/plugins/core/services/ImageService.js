const FileType = require('file-type');
const isObject = require('lodash.isobject');
const Hoek = require('@hapi/hoek');
const uuidV4 = require('uuid/v4');
const sharp = require('sharp');
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
 * A convenience method for 'resizeBase64' that will resize a single image into multiple sizes
 *
 * @param {A} image_b64
 * @param {*} options   An array of resize configs.  One config for every size that you want created
 * @param {*} saveResult
 */
function resizeBase64ToMultipleImages(image_b64, options, saveResult) {
    const promises = [];

    if(Array.isArray(options)) {
        options.forEach((optionObj) => {
            if(image_b64 && image_b64.trim().indexOf('data:') === 0) {
                promises.push(
                    resizeBase64(image_b64, optionObj, saveResult)
                );
            }
        });
    }

    return promises;
}


/**
 * A convenience method for 'resizeBase64' that will resize a single image into multiple sizes
 *
 * @param {A} image_b64
 * @param {*} options   An array of resize configs.  One config for every size that you want created
 * @param {*} saveResult
 */
function resizeBufferToMultipleImages(buffer, options, saveResult) {
    const promises = [];

    if(Array.isArray(options)) {
        options.forEach((optionObj) => {
            promises.push(
                resizeImageBuffer(buffer, optionObj, saveResult)
            );
        });
    }

    return promises;
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
    return resizeImageBuffer(buffer, options, saveResult);
}


/**
 * Resizes an image from a buffer
 *
 * @param {*} buffer
 * @param {*} width
 * @param {*} height
 * @param {*} quality
 * @returns {ext: 'png', mime: 'image/png', base64: ''}
 * @docs  https://sharp.pixelplumbing.com/api-resize
 */
async function resizeImageBuffer(buffer, options, saveResult) {
    const imageType = await bufferIsImage(buffer);

    if(!imageType) {
        throw new Error('File type must be one of: ' + imageMimeTypeWhiteList.join(','));
    }

    const settings = Hoek.applyToDefaults(
        {
            width: 600,
            quality: 60
        },
        options || {}
    );

    let sharpResult = await sharp(buffer).resize({
        width: settings.width,
        withoutEnlargement: true
    });

    if(imageType.mime === 'image/jpeg') {
        sharpResult = await sharpResult.jpeg({
            quality: settings.quality
        });
    }

    // sharpResult = await sharpResult.toBuffer();
    // console.log("SHARP RESULT", sharpResult)

    // NOTE: in order to access the 'info' property from the .toBuffer respose
    // you need a .then function
    // https://sharp.pixelplumbing.com/api-output#tobuffer
    const toBufferResult = await sharpResult
        .toBuffer({ resolveWithObject: true })
        .then(async ({ data, info }) => {
            return {
                // target_width is helpful for the UI to find the image that is supposed to be (for example) 600px,
                // but might not be exactly that
                target_width: options.width,
                width: info.width,
                height: info.height,
                url: saveResult ? await StorageService.writeBuffer(data, `${uuidV4()}.${imageType.ext}`) : null,
                ...imageType
            };
        })
        .catch(err => {
            throw err;
        });

    return toBufferResult;
}


module.exports.resizeBase64ToMultipleImages = resizeBase64ToMultipleImages;
module.exports.resizeBufferToMultipleImages = resizeBufferToMultipleImages;
module.exports.getBufferFromBase64 = getBufferFromBase64;
module.exports.bufferIsImage = bufferIsImage;
module.exports.resizeBase64 = resizeBase64;
module.exports.resizeImageBuffer = resizeImageBuffer;
