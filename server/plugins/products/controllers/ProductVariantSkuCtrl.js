const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/BaseController');


class ProductVariantSkuCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductVariantSku');
    }


    getSchema(isUpdate) {
        const schema = {
            id: Joi.string().uuid(),
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().empty('').default(false),
            ordinal: Joi.number().integer().min(0).allow(null),
            label: Joi.alternatives().try(Joi.string().max(100), Joi.allow(null)),
            sku: Joi.alternatives().try(Joi.string().max(100), Joi.allow(null)),
            barcode: Joi.alternatives().try(Joi.string().max(100), Joi.allow(null)),

            // PRICING
            base_price: Joi.number().integer().min(0).empty('').default(0),
            base_price_inherit: Joi.boolean().empty('').default(false),

            compare_at_price: Joi.number().integer().min(0).empty('').default(0),
            compare_at_price_inherit: Joi.boolean().empty('').default(false),

            cost_price: Joi.number().integer().min(0).empty('').default(0),
            cost_price_inherit: Joi.boolean().empty('').default(false),

            sale_price: Joi.number().integer().min(0).empty('').default(0),
            sale_price_inherit: Joi.boolean().empty('').default(false),

            is_on_sale: Joi.boolean().empty('').default(false),
            is_on_sale_inherit: Joi.boolean().empty('').default(false),

            // SHIPPING
            weight_oz: Joi.number().precision(2).min(0).max(99999999.99).empty('').default(0),
            weight_oz_inherit: Joi.boolean().empty('').default(false),

            customs_country_of_origin: Joi.alternatives().try(Joi.string().max(2), Joi.allow(null)),
            customs_country_of_origin_inherit: Joi.boolean().empty('').default(false),

            // INVENTORY
            inventory_count: Joi.number().integer().min(0).empty('').default(0),
            track_inventory_count: Joi.boolean().empty('').default(true),
            visible_if_no_inventory: Joi.boolean().empty('').default(true),

            product_variant_id: Joi.string().uuid(),

            // TIMESTAMPS
            created_at: Joi.date(),
            updated_at: Joi.date()
        };

        if(isUpdate) {
            schema.id = Joi.string().uuid().required();
        }

        return schema;
    }


    upsertSku(data) {
        return new Promise(async (resolve, reject) => {
            try {
                global.logger.info(`REQUEST: ProductVariantSkuCtrl.upsertSku (${this.modelName})`, {
                    meta: {
                        variant: data
                    }
                });

                const ProductVariantSku = await this.upsertModel(data);

                global.logger.info(`RESPONSE: ProductVariantSkuCtrl.upsertSku (${this.modelName})`, {
                    meta: {
                        productVariantSku: ProductVariantSku ? ProductVariantSku.toJSON() : null
                    }
                });

                resolve(ProductVariantSku);
            }
            catch(err) {
                global.logger.error(err);
                global.bugsnag(err);
                reject(err);
            }
        });
    }


    upsertSkus(skus, productVariantId, tenantId) {
        try {
            global.logger.info(`REQUEST: ProductVariantSkuCtrl.upsertSkus (${this.modelName})`, {
                meta: {
                    tenantId,
                    productVariantId,
                    skus
                }
            });

            const promises = [];

            if(Array.isArray(skus)) {
                skus.forEach((s) => {
                    promises.push(
                        this.upsertSku({
                            tenant_id: tenantId,
                            product_variant_id: productVariantId,
                            ...s
                        })
                    );
                });
            }

            global.logger.info(`RESPONSE: ProductVariantSkuCtrl.upsertSkus (${this.modelName}) - returning ${promises.length} promises`);

            return Promise.all(promises);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw err;
        }
    }
}


module.exports = ProductVariantSkuCtrl;
