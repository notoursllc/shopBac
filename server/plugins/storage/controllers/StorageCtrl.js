const Boom = require('@hapi/boom');
const StorageService = require('../../core/services/StorageService')

class StorageCtrl {

    constructor() {
    }


    async uploadImageHandler(request, h) {
        try {
            global.logger.info('REQUEST: StorageCtrl.uploadImageHandler', {
                meta: {
                    file: request.payload.file ? true : false
                }
            });

            const response = [
                await StorageService.resizeAndWrite(request.payload.file, 600),
                await StorageService.resizeAndWrite(request.payload.file, 1000)
            ];

            global.logger.info('RESPONSE: StorageCtrl.uploadImageHandler', {
                meta: { response }
            });

            return h.apiSuccess(response);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    };


    async deleteHandler(url, h) {
        try {
            global.logger.info('REQUEST: StorageCtrl.deleteHandler', {
                meta: { url }
            });

            const deleteResponse = await StorageService.deleteFile(url);

            global.logger.info('RESPONSE: StorageCtrl.deleteHandler', {
                meta: { deleteResponse }
            });

            return h.apiSuccess(deleteResponse);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }

}

module.exports = StorageCtrl;
