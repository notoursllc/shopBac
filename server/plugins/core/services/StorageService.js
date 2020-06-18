const fileType = require('file-type');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const isObject = require('lodash.isobject');
const cloneDeep = require('lodash.clonedeep');
const sharp = require('sharp');
const uuidV4 = require('uuid/v4');
const helperService = require('../../../helpers.service');

const spacesEndpoint = new AWS.Endpoint(process.env.DIGITAL_OCEAN_SPACES_ENDPOINT);

AWS.config.update({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DIGITAL_OCEAN_SPACES_ACCESS_KEY,
    secretAccessKey: process.env.DIGITAL_OCEAN_SPACES_SECRET
});

const s3 = new AWS.S3();

const imageMimeTypeWhiteList = [
    'image/png',
    'image/gif',
    'image/jpeg',
    'image/pjpeg'
];


function getCloudUrl() {
    return `https://${process.env.DIGITAL_OCEAN_SPACE_NAME}.${process.env.DIGITAL_OCEAN_SPACES_ENDPOINT}`;
}


function getCloudImagePath(fileName) {
    return `${process.env.NODE_ENV}/uploads/images/${fileName}`;
}


// function fileIsImage(fileData) {
//     const typeObj = fileType(fileData);

//     if(isObject(typeObj) && imageMimeTypeWhiteList.indexOf(typeObj.mime) > -1) {
//         return typeObj;
//     }

//     return false;
// }


function deleteFile(url) {
    return new Promise((resolve, reject) => {
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

        const config = {
            Bucket: process.env.DIGITAL_OCEAN_SPACE_NAME,
            Key: getCloudImagePath(fileName)
        };

        s3.deleteObject(config, (err, data) => {
            if(err) {
                return reject(err);
            }

            global.logger.info(`RESPONSE: StorageService.deleteFile`, {
                meta: data
            });

            resolve(data);
        });
    });
}



function writeBuffer(buffer, fileName) {
    try {
        return new Promise((resolve, reject) => {
            const { mime } = fileType.fromBuffer(buffer);
            const filePath = getCloudImagePath(fileName);

            // https://gist.github.com/SylarRuby/b60eea29c1682519e422476cc5357b60
            s3.upload(
                {
                    Bucket: process.env.DIGITAL_OCEAN_SPACE_NAME,
                    Key: filePath,
                    Body: buffer,
                    ACL: 'public-read',
                    ContentEncoding: 'base64', // required
                    ContentType: mime
                    // Metadata: {
                    //     'Content-Type': typeObj.mime
                    // }
                },
                (err, data) => {
                    if (err) {
                        global.logger.error('StorageService.writeBuffer - S3 SAVING FAILURE', err);
                        return reject(err);
                    }

                    global.logger.info('StorageService.writeBuffer - S3 SAVING SUCCESS', {
                        meta: {
                            url: `${getCloudUrl()}/${filePath}`,
                            ...data
                        }
                    });

                    return resolve(`${getCloudUrl()}/${filePath}`);
                }
            );
        });
    }
    catch(err) {
        global.logger.error('StorageService.resizeAndWrite: ', err);
        throw err;
    }
}


/**
 * Saves a new picture file to disk, which is only temorary.
 * Nanobox does not persist file contents between deploys.  Therefore product pics
 * would be wiped out when a new version of the app is deployed to Nanobox.
 * After the file is saved then it will be uploaded to cloud storage.  The saved file
 * is no longer needed after that.
 * More info here about 'writable directories' on Nanobox:
 * https://docs.nanobox.io/app-config/writable-dirs/
 */
function resizeAndWrite(fileObj, width) {
    return;

    /*
    try {
        return new Promise((resolve, reject) => {
            // Cloning is necessary because the file.pipe operation below seems
            // to modify the request.payload.file value, causing subsequest
            // resize attemtps on the same file to fail.
            let file = cloneDeep(fileObj);

            if(isObject(file)) {
                let typeObj = fileIsImage(file._data);

                if(typeObj) {
                    let w = parseInt(width, 10) || 600
                    // let cleanId = helperService.stripTags(helperService.stripQuotes(req.payload.product_id));
                    // let fileName = `${cleanId}_${new Date().getTime()}.${typeObj.ext}`;
                    let fileName = `${uuidV4()}.${typeObj.ext}`;

                    // Read image data from readableStream,
                    // resize,
                    // emit an 'info' event with calculated dimensions
                    // and finally write image data to writableStream
                    // http://sharp.pixelplumbing.com/en/stable/api-resize/
                    // http://sharp.pixelplumbing.com/en/stable/api-output/#tobuffer
                    let transformer = sharp()
                        .resize({
                            width: w
                        })
                        .toBuffer((err, buffer, info) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            global.logger.info('StorageService.resizeAndWrite - RESIZING', {
                                meta: info
                            });

                            let filePath = getCloudImagePath(fileName);
                            let { mime } = fileType(buffer);

                            // https://gist.github.com/SylarRuby/b60eea29c1682519e422476cc5357b60
                            const s3Config = {
                                Bucket: process.env.DIGITAL_OCEAN_SPACE_NAME,
                                Key: filePath,
                                Body: buffer,
                                ACL: 'public-read',
                                ContentEncoding: 'base64', // required
                                ContentType: mime
                                // Metadata: {
                                //     'Content-Type': typeObj.mime
                                // }
                            };

                            s3.upload(s3Config, (err, data) => {
                                if (err) {
                                    global.logger.error('StorageService.resizeAndWrite - IMAGE UPLOAD FAILURE', err);
                                    return reject(err);
                                }

                                global.logger.info('StorageService.resizeAndWrite - UPLOAD SUCCESS', {
                                    meta: {
                                        url: `${getCloudUrl()}/${filePath}`,
                                        width: w,
                                        ...data
                                    }
                                });

                                return resolve({
                                    url: `${getCloudUrl()}/${filePath}`,
                                    width: w
                                });
                            })
                        });

                    file.pipe(transformer);
                }
                else {
                    global.logger.info('SAVING PRODUCT FAILED BECAUSE WRONG MIME TYPE');
                    return reject('File type must be one of: ' + imageMimeTypeWhiteList.join(','))
                }
            }
            else {
                resolve();
            }
        });
    }
    catch(err) {
        global.logger.error("StorageService.resizeAndWrite: ", err)
        throw err;
    }
    */
}



module.exports.getCloudUrl = getCloudUrl;
module.exports.getCloudImagePath = getCloudImagePath;
// module.exports.fileIsImage = fileIsImage;
module.exports.deleteFile = deleteFile;
module.exports.resizeAndWrite = resizeAndWrite;
module.exports.writeBuffer = writeBuffer;
