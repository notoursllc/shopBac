const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../core/BaseController');
const ProductPicCtrl = require('../product-pics/controllers/ProductPicCtrl');


class ProductVariationCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductVariation');
        this.ProductPicController = new ProductPicCtrl(server);
    }


    getSchema() {
        return {
            product_id: Joi.string().guid({
                version: [
                    'uuidv4',
                    'uuidv5'
                ]
            }).required(),
            name: Joi.string().max(100).required(),
            description: Joi.string().max(500).allow(null),
            ordinal: Joi.number().integer().min(1),
            sku: Joi.string(),
            published: Joi.boolean().default(true),
            inventory_alert_threshold: Joi.number().integer(),
            inventory_alert_show: Joi.boolean().default(true),
            inventory_count: Joi.number().integer(),
            hide_if_out_of_stock: Joi.boolean().default(true),
            weight_oz: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    getWithRelated() {
        return [
            {
                options: (query) => {
                    query.where('published', '=', true);
                    query.orderBy('ordinal', 'ASC');
                },

                pics: (query) => {
                    query.where('published', '=', true);
                    query.orderBy('sort_order', 'ASC');
                }
            },
            'pics.pic_variants'
        ]
    }


    async getVariationByIdHandler(request, h) {
        return this.getByIdHandler(
            request.query.id,
            { withRelated: this.getWithRelated() },
            h
        );
    }


    async getVariationsForProductHandler(productId, h) {
        try {
            global.logger.info(`REQUEST: ProductVariationCtrl.getVariationsForProductHandler`, {
                meta: { productId }
            });

            const Models = await this.getModel()
                .query('where', 'product_id', '=', productId)   // https://bookshelfjs.org/api.html#Model-instance-query
                .fetchPage({
                    pageSize: 50,  // This seems safe.  We need to get all of the variations.  Cant imagine there will be more than this.
                    page: 1,
                    withRelated: [{
                        pics: (query) => {
                            query.orderBy('sort_order', 'ASC');
                        }
                    }]
                });

            global.logger.info(`RESPONSE: ProductVariationCtrl.getVariationsForProductHandler`, {
                meta: Models ? Models.toJSON() : null
            });

            return h.apiSuccess(Models);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async deleteHandler(id, h) {
        try {
            const ProductVariation = await this.deleteVariation(id);

            global.logger.info(`RESPONSE: ProductVariationCtrl.deleteHandler (${this.modelName})`, {
                meta: ProductVariation ? ProductVariation.toJSON() : null
            });

            if(!ProductVariation) {
                throw Boom.badRequest(`Unable to find model (${this.modelName})`);
            }

            return h.apiSuccess(ProductVariation);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async deleteVariation(id) {
        global.logger.info('REQUEST: ProductVariationCtrl.deleteVariation', {
            meta: { id }
        });

        const ProductVariation = await this.modelForgeFetch(
            {id: id},
            { withRelated: this.getWithRelated() }
        );

         // an error deleting the pics shouldn't cause the API request to fail
        try {
            await this.deletePics(ProductVariation);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }

        global.logger.info('RESPONSE: ProductVariationCtrl.deleteVariation', {
            meta: ProductVariation ? ProductVariation.toJSON() : null
        });

        return this.getModel().destroy({
            id: id
        });
    }


    deletePics(ProductVariation) {
        const picPromises = [];
        const variationJson = ProductVariation ? ProductVariation.toJSON() : null;

        global.logger.info('REQUEST: ProductVariationCtrl.deletePics', {
            meta: variationJson
        });

        if(variationJson && Array.isArray(variationJson.pics)) {
            variationJson.pics.forEach((pic) => {
                picPromises.push(
                    this.ProductPicController.deletePicFiles(pic.id)
                )
            })
        }

        return Promise.all(picPromises);
    }

}

module.exports = ProductVariationCtrl;
