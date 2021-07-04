const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const isObject = require('lodash.isobject');
const cloneDeep = require('lodash.clonedeep');
const { createSitemap } = require('sitemap');
const BaseController = require('../../core/controllers/BaseController');
const helperService = require('../../../helpers.service');
const globalTypes = require('../../../global_types.js');
const ProductVariantCtrl = require('./ProductVariantCtrl');


class ProductCtrl extends BaseController {

    constructor(server) {
        super(server, 'Product');
        this.ProductVariantCtrl = new ProductVariantCtrl(server);
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
            type: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null) ),
            sub_type: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null) ),
            sales_channel_type: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null) ),
            package_type: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null) ),
            vendor_type: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null) ),
            collections: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null) ),
            gender_type: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null) ),
            fit_type: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null) ),
            sleeve_length_type: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null) ),
            feature_type: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null) ),
            // vendor_id: Joi.string().uuid().optional().empty('').allow(null).default(null),

            // SEO
            seo_page_title: Joi.alternatives().try(Joi.string().trim().max(70), Joi.allow(null)),
            seo_page_desc: Joi.alternatives().try(Joi.string().trim().max(320), Joi.allow(null)),
            seo_uri: Joi.alternatives().try(Joi.string().trim().max(50), Joi.allow(null)),

            // MEDIA
            // images: Joi.array().allow(null),
            video_url: Joi.string().trim().max(500).empty('').allow(null).default(null),

            // SHIPPING
            shippable: Joi.boolean().empty('').default(true),
            ship_alone: Joi.boolean().empty('').default(false),
            customs_country_of_origin: Joi.alternatives().try(
                Joi.string().max(2),
                Joi.allow(null)
            ),
            customs_harmonized_system_code: Joi.alternatives().try(
                Joi.string(),
                Joi.allow(null)
            ),

            variants: Joi.array().items(
                // Note: should not pass the 'isUpdate' flag to getSchema() in this case.
                // When creating a product, the user doesn't necessarily have to also create variants,
                // therefore updating a product may be the first time that a variants is added, in
                // which case the variant will not have an id
                Joi.object(this.ProductVariantCtrl.getSchema())
            ),

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
            // 'skus.images.media'
        ];
    }


    getPageHandler(request, h) {
        return super.getPageHandler(
            request,
            this.getWithRelated(),
            h
        );
    }


    deleteVariants(Product, tenantId) {
        const variants = Product.related('variants').toArray();
        const promises = [];

        if(Array.isArray(variants)) {
            try {
                variants.forEach((obj) => {
                    promises.push(
                        this.ProductVariantCtrl.deleteVariant(obj.id, tenantId)
                    );
                });
            }
            catch(err) {
                global.logger.error('ProductCtrl.deleteVariants - ERROR DELETING PRODUCT VARIANTS: ', err);
                throw err;
            }
        }

        return Promise.all(promises);
    }


    async upsertHandler(request, h) {
        try {
            const variants = cloneDeep(request.payload.variants);
            delete request.payload.variants;

            const Product = await this.upsertModel(request.payload);

            if(Product) {
                const promises = [];
                const tenant_id = this.getTenantIdFromAuth(request);

                promises.push(
                    this.ProductVariantCtrl.upsertVariants(
                        variants,
                        Product.get('id'),
                        tenant_id
                    )
                );

                await Promise.all(promises);
            }

            return h.apiSuccess(Product);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    /**
     * Deletes a product, including its related variants
     *
     * @param {*} request
     * @param {*} h
     */
    async deleteHandler(request, h) {
        try {
            global.logger.info('REQUEST: ProductCtrl.deleteHandler', {
                meta: request.query
            });

            const productId = request.query.id;
            const tenantId = this.getTenantIdFromAuth(request);

            const Product = await this.modelForgeFetch(
                { id: productId, tenant_id: tenantId },
                { withRelated: ['variants'] }
            );

            if(!Product) {
                throw Boom.badRequest('Unable to find product.');
            }

            await Promise.all([
                this.deleteVariants(Product, tenantId),
                this.deleteModel(productId, tenantId)
            ]);

            global.logger.info('RESPONSE: ProductCtrl.deleteHandler', {
                meta: Product ? Product.toJSON() : null
            });

            return h.apiSuccess(Product);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    getAdminProductList(request, h) {
        const withSelectedOpts = [
            'skus'
        ];

        return this.getPageHandler(request, withSelectedOpts, h);
    }


    productInfoHandler(request, h) {
        return h.apiSuccess({
            types: globalTypes.product.types,
            subTypes: globalTypes.product.subtypes,
            fits: globalTypes.product.fits
        });
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

        Object.keys(globalTypes.product.subtypes).forEach((key) => {
            if(key) {
                const parts = key.split('_');
                if(parts[2]) {
                    sitemapConfig.urls.push({
                        url: `/${parts[2].toLowerCase()}/`,
                        changefreq: 'weekly',
                        priority: 0.8
                    });
                }
            }
        });

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


    // TODO STILL NEEDS REFACTORING
    async productShareHandler(request, h) {
        try {
            const uriParts = request.query.uri.split('/');
            const seoUri = uriParts[uriParts.length - 1];

            const Product = await getProductByAttribute('seo_uri', seoUri);
            const p = isObject(Product) ? Product.toJSON() : {};
            const url = helperService.getSiteUrl(true);
            const urlImages = `${url}/images/`;
            const featuredPic = this.featuredProductPic(p);

            return await h.view('views/socialshare', {
                title: p.title || `Welcome to ${helperService.getBrandName()}`,
                description: p.description_short || '',
                image: featuredPic ? `${urlImages}product/${featuredPic}` : `${urlImages}logo_email.png`,
                url: `${url}/${request.query.uri}`
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
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
