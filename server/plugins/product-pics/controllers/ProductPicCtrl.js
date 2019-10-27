const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const isObject = require('lodash.isobject');
const StorageService = require('../../core/services/StorageService')
const ProductPicBaseCtrl = require('./ProductPicBaseCtrl');
const ProductPicVariantCtrl = require('./ProductPicVariantCtrl');


class ProductPicCtrl extends ProductPicBaseCtrl {

    constructor(server) {
        super(server, 'ProductPic');
        this.ProductPicVariantController = new ProductPicVariantCtrl(server);
    }


    getSchema() {
        return {
            ordinal: Joi.number().integer().min(0),
            published: Joi.boolean(),
            product_id: Joi.string().uuid()
        };
    }


    getWithRelated() {
        return [
            'pic_variants'
        ]
    }


    // async deletePicFiles(id) {
    //     global.logger.info('REQUEST: ProductPicCtrl.deletePicFiles', {
    //         meta: { id }
    //     });

    //     // Getting the ProductPic and it's pic_variants relations
    //     const ProductPic = await this.modelForgeFetch(
    //         {id: id},
    //         { withRelated: this.getWithRelated() }
    //     );

    //     const picJson = ProductPic ? ProductPic.toJSON() : {};

    //     StorageService.deleteFile(picJson.url);

    //     if(Array.isArray(picJson.pic_variants)) {
    //         picJson.pic_variants.forEach((obj) => {
    //             StorageService.deleteFile(obj.url);
    //         })
    //     }
    // }


    deleteVariantsFromFileAndDB(ProductPic) {
        const picJson = ProductPic ? ProductPic.toJSON() : {};
        const promises = [];

        global.logger.info(`REQUEST: ProductPicCtrl.deleteVariantsFromFileAndDB`, {
            meta: picJson
        });

        if(Array.isArray(picJson.pic_variants)) {
            picJson.pic_variants.forEach((obj) => {
                promises.push(
                    this.ProductPicVariantController.deleteFromFileAndDB(obj.id, obj.url)
                )
            });
        }

        return Promise.all(promises);
    }


    /***************************************
     * route handlers
    /**************************************/

    async getPageHandler(request, h) {
        const withRelated = this.getWithRelated();
        return super.getPageHandler(request, withRelated, h);
    }


    async getPicByIdHandler(request, h) {
        return this.getByIdHandler(
            request.query.id,
            { withRelated: this.getWithRelated() },
            h
        );
    }


    async upsertHandler(request, h) {
        try {
            global.logger.info('REQUEST: ProductPicCtrl.upsertHandler', {
                meta: {
                    id: request.payload.id,
                    file: request.payload.file ? true : false
                }
            });

            try {
                // If a new file is being uploaded then delete the current file and variants
                if(request.payload.id && request.payload.file) {
                    const ProductPic = await this.getModel().findById(request.payload.id);

                    this.deleteVariantsFromFileAndDB(ProductPic);
                    StorageService.deleteFile(ProductPic.get('url'))
                }
            }
            catch(e) {
                // just dropping the exception beacuse issues deleting the file
                // shouldn't stop this process from continuing
                global.logger.error(err);
                global.bugsnag(err);
            }

            const resizeResponse = await StorageService.resizeAndWrite(request, 600);

            // update or create the ProductPic
            const createParams = {
                product_id: request.payload.product_id,
                published: request.payload.published === true ? true : false,
                ordinal: parseInt(request.payload.ordinal, 10) || 1
            };

            // resizeResponse will be empty if the HTTP request did not include a file
            // (which it may not if the user in only updating other attributes)
            if(isObject(resizeResponse)) {
                createParams.url = resizeResponse.url;
                createParams.width = resizeResponse.width || null;
                createParams.height = resizeResponse.height || null;
            }

            let ProductPic;
            if(request.payload.id) {
                ProductPic = await this.getModel().update(createParams, { id: request.payload.id });
            }
            else {
                ProductPic = await this.getModel().create(createParams);
            }

            if(!ProductPic || !ProductPic.get('id')) {
                throw Boom.badRequest('Unable to create a a new product picture.');
            }

            await this.ProductPicVariantController.createVariant(request, ProductPic.get('id'), 1000);

            global.logger.info('RESPONSE: ProductPicCtrl.upsertHandler', {
                meta: ProductPic.toJSON()
            });

            return h.apiSuccess(ProductPic);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    };


    async deleteHandler(request, h) {
        try {
            global.logger.info('REQUEST: ProductPicCtrl.deleteHandler', {
                meta: { id: request.query.id }
            });

            // Getting the ProductPic and its pic_variant relations
            const ProductPic = await this.modelForgeFetch(
                { id: request.query.id },
                { withRelated: this.getWithRelated() }
            );

            await this.deleteVariantsFromFileAndDB(ProductPic);
            await this.deleteFromFileAndDB(ProductPic.get('id'), ProductPic.get('url'));

            global.logger.info('RESPONSE: ProductPicCtrl.deleteHandler', {
                meta: ProductPic ? ProductPic.toJSON() : null
            });

            return h.apiSuccess(ProductPic);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    };

}

module.exports = ProductPicCtrl;
