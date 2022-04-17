const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const cloneDeep = require('lodash.clonedeep');
const { createSitemap } = require('sitemap');
const BaseController = require('../../core/controllers/BaseController');
const ProductVariantCtrl = require('./ProductVariantCtrl');
const StripeCtrl = require('../../cart/controllers/StripeCtrl');

// Using this so many time below, so setting as a variable:
const joiPositiveNumberOrNull = Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.allow(null)
);

class ProductCtrl extends BaseController {

    constructor(server) {
        super(server, 'Product');
        this.ProductVariantCtrl = new ProductVariantCtrl(server);
        this.StripeCtrl = new StripeCtrl(server);
    }


    getSchema(isUpdate) {
        const schema = {
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().default(false),
            title: Joi.alternatives().try(Joi.string().trim().max(100), Joi.allow(null)),
            caption: Joi.alternatives().try(Joi.string().trim().max(100), Joi.allow(null)),
            description: Joi.alternatives().try(Joi.string().trim().max(500), Joi.allow(null)),
            is_good: Joi.boolean().default(true),

            // these should be stringified values in the payload:
            metadata: Joi.alternatives().try(Joi.array(), Joi.allow(null)),

            // TYPES
            type: joiPositiveNumberOrNull,
            sub_type: joiPositiveNumberOrNull,
            sales_channel_type: joiPositiveNumberOrNull,
            package_type: joiPositiveNumberOrNull,
            vendor_type: joiPositiveNumberOrNull,
            collections: joiPositiveNumberOrNull,
            gender_type: joiPositiveNumberOrNull,
            fit_type: joiPositiveNumberOrNull,
            sleeve_length_type: joiPositiveNumberOrNull,
            feature_type: joiPositiveNumberOrNull,

            // SEO
            seo_page_title: Joi.alternatives().try(
                Joi.string().trim().max(70),
                Joi.allow(null)
            ),
            seo_page_desc: Joi.alternatives().try(
                Joi.string().trim().max(320),
                Joi.allow(null)
            ),
            seo_uri: Joi.alternatives().try(
                Joi.string().trim().max(50),
                Joi.allow(null)
            ),

            // MEDIA
            // images: Joi.array().allow(null),
            video_url: Joi.string().trim().max(500).empty('').allow(null).default(null),

            // SHIPPING
            shippable: Joi.boolean().empty('').default(true),
            customs_country_of_origin: Joi.alternatives().try(
                Joi.string().max(2),
                Joi.allow(null)
            ),
            customs_harmonized_system_code: Joi.alternatives().try(
                Joi.string(),
                Joi.allow(null)
            ),

            // PACKAGING
            ship_alone: Joi.boolean().empty('').default(false),
            packing_length_cm: joiPositiveNumberOrNull,
            packing_width_cm: joiPositiveNumberOrNull,
            packing_height_cm: joiPositiveNumberOrNull,

            tax_code: Joi.alternatives().try(
                Joi.string().trim().max(50),
                Joi.allow(null)
            ),

            variants: Joi.array().items(
                // Note: should not pass the 'isUpdate' flag to getSchema() in this case.
                // When creating a product, the user doesn't necessarily have to also create variants,
                // therefore updating a product may be the first time that a variants is added, in
                // which case the variant will not have an id
                Joi.object(this.ProductVariantCtrl.getSchema())
            ),

            product_artist_id: Joi.string().uuid().optional().empty('').allow(null).default(null),

            // TIMESTAMPS
            // created_at: Joi.date().optional(),
            // updated_at: Joi.date().optional()
        };

        if(isUpdate) {
            schema.id = Joi.string().uuid().required();
        }

        return schema;
    }


    getWithRelated() {
        return [
            {
                'variants': (query) => {
                    // query.where('published', '=', true);
                    query.orderBy('ordinal', 'ASC');
                },
                'variants.skus': (query) => {
                    // query.where('published', '=', true);
                    query.orderBy('ordinal', 'ASC');
                }
            },
            'artist'
            // 'skus.images.media'
        ];
    }


    async upsertHandler(request, h) {
        const variants = cloneDeep(request.payload.variants);
        delete request.payload.variants;

        return this.server.app.bookshelf.transaction(async (trx) => {
            try {
                // First upsert the Product
                const Product = await this.upsertModel(
                    request.payload,
                    { transacting: trx }
                );

                // Then upsert the ProductVariants
                if(Product && Array.isArray(variants)) {
                    const tenant_id = this.getTenantIdFromAuth(request);

                    for(let i=0, l=variants.length; i<l; i++) {
                        await this.ProductVariantCtrl.upsertVariant(
                            Product,
                            {
                                tenant_id: tenant_id,
                                product_id: Product.get('id'),
                                ...variants[i]
                            },
                            { transacting: trx }
                        )
                    }
                }

                return Product;
            }
            catch(err) {
                global.logger.error(err);
                global.bugsnag(err);
                throw Boom.badRequest(err);
            }
        })
        .then((Product) => {
            return h.apiSuccess(Product);
        })
        .catch((err) => {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        });
    }


    /**
     * Deletes a product, including its related variants
     *
     * @param {*} request
     * @param {*} h
     */
    async deleteHandler(request, h) {
        global.logger.info('REQUEST: ProductCtrl.deleteHandler', {
            meta: request.query
        });

        return this.server.app.bookshelf.transaction(async (trx) => {
            try {
                const productId = request.query.id;
                const tenantId = this.getTenantIdFromAuth(request);

                const Product = await this.modelForgeFetch(
                    {
                        id: productId,
                        tenant_id: tenantId
                    },
                    {
                        withRelated: ['variants'],
                        transacting: trx
                    }
                );

                if(!Product) {
                    throw Boom.badRequest('Unable to find product.');
                }

                // Delete the variants
                const variants = Product.related('variants').toArray();
                const promises = [];

                if(Array.isArray(variants)) {
                    for(let i=0, l=variants.length; i<l; i++) {
                        promises.push(
                            this.ProductVariantCtrl.deleteVariant(
                                variants[i].id,
                                tenantId,
                                { transacting: trx }
                            )
                        );
                    }
                }

                // Delete the product
                promises.push(
                    this.deleteModel(
                        productId,
                        tenantId,
                        { transacting: trx }
                    )
                );

                await Promise.all(promises);

                global.logger.info('RESPONSE: ProductCtrl.deleteHandler', {
                    meta: Product ? Product.toJSON() : null
                });

                return Product;
            }
            catch(err) {
                global.logger.error(err);
                global.bugsnag(err);
                throw Boom.badRequest(err);
            }
        })
        .then((Product) => {
            return h.apiSuccess(Product);
        })
        .catch((err) => {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        });
    }


    async getStripeTaxCodesHandler(request, h) {
        try {
            const tenantId = this.getTenantIdFromAuth(request);
            const stripe = await this.StripeCtrl.getStripe(tenantId);

            // https://stripe.com/docs/api/tax_codes/list?p=t
            const taxCodes = await stripe.taxCodes.list({
                limit: 999
            });

            return h.apiSuccess(taxCodes.data);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    fetchAllForTenantHandler(request, h) {
        return super.fetchAllForTenantHandler(
            request,
            h,
            { withRelated: this.getWithRelatedFetchConfig(request.query, this.getWithRelated()) }
        );
    }


    fetchOneForTenantHandler(request, h) {
        return super.fetchOneForTenantHandler(
            request,
            h,
            { withRelated: this.getWithRelatedFetchConfig(request.query, this.getWithRelated()) }
        );
    }


    // TODO: need to get product subtypes from DB, but globals file
    // TODO: uses productPicController
    async sitemapHandler(request, h) {
        // https://www.sitemaps.org/protocol.html
        const sitemapConfig = {
            hostname: `http://www.${process.env.DOMAIN_NAME}`,
            cacheTime: 600000, // 600 sec - cache purge period
            urls: [
                { url: '/returns/', changefreq: 'monthly', priority: 0.5 },
                { url: '/contact-us/', changefreq: 'monthly', priority: 0.5 },
                { url: '/privacy/', changefreq: 'monthly', priority: 0.5 },
                { url: '/conditions-of-use/', changefreq: 'monthly', priority: 0.5 }
            ]
        };

        // Object.keys(globalTypes.product.subtypes).forEach((key) => {
        //     if(key) {
        //         const parts = key.split('_');
        //         if(parts[2]) {
        //             sitemapConfig.urls.push({
        //                 url: `/${parts[2].toLowerCase()}/`,
        //                 changefreq: 'weekly',
        //                 priority: 0.8
        //             });
        //         }
        //     }
        // });

        const Products = await this.getModel()
            .query((qb) => {
                // qb.innerJoin('manufacturers', 'cars.manufacturer_id', 'manufacturers.id');
                // qb.groupBy('cars.id');
                qb.where('published', '=', true);
                // qb.andWhere(arr[0], arr[1], arr[2]);
            })
            .fetchPage({
                pageSize: 100,
                page: 1,
                withRelated: {
                    pics: (query) => {
                        query.where('published', '=', true);
                        query.orderBy('sort_order', 'ASC');
                    }
                }
            });

        Products.toJSON().forEach((obj) => {
            const prod = {
                url: `/q/${obj.seo_uri}`,
                changefreq: 'weekly',
                priority: 1
            };

            // set an image attribute if we can
            const imageUrl = this.featuredProductPic(obj);
            if(imageUrl) {
                prod.img = [
                    {
                        url: imageUrl,
                        title: obj.title ? obj.title.trim() : '',
                    }
                ]
            }

            sitemapConfig.urls.push(prod);
        });

        const sitemap = createSitemap(sitemapConfig);
        const xml = sitemap.toXML();

        return h.response(xml).type('application/xml')
    }


    // TODO: move to product variation?
    featuredProductPic(productJson) {
        let pic = null;

        if(Array.isArray(productJson.pics)) {
            const len = productJson.pics.length;

            // The related pics for a product are ordered by sort order (ASC)
            // so the first 'published' pic will be the featured pic
            for(let i=0; i<len; i++) {
                if(productJson.pics[i].published && productJson.pics[i].url) {
                    pic = productJson.pics[i].url;
                    break;
                }
            }
        }

        return pic;
    }

}

module.exports = ProductCtrl;
