const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const cloneDeep = require('lodash.clonedeep');
const { createSitemap } = require('sitemap');
const BaseController = require('../../core/controllers/BaseController');
const ProductVariantCtrl = require('./ProductVariantCtrl');
const ProductDao = require('../dao/ProductDao.js');
const ProductVariantDao = require('../dao/ProductVariantDao.js');
const ProductVariantSkuDao = require('../dao/ProductVariantSkuDao.js');


class ProductCtrl extends BaseController {

    constructor(server) {
        super(server, 'Product');
        this.ProductVariantCtrl = new ProductVariantCtrl(server);
        this.ProductDao = new ProductDao(server);
        this.ProductVariantDao = new ProductVariantDao(server);
        this.ProductVariantSkuDao = new ProductVariantSkuDao(server);
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


    async createHandler(request, h) {
        try {
            const tenant_id = this.getTenantIdFromAuth(request);
            const trx = await this.ProductDao.knex.transaction();

            const productIds = await this.ProductDao.tenantInsert(
                tenant_id,
                this.ProductDao.stripInvalidCols(request.payload),
                trx
            );

            if(Array.isArray(request.payload.variants)) {
                // NOTE: using a for loop allows for using async/await inside the loop
                for (let i=0, l=request.payload.variants.length; i<l; i++) {
                    const variant = request.payload.variants[i];

                    const variantIds = await this.ProductVariantDao.tenantInsert(
                        tenant_id,
                        {
                            ...this.ProductVariantDao.stripInvalidCols(variant),
                            product_id: productIds[0]
                        },
                        trx
                    );

                    // insert variant SKUS for this variant
                    if(Array.isArray(variant.skus)) {
                        const variantSkuPayload = variant.skus.map((sku) => {
                            return this.ProductVariantSkuDao.stripInvalidCols({
                                ...sku,
                                product_variant_id: variantIds[0]
                            });
                        });

                        if(variantSkuPayload.length) {
                            await this.ProductVariantSkuDao.tenantInsert(
                                tenant_id,
                                variantSkuPayload,
                                trx
                            );
                        }
                    }
                }
            }

            await trx.commit();

            const Product = await this.ProductDao.tenantGet(
                tenant_id,
                productIds[0]
            );

            // console.log("RETURNING PRODUCT", Product[0]);

            return h.apiSuccess(Product[0]);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }

    // async createHandler(request, h) {
    //     try {
    //         const tenant_id = this.getTenantIdFromAuth(request);

    //         const productIds = await this.ProductDao.tenantInsert(
    //             tenant_id,
    //             request.payload
    //         );

    //         console.log("CONTROLLER INSERT RESPOSNE", productIds)

    //         const Product = await this.ProductDao.tenantGetOne(
    //             tenant_id,
    //             productIds[0]
    //         );

    //         console.log("RETURNING PRODUCT", Product[0]);

    //         return h.apiSuccess(Product[0]);
    //     }
    //     catch(err) {
    //         global.logger.error(err);
    //         global.bugsnag(err);
    //         throw Boom.badRequest(err);
    //     }
    // }

    async upsertHandler(request, h) {
        try {
            const tenant_id = this.getTenantIdFromAuth(request);

            const variants = cloneDeep(request.payload.variants);
            delete request.payload.variants;

            let productId;

            if(request.payload.id) {
                productId = this.ProductDao.tenantUpdate(
                    tenant_id,
                    request.payload.id,
                    request.payload
                );
            }
            else {
                productId = this.ProductDao.tenantInsert(
                    tenant_id,
                    request.payload
                );
            }

            if(productId) {
                const promises = [];

                //TODO: create ProductVariantDao
                promises.push(
                    this.ProductVariantCtrl.upsertVariants(
                        variants,
                        Product.get('id'),
                        tenant_id
                    )
                );

                await Promise.all(promises);
            }

            // const Product = await this.upsertModel(request.payload);

            // if(Product) {
            //     const promises = [];
            //     const tenant_id = this.getTenantIdFromAuth(request);

            //     promises.push(
            //         this.ProductVariantCtrl.upsertVariants(
            //             variants,
            //             Product.get('id'),
            //             tenant_id
            //         )
            //     );

            //     await Promise.all(promises);
            // }

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
