const fileType = require('file-type');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const spacesEndpoint = new AWS.Endpoint(process.env.DIGITAL_OCEAN_SPACES_ENDPOINT);

AWS.config.update({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DIGITAL_OCEAN_SPACES_ACCESS_KEY,
    secretAccessKey: process.env.DIGITAL_OCEAN_SPACES_SECRET
});

const s3 = new AWS.S3();


function getCloudUrl() {
    return `https://${process.env.DIGITAL_OCEAN_SPACE_NAME}.${process.env.DIGITAL_OCEAN_SPACES_ENDPOINT}`;
}


function getCloudImagePath(fileName) {
    return `${process.env.NODE_ENV}/uploads/images/${fileName}`;
}


function deleteFile(url) {
    return new Promise((resolve, reject) => {
        global.logger.info(`REQUEST: S3StorageService.deleteFile`, {
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

            global.logger.info(`RESPONSE: S3StorageService.deleteFile`, {
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
                        global.logger.error('S3StorageService.writeBuffer - S3 SAVING FAILURE', err);
                        return reject(err);
                    }

                    global.logger.info('S3StorageService.writeBuffer - S3 SAVING SUCCESS', {
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
        global.logger.error('S3StorageService.writeBuffer: ', err);
        throw err;
    }
}


module.exports.getCloudUrl = getCloudUrl;
module.exports.getCloudImagePath = getCloudImagePath;
module.exports.deleteFile = deleteFile;
module.exports.writeBuffer = writeBuffer;
