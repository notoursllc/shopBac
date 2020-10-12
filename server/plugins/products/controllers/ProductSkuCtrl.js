const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const cloneDeep = require('lodash.clonedeep');
const BaseController = require('../../core/BaseController');
const ProductSkuImageCtrl = require('./ProductSkuImageCtrl');


class ProductSkuCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductSku');
        this.ProductSkuImageCtrl = new ProductSkuImageCtrl(server);
    }


    getSchema(isUpdate) {
        const schema = {
            id: Joi.string().uuid(),
            tenant_id: Joi.string().uuid(),
            // published: Joi.boolean().default(false).allow(null),
            published: Joi.boolean().empty('').default(false),
            ordinal: Joi.number().integer().min(0).allow(null),

            // these should be stringified values in the payload:
            attributes: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),
            metadata: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),

            // IMAGES
            images: Joi.alternatives().try(Joi.array(), Joi.object().unknown(), Joi.allow(null)),
            image_alt_text: Joi.alternatives().try(Joi.array().allow(null), Joi.string().max(100).allow(null)),
            image_id: Joi.alternatives().try(Joi.array().allow(null), Joi.string().max(100).allow(null)),
            image_ordinal: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null)),

            // PRICING
            currency: Joi.alternatives().try(Joi.string().max(3), Joi.allow(null)),
            base_price: Joi.number().integer().min(0).empty('').default(0),
            cost_price: Joi.number().integer().min(0).empty('').default(0),
            compare_at_price: Joi.number().integer().min(0).empty('').default(0),
            sale_price: Joi.number().integer().min(0).empty('').default(0),
            is_on_sale: Joi.boolean().empty('').default(false),
            is_taxable: Joi.boolean().empty('').default(false),
            tax_code: Joi.alternatives().try(Joi.number(), Joi.allow(null)),

            // INVENTORY
            inventory_count: Joi.number().integer().min(0).empty('').default(0),
            sku: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
            barcode: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
            visible_if_out_of_stock: Joi.boolean().empty('').default(true),
            track_quantity: Joi.boolean().empty('').default(true),

            // SHIPPING
            requires_shipping: Joi.boolean().empty('').default(true),
            weight_oz: Joi.number().precision(2).min(0).max(99999999.99).empty('').default(0),
            customs_country_of_origin: Joi.alternatives().try(Joi.string().max(2), Joi.allow(null)),
            customs_harmonized_system_code: Joi.alternatives().try(Joi.string(), Joi.allow(null)),

            // product_id: Joi.string().uuid().required(),
            product_id: Joi.string().uuid(),

            // SPEC TABLE
            data_table: Joi.alternatives().try(Joi.object(), Joi.string(), Joi.allow(null)),

            // ACCENT MESSAGE
            accent_message_id: Joi.alternatives().try(Joi.string().uuid(), Joi.allow(null)),
            accent_message_begin: Joi.alternatives().try(Joi.date(), Joi.allow(null)),
            accent_message_end: Joi.alternatives().try(Joi.date(), Joi.allow(null)),

            // TIMESTAMPS
            created_at: Joi.date(),
            updated_at: Joi.date()
        };

        if(isUpdate) {
            schema.id = Joi.string().uuid().required();
        }

        return schema;
    }


    getWithRelated() {
        const related = [
            {
                images: (query) => {
                    query.where('published', '=', true);
                    query.orderBy('ordinal', 'ASC');
                }
            },
            ['images.media']
        ];

        return related;
    }


    upsertSku(sku) {
        return new Promise(async (resolve, reject) => {
            try {
                global.logger.info(`REQUEST: ProductSkuCtrl.upsertSku (${this.modelName})`, {
                    meta: {
                        sku
                    }
                });

                // remove images from the data so we can save the model
                const images = cloneDeep(sku.images);
                delete sku.images;

                const Sku = await this.upsertModel(sku);

                // resize and save sku images
                if(Sku) {
                    await this.ProductSkuImageCtrl.upsertImages(
                        images,
                        Sku.get('id'),
                        Sku.get('tenant_id')
                    );
                }

                global.logger.info(`RESPONSE: ProductSkuCtrl.upsertSku (${this.modelName})`, {
                    meta: {
                        sku: Sku ? Sku.toJSON() : null
                    }
                });

                resolve(Sku);
            }
            catch(err) {
                global.logger.error(err);
                global.bugsnag(err);
                reject(err);
            }
        });
    }


    upsertSkus(skus, productId, tenantId) {
        try {
            const promises = [];

            global.logger.info(`REQUEST: ProductSkuCtrl.upsertSkus (${this.modelName})`, {
                meta: {
                    tenantId,
                    productId,
                    skus
                }
            });

            if(Array.isArray(skus)) {
                skus.forEach((sku) => {
                    sku.product_id = productId;
                    sku.tenant_id = tenantId;

                    promises.push(
                        this.upsertSku(sku)
                    );
                });
            }

            global.logger.info(`RESPONSE: ProductSkuCtrl.upsertSkus (${this.modelName}) - returning ${promises.length} promises`);

            return Promise.all(promises);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }
    }


    /**
     * Deletes a sku, including all of its images
     *
     * @param {*} request
     * @param {*} h
     */
    async deleteSku(id, tenant_id) {
        global.logger.info('REQUEST: ProductSkuCtrl.deleteSku', {
            meta: { id, tenant_id }
        });

        const ProductSku = await this.modelForgeFetch(
            { id, tenant_id },
            { withRelated: ['images'] }
        );

        if(!ProductSku) {
            throw new Error('Unable to find ProductSku.');
        }

        const images = ProductSku.related('images').toArray();
        const promises = [];

        // Delete images
        if(Array.isArray(images)) {
            try {
                images.forEach((obj) => {
                    promises.push(
                        this.ProductSkuImageCtrl.deleteModel(obj.id, tenant_id)
                    );
                });
            }
            catch(err) {
                global.logger.error('ProductSkuCtrl.deleteSku - ERROR DELETING IMAGES: ', err);
                throw err;
            }
        }

        promises.push(
            this.deleteModel(id, tenant_id)
        );

        return Promise.all(promises);
    }


    /**
     * Deletes a sku, including all of its images
     *
     * @param {*} request
     * @param {*} h
     */
    async deleteHandler(request, h) {
        try {
            await this.deleteSku(
                request.query.id,
                this.getTenantIdFromAuth(request)
            );

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }

}

module.exports = ProductSkuCtrl;
