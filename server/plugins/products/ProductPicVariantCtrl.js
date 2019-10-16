const Promise = require('bluebird');
const isObject = require('lodash.isobject');
const StorageService = require('../core/services/StorageService')
const BaseController = require('../core/BaseController');


class ProductPicVariantCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductPicVariant');
    }


    async deleteFromFileAndDB(id) {
        if(!id) {
            return;
        }

        global.logger.info(`REQUEST: ProductPicVariantCtrl.deleteVariantFromFileAndDB`, {
            meta: { id }
        });

        const ProductPicVariant = await this.getModel().findById(id);
        const url = ProductPicVariant ? ProductPicVariant.get('url') : null;

        StorageService.deleteFile(url);

        const Variant = await this.getModel().destroy({ id });
        const variantJson = Variant ? Variant.toJSON() : null;

        global.logger.info(`RESPONSE: ProductPicVariantCtrl.deleteVariantFromFileAndDB`, {
            meta: variantJson
        });

        return variantJson;
    }


    async createVariant(request, productPicId, width) {
        global.logger.info(`REQUEST: ProductPicVariantCtrl.createVariant`, {
            meta: {
                productPicId,
                width
            }
        });

        const picWidth = width || 1000;
        const resizeResponse = await StorageService.resizeAndWrite(request, picWidth);

        const createParams = {
            product_pic_id: productPicId,
            is_visible: request.payload.is_visible === true ? true : false
        };

        if(isObject(resizeResponse)) {
            createParams.url = resizeResponse.url;
            createParams.width = resizeResponse.width || null;
            createParams.height = resizeResponse.height || null;
        }

        const ProductPicVariant = this.getModel().create(createParams);
        const variantJson = ProductPicVariant ? ProductPicVariant.toJSON() : null;

        global.logger.info(`REQUEST: ProductPicVariantCtrl.createVariant`, {
            meta: variantJson
        });

        return variantJson;
    }

}

module.exports = ProductPicVariantCtrl;
