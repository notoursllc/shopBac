const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const isObject = require('lodash.isobject');
const { createSitemap } = require('sitemap');
const BaseController = require('../../core/BaseController');
const helperService = require('../../../helpers.service');
const globalTypes = require('../../../global_types.js');
// const ProductVariationCtrl = require('../controllers/ProductVariationCtrl');


class ProductCtrl extends BaseController {

    constructor(server) {
        super(server, 'Product');
        // this.ProductVariationController = new ProductVariationCtrl(server, 'ProductVariation');
    }


    getSchema() {
        return {
            vendor: Joi.string().max(100).allow(null),
            published: Joi.boolean().default(false),

            // TYPES
            fit_type: Joi.number().integer().positive().allow(null),
            type: Joi.number().integer().positive().default(1),
            sub_type: Joi.number().integer().positive().allow(null),
            sales_channel_type: Joi.number().integer().positive().allow(null),
            collections: Joi.number().integer().positive().allow(null),

            // GENERAL
            title: Joi.string().max(100).allow(null),
            description: Joi.string().max(500).allow(null),
            video_url: Joi.string().max(500).allow(null),

            // SEO
            seo_page_title: Joi.string().max(100).allow(null),
            seo_page_desc: Joi.string().allow(null),
            seo_uri: Joi.string().max(50).allow(null),

            // PRICING
            base_price: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            sale_price: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            is_on_sale: Joi.boolean().default(false),
            cost: Joi.number().precision(2).min(0).max(99999999.99).allow(null),

            // INVENTORY
            inventory_count: Joi.number().allow(null),
            sku: Joi.string().allow(null),
            barcode: Joi.string().allow(null),
            hide_if_out_of_stock: Joi.boolean().default(true),

            // SHIPPING
            weight_oz: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            customs_country_of_origin: Joi.string().max(2).allow(null),
            customs_harmonized_system_code: Joi.number().allow(null),

            // TAXES
            tax_code: Joi.number().allow(null),

            // TIMESTAMPS
            created_at: Joi.date().optional(),
            updated_at: Joi.date().optional()
        };
    }


    getWithRelated(opts, details) {
        let options = opts || {};
        let related = [
            {
                pics: (query) => {
                    if(!options.viewAllRelated) {
                        query.where('published', '=', true);
                    }
                    query.orderBy('ordinal', 'ASC');
                }
            }
        ];

        if(details) {
            related.push(
                // 'variations.options',
                'pics.pic_variants',
                'option_labels'
            );
        }

        return related;
    }



    async getProductByIdHandler(request, h) {
        return this.getByIdHandler(
            request.query.id,
            { withRelated: this.getWithRelated(request.query, true) },
            h
        );
    }


    async productSeoHandler(request, h) {
        try {
            global.logger.info('REQUEST: productSeoHandler', {
                meta: request.query
            });

            const Product = await this.modelForgeFetch(
                { 'seo_uri': request.query.id },
                { withRelated: this.getWithRelated(request.query, true) }
            );

            const productJson = Product ? Product.toJSON() : null;

            global.logger.info('RESPONSE: productSeoHandler', {
                meta: productJson
            });

            return h.apiSuccess(productJson);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    /**
     * Deletes a product, including all of its variations and pictures
     *
     * @param {*} request
     * @param {*} h
     */
    async productDeleteHandler(request, h) {
        try {
            global.logger.info('REQUEST: ProductCtrl.productDeleteHandler', {
                meta: request.query
            });

            const productId = request.query.id;

            const Product = await this.modelForgeFetch(
                { id: productId },
                { withRelated: this.getWithRelated(request.query) }
            );

            if(!Product) {
                throw Boom.badRequest('Unable to find product.');
            }

            const productJson = Product.toJSON();

            global.logger.info('ProductCtrl.productDeleteHandler - VARIATIONS', {
                meta: productJson.variations
            });

            // Delete product variations
            if(Array.isArray(productJson.variations)) {
                try {
                    const variationPromises = [];

                    productJson.variations.forEach((variation) => {
                        variationPromises.push(
                            // TODO - needs refactoring
                            // this.ProductVariationController.deleteVariation(variation.id)
                        );
                    });

                    await Promise.all(variationPromises);
                }
                catch(err) {
                    global.logger.error("productDeleteHandler - ERROR DELETING PRODUCT VARIATIONS", err)
                    throw err;
                }
            }

            await this.getModel().destroy({ id: productId })

            global.logger.info('RESPONSE: ProductCtrl.productDeleteHandler', {
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
            cacheTime: 600000,        // 600 sec - cache purge period
            urls: [
              { url: '/returns/',  changefreq: 'monthly', priority: 0.5 },
              { url: '/contact-us/',  changefreq: 'monthly', priority: 0.5 },
              { url: '/privacy/',  changefreq: 'monthly', priority: 0.5 },
              { url: '/conditions-of-use/',  changefreq: 'monthly', priority: 0.5 },
            ]
        };

        Object.keys(globalTypes.product.subtypes).forEach((key) => {
            if(key) {
                let parts = key.split('_');
                if(parts[2]) {
                    sitemapConfig.urls.push({
                        url: `/${parts[2].toLowerCase()}/`,
                        changefreq: 'weekly',
                        priority: 0.8
                    })
                }
            }
        });

        const Products = await this.getModel().query((qb) => {
            // qb.innerJoin('manufacturers', 'cars.manufacturer_id', 'manufacturers.id');
            // qb.groupBy('cars.id');
            qb.where('is_available', '=', true);
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
            let prod = {
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
            let uriParts = request.query.uri.split('/');
            let seoUri = uriParts[uriParts.length - 1];

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
            let len = productJson.pics.length;

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
