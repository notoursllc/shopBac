const isObject = require('lodash.isobject');
const StorageService = require('../../core/services/StorageService')
const ProductPicBaseCtrl = require('./ProductPicBaseCtrl');


class ProductPicVariantCtrl extends ProductPicBaseCtrl {

    constructor(server) {
        super(server, 'ProductPicVariant');
    }


    async deleteFromFileAndDB(id) {
        if(!id) {
            return;
        }

        const ProductPicVariant = await this.getModel().findById(id);
        return super.deleteFromFileAndDB(
            ProductPicVariant.get('id'),
            ProductPicVariant.get('url')
        );
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
            published: request.payload.published === true ? true : false
        };

        if(isObject(resizeResponse)) {
            createParams.url = resizeResponse.url;
            createParams.width = resizeResponse.width || null;
            createParams.height = resizeResponse.height || null;
        }

        const ProductPicVariant = await this.getModel().create(createParams);
        const variantJson = ProductPicVariant ? ProductPicVariant.toJSON() : null;

        global.logger.info(`RESPONSE: ProductPicVariantCtrl.createVariant`, {
            meta: variantJson
        });

        return variantJson;
    }



    /***************************************
     * route handlers
    /**************************************/

    async getPageHandler(request, h) {
        return super.getPageHandler(request, null, h);
    }


    async deleteHandler(request, h) {
        try {
            global.logger.info('REQUEST: ProductPicVariantCtrl.deleteHandler', {
                meta: { id: request.query.id }
            });

            const id = await this.deleteFromFileAndDB(request.query.id)

            global.logger.info('RESPONSE: ProductPicVariantCtrl.deleteHandler', {
                meta: { id }
            });

            return h.apiSuccess(id);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }

}

module.exports = ProductPicVariantCtrl;
