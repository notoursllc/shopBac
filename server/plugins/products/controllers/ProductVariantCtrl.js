const Joi = require('joi');
const Boom = require('@hapi/boom');
const cloneDeep = require('lodash.clonedeep');
const BaseController = require('../../core/controllers/BaseController');
const ProductVariantSkuCtrl = require('./ProductVariantSkuCtrl');
const BunnyAPI = require('../../core/services/BunnyAPI');
const StripeCtrl = require('../../cart/controllers/StripeCtrl');

class ProductVariantCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductVariant');
        this.ProductVariantSkuCtrl = new ProductVariantSkuCtrl(server);
        this.StripeCtrl = new StripeCtrl(server);
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
            sku_label_type: Joi.alternatives().try(
                Joi.string().max(100),
                Joi.allow(null)
            ),

            // PRICING
            currency: Joi.alternatives().try(
                Joi.string().max(3),
                Joi.allow(null)
            ),

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
        return [
            {
                skus: (query) => {
                    // query.where('published', '=', true);
                    query.orderBy('ordinal', 'ASC');
                }
            },
        ];
    }


    fetchOneForTenantHandler(request, h) {
        return super.fetchOneForTenantHandler(
            request,
            h,
            { withRelated: this.getWithRelatedFetchConfig(request.query, this.getWithRelated()) }
        );
    }


    async upsertVariant(Product, data, options) {
        try {
            global.logger.info(`REQUEST: ProductVariantCtrl.upsertVariant`, {
                meta: {
                    data,
                    options
                }
            });

            // remove skus from the data so we can save the model
            const skus = cloneDeep(data.skus);
            delete data.skus;

            const ProductVariant = await this.upsertModel(data, options);

            if(ProductVariant && Array.isArray(skus)) {
                const tenant_id = ProductVariant.get('tenant_id');

                for(let i=0, l=skus.length; i<l; i++) {
                    let stripePriceAction = 'create';
                    let OldSKU;

                    if(skus[i].id) {
                        OldSKU = await this.ProductVariantSkuCtrl.fetchOne({
                            id: skus[i].id,
                            tenant_id: tenant_id
                        });
                    }

                    const NewSKU = await this.ProductVariantSkuCtrl.upsertModel(
                        {
                            tenant_id,
                            product_variant_id: ProductVariant.get('id'),
                            ...skus[i]
                        },
                        options
                    );

                    if(OldSKU) {
                        // Note that mutating Prices in the API is extremely limited:
                        // https://stripe.com/docs/api/prices/update
                        // There was a lively discussion here about the inability to delete a price:
                        // https://github.com/stripe/stripe-python/issues/658
                        // The same logic applies that prohibits the ability to mutate prices.... once they have been
                        // used in a product, they are essentially 'frozen'.

                        // Therefore, we have to go through a tedious process of
                        // - fetch the current SKU price
                        // - compare it to the price being submitted here
                        // - if different, then archive the current Stripe Price, and create a new one

                        // STRIPE PRICE ACTION CALCULATION
                        // no changes to Stripe price if the prices are the same
                        if(OldSKU.get('display_price') === NewSKU.get('display_price')) {
                            stripePriceAction = null;
                        }
                        // archive the current Stripe price if a null value is being sent
                        else if(OldSKU.get('display_price') && !NewSKU.get('display_price')) {
                            stripePriceAction = 'archive';
                        }
                        // update the current Stripe price if the old and new don't match
                        else if(OldSKU.get('display_price') !== NewSKU.get('display_price')) {
                            stripePriceAction = 'update';
                        }
                    }

                    let stripePrice;

                    const createPrice = () => {
                        return this.StripeCtrl.createPrice(
                            tenant_id,
                            {
                                unit_amount: NewSKU.get('display_price'),
                                'product_data[name]': `${Product.get('title')} SKU:${NewSKU.get('id')}`,  // (required) https://stripe.com/docs/api/prices/create#create_price-product_data-name
                                // 'product_data[id]':  NewSKU.get('id'),  // https://stripe.com/docs/api/prices/create#create_price-product_data-id
                                'product_data[metadata]': { sku:  NewSKU.get('id') },
                                'product_data[tax_code]': Product.get('tax_code') // https://stripe.com/docs/api/prices/create#create_price-product_data-tax_code
                            }
                        );
                    };

                    const archivePrice = () => {
                        if(NewSKU.get('stripe_price_id')) {
                            return this.StripeCtrl.archivePrice(
                                tenant_id,
                                NewSKU.get('stripe_price_id')
                            )
                        }
                    };

                    switch(stripePriceAction) {
                        case 'create':
                            stripePrice = await createPrice();
                            break;

                        case 'update':
                            await archivePrice();
                            stripePrice = await createPrice();
                            break;

                        case 'archive':
                            await archivePrice();
                            break;

                        default:
                            global.logger.info('ProductVariantCtrl.upsertVariant - Stripe Price - mutation is not needed because display_price has not changed');
                    }

                    // Update the ProductVariantSku with the stripe product ID
                    if(stripePrice) {
                        await this.ProductVariantSkuCtrl.upsertModel(
                            {
                                id: NewSKU.get('id'),
                                tenant_id,
                                stripe_price_id: stripePrice.id,
                                stripe_product_id: stripePrice.product
                            },
                            options
                        );
                    }
                }
            }

            global.logger.info(`RESPONSE: ProductVariantCtrl.upsertVariant`, {
                meta: {
                    productVariant: ProductVariant ? ProductVariant.toJSON() : null
                }
            });
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
     async deleteVariant(id, tenant_id, options) {
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

        const Skus = ProductVariant.related('skus').toArray();
        const promises = [];

        // Delete skus
        if(Array.isArray(Skus)) {
            Skus.forEach((Sku) => {
                promises.push(
                    this.ProductVariantSkuCtrl.deleteSku(
                        Sku.get('id'),
                        tenant_id,
                        options
                    )
                )
            });
        }

        promises.push(
            this.deleteModel(
                id,
                tenant_id,
                options
            )
        );

        global.logger.info('RESPONSE: ProductVariantCtrl.deleteVariant', {});

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
                        BunnyAPI.storage.del(images[matchedIndex].url);
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
