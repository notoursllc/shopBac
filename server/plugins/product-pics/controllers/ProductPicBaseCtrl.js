const Promise = require('bluebird');
const helperService = require('../../../helpers.service');
const StorageService = require('../../core/services/StorageService')
const BaseController = require('../../core/BaseController');


class ProductPicBaseCtrl extends BaseController {

    constructor(server, modelName) {
        super(server, modelName);
    }


    /**
     * Deletes the pic file from object storage and also from DB
     *
     * @param {*} ProductPic
     */
    async deleteFromFileAndDB(id, url) {
        global.logger.info(`REQUEST: ProductPicBaseCtrl.deleteFromFileAndDB (${this.modelName})`, {
            meta: { id, url }
        });

        if(id) {
            await Promise.all([
                this.getModel().destroy({ id }),
                StorageService.deleteFile(url)
            ]);
        }

        global.logger.info(`RESPONSE: ProductPicBaseCtrl.deleteFromFileAndDB (${this.modelName})`, {
            meta: { id, url }
        });

        return id;
    }


    /***************************************
     * route handlers
    /**************************************/

     async getAllHandler(request, h) {
        return this.fetchAllHandler(h, (qb) => {
            if(helperService.isBoolean(request.query.published)) {
                qb.where('published', '=', request.query.published);
            }
        });
    }

}

module.exports = ProductPicBaseCtrl;
