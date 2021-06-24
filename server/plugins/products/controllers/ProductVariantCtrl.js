const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const cloneDeep = require('lodash.clonedeep');
const BaseController = require('../../core/controllers/BaseController');
const ProductVariantSkuCtrl = require('./ProductVariantSkuCtrl');
const StorageService = require('../../core/services/StorageService')


class ProductVariantCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductVariant');
        this.ProductVariantSkuCtrl = new ProductVariantSkuCtrl(server);
    }


    getSchema(isUpdate) {
        const schema = {
            id: Joi.string().uuid(),
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().empty('').default(false),
            ordinal: Joi.number().integer().min(0).allow(null),
            label: Joi.alternatives().try(
                Joi.string().max(100),
                Joi.allow(null)
            ),
            basic_color_type: Joi.alternatives().try(
                Joi.number().integer().positive(),
                Joi.allow(null)
            ),

            // PRICING
            currency: Joi.alternatives().try(
                Joi.string().max(3),
                Joi.allow(null)
            ),

            base_price: Joi.number().integer().min(0).empty('').default(0),
            cost_price: Joi.number().integer().min(0).empty('').default(0),
            compare_at_price: Joi.number().integer().min(0).empty('').default(0),
            sale_price: Joi.number().integer().min(0).empty('').default(0),
            is_on_sale: Joi.boolean().empty('').default(false),
            is_taxable: Joi.boolean().empty('').default(false),
            tax_code: Joi.alternatives().try(
                Joi.number(),
                Joi.allow(null)
            ),

            // ACCENT MESSAGE
            accent_message_id: Joi.alternatives().try(
                Joi.string().uuid(),
                Joi.allow(null)
            ),
            accent_message_begin: Joi.alternatives().try(
                Joi.date(),
                Joi.allow(null)
            ),
            accent_message_end: Joi.alternatives().try(
                Joi.date(),
                Joi.allow(null)
            ),

            // MEDIA
            images: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),
            swatches: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),

            // SHIPPING
            weight_oz: Joi.number().precision(2).min(0).max(99999999.99).empty('').default(0),
            customs_country_of_origin: Joi.alternatives().try(
                Joi.string().max(2),
                Joi.allow(null)
            ),

            // product_id: Joi.string().uuid().required(),
            product_id: Joi.string().uuid(),

            skus: Joi.array().items(
                // Note: should not pass the 'isUpdate' flag to getSchema() in this case.
                // When creating a product, the user doesn't necessarily have to also create variants,
                // therefore updating a product may be the first time that a variants is added, in
                // which case the variant will not have an id
                Joi.object(this.ProductVariantSkuCtrl.getSchema())
            ),

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
                skus: (query) => {
                    // query.where('published', '=', true);
                    query.orderBy('ordinal', 'ASC');
                }
            },
        ];

        return related;
    }


    upsertVariant(data) {
        return new Promise(async (resolve, reject) => {
            try {
                global.logger.info(`REQUEST: ProductVariantCtrl.upsertVariant (${this.modelName})`, {
                    meta: {
                        variant: data
                    }
                });

                // remove skus from the data so we can save the model
                const skus = cloneDeep(data.skus);
                delete data.skus;

                const ProductVariant = await this.upsertModel(data);

                // resize and save variant images
                if(ProductVariant) {
                    await this.ProductVariantSkuCtrl.upsertSkus(
                        skus,
                        ProductVariant.get('id'),
                        ProductVariant.get('tenant_id')
                    );
                }

                global.logger.info(`RESPONSE: ProductVariantCtrl.upsertVariant (${this.modelName})`, {
                    meta: {
                        productVariant: ProductVariant ? ProductVariant.toJSON() : null
                    }
                });

                resolve(ProductVariant);
            }
            catch(err) {
                global.logger.error(err);
                global.bugsnag(err);
                reject(err);
            }
        });
    }


    upsertVariants(variants, productId, tenantId) {
        try {
            global.logger.info(`REQUEST: ProductVariantCtrl.upsertVariants (${this.modelName})`, {
                meta: {
                    tenantId,
                    productId,
                    variants
                }
            });

            const promises = [];

            if(Array.isArray(variants)) {
                variants.forEach((v) => {
                    promises.push(
                        this.upsertVariant({
                            tenant_id: tenantId,
                            product_id: productId,
                            ...v
                        })
                    );
                });
            }

            global.logger.info(`RESPONSE: ProductVariantCtrl.upsertVariants (${this.modelName}) - returning ${promises.length} promises`);

            return Promise.all(promises);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw err;
        }
    }


    /**
     * Deletes a product variant, including all of it's SKUs
     *
     * @param {*} request
     * @param {*} h
     */
    async deleteVariant(id, tenant_id) {
        global.logger.info('REQUEST: ProductVariantCtrl.deleteVariant', {
            meta: { id, tenant_id }
        });

        const ProductVariant = await this.modelForgeFetch(
            { id, tenant_id },
            { withRelated: ['skus'] }
        );

        if(!ProductVariant) {
            throw new Error('Unable to find ProductVariant');
        }

        const skus = ProductVariant.related('skus').toArray();
        const promises = [];

        // Delete skus
        if(Array.isArray(skus)) {
            try {
                skus.forEach((obj) => {
                    promises.push(
                        this.ProductVariantSkuCtrl.deleteModel(obj.id, tenant_id)
                    );
                });
            }
            catch(err) {
                global.logger.error('ProductVariantSkuCtrl.deleteModel - ERROR DELETING SKUS: ', err);
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
            await this.deleteVariant(
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


    async deleteImageHandler(request, h) {
        try {
            global.logger.info(`REQUEST: ProductVariantCtrl.deleteImageHandler`, {
                meta: request.query
            });

            const ProductVariant = await this.getModel()
                .query((qb) => {
                    qb.andWhere('id', '=', request.query.id);
                    qb.andWhere('tenant_id', '=', this.getTenantIdFromAuth(request));
                })
                .fetch();

            const images = ProductVariant.get('images');

            if(Array.isArray(images)) {
                let matchedIndex = null;

                images.forEach((obj, index) => {
                    if(obj.id === request.query.media_id) {
                        matchedIndex = index;
                    }
                });

                if(matchedIndex !== null) {
                    // Delete the image file.
                    // Any errors here should only be logged
                    // so they don't affect the outcome of this operation
                    try {
                        if(Array.isArray(images[matchedIndex].variants)) {
                            images[matchedIndex].variants.forEach((obj) => {
                                StorageService.deleteFile(obj.url);
                            })
                        }
                    }
                    catch(err) {
                        global.logger.error(err);
                        global.bugsnag(err);
                    }

                    // Take the matched index out of the images array
                    images.splice(matchedIndex, 1);

                    // Update the model with the new 'images' array
                    await this.getModel().update(
                        { images },
                        { id: ProductVariant.get('id') }
                    )
                }
            }

            global.logger.info('RESPONSE: ProductVariantCtrl.deleteImageHandler', {
                meta: { images }
            });

            return h.apiSuccess({
                images
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw err;
        }
    }

}

module.exports = ProductVariantCtrl;
