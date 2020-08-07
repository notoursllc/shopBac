const FileType = require('file-type');
const isObject = require('lodash.isobject');
const Jimp = require('jimp');
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

    let sharpResult = await sharp(buffer)
        .resize(
            { width: settings.width }
        );

    if(imageType.mime === 'image/jpeg') {
        sharpResult = await sharpResult.jpeg({
            quality: settings.quality
        });
    }

    sharpResult = await sharpResult.toBuffer();

    const url = saveResult
        ? await StorageService.writeBuffer(sharpResult, `${uuidV4()}.${imageType.ext}`)
        : null;

    const response = {
        width: settings.width,
        url: url,
        ...imageType
    };

    return response;
}



// async function resizeImageBuffer(buffer, options, saveResult) {
//     const imageType = await bufferIsImage(buffer);

//     console.log("RESIZE IMAGE TYPE", imageType)

//     if(!imageType) {
//         throw new Error('File type must be one of: ' + imageMimeTypeWhiteList.join(','));
//     }

//     const settings = Hoek.applyToDefaults(
//         {
//             width: 600,
//             height: Jimp.AUTO,
//             quality: 60,
//             returnBase64: false,
//             returnBuffer: false
//         },
//         options || {}
//     );

//     const img = await Jimp.read(buffer);
//     const mimeType = img.getMIME();
//     const j = img.resize(settings.width, settings.height).quality(settings.quality);

//     const imageResultBuffer = await j.getBufferAsync(mimeType);

//     imageType.width = settings.width;
//     imageType.height = settings.height;
//     imageType.image_url = saveResult ? await StorageService.writeBuffer(imageResultBuffer, `${uuidV4()}.${imageType.ext}`) : null;

//     if(settings.returnBase64) {
//         imageType.result = await j.getBase64Async(mimeType);
//     }
//     else if(settings.returnBuffer) {
//         imageType.result = imageResultBuffer;
//     }

//     return imageType;
// }


module.exports.resizeBase64ToMultipleImages = resizeBase64ToMultipleImages;
module.exports.resizeBufferToMultipleImages = resizeBufferToMultipleImages;
module.exports.getBufferFromBase64 = getBufferFromBase64;
module.exports.bufferIsImage = bufferIsImage;
module.exports.resizeBase64 = resizeBase64;
module.exports.resizeImageBuffer = resizeImageBuffer;
