const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const Promise = require('bluebird');
const isObject = require('lodash.isobject');
const helperService = require('../../helpers.service');
const StorageService = require('../core/services/StorageService')
const BaseController = require('./BaseController');
const ProductPicVariantCtrl = require('./ProductPicVariantCtrl');


class ProductPicCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductPic');
        this.ProductPicVariantController = new ProductPicVariantCtrl(server);
    }


    getSchema() {
        return {
            // id: Joi.string().uuid(),
            sort_order: Joi.number().integer().min(0),
            is_visible: Joi.boolean(),
            product_variation_id: Joi.string().uuid()
        };
    }


    getWithRelated() {
        return [
            'pic_variants'
        ]
    }


    async deletePicFiles(id) {
        global.logger.info('REQUEST: ProductPicCtrl.deletePicFiles', {
            meta: { id }
        });

        // Getting the ProductPic and it's pic_variants relations
        const ProductPic = await this.modelForgeFetch(
            {id: id},
            { withRelated: this.getWithRelated() }
        );

        const picJson = ProductPic ? ProductPic.toJSON() : {};

        StorageService.deleteFile(picJson.url);

        if(Array.isArray(picJson.pic_variants)) {
            picJson.pic_variants.forEach((obj) => {
                StorageService.deleteFile(obj.url);
            })
        }
    }


    /**
     * Deletes the pic file from object storage and also from DB
     *
     * @param {*} ProductPic
     */
    async deleteFromFileAndDB(ProductPic) {
        const picJson = ProductPic ? ProductPic.toJSON() : {};
        const promises = [];

        global.logger.info('REQUEST: ProductPicCtrl.deleteFromFileAndDB', {
            meta: picJson
        });

        if(picJson.id) {
            promises.push(
                this.getModel().destroy({ id: picJson.id }),
                StorageService.deleteFile(picJson.url)
            );
        }

        const resposne = await Promise.all(promises);

        global.logger.info('RESPONSE: ProductPicCtrl.deleteFromFileAndDB', {
            meta: resposne
        });

        return resposne;
    }


    deleteVariantsFromFileAndDB(ProductPic) {
        const variants = ProductPic ? ProductPic.get('pic_variants') : null;

        if(Array.isArray(variants)) {
            variants.forEach((obj) => {
                this.ProductPicVariantController.deleteFromFileAndDB(obj.id)
            })
        }
    }


    /***************************************
     * route handlers
     /**************************************/

     async getAllHandler(request, h) {
        return this.fetchAll(h, (qb) => {
            if(helperService.isBoolean(request.query.is_visible)) {
                qb.where('is_visible', '=', request.query.is_visible);
            }
        });
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
                    const ProductPicModel = await this.getModel().findById(request.payload.id);
                    this.deleteVariantsFromFileAndDB(ProductPicModel);
                    StorageService.deleteFile(ProductPicModel.get('url'))
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
                product_variation_id: request.payload.product_variation_id,
                is_visible: request.payload.is_visible === true ? true : false,
                sort_order: parseInt(request.payload.sort_order, 10) || 1
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
            const productPicId = request.query.id;

            global.logger.info('REQUEST: ProductPicCtrl.deleteHandler', {
                meta: { productPicId }
            });

            // Getting the ProductPic and its pic_variant relations
            const ProductPic = await this.modelForgeFetch(
                {id: productPicId},
                { withRelated: this.getWithRelated() }
            );

            await this.deleteVariantsFromFileAndDB(ProductPic);
            await this.deleteFromFileAndDB(ProductPic);

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
