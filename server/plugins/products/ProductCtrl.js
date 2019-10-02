const Joi = require('@hapi/joi');
const isObject = require('lodash.isobject');
const { createSitemap } = require('sitemap');
const BaseController = require('./BaseController');
const helperService = require('../../helpers.service');
const globalTypes = require('../../global_types.js');
const ProductPicCtrl = require('./ProductPicCtrl');

class ProductCtrl extends BaseController {

    constructor(server, modelName) {
        super(server, modelName);
        this.ProductPicController = new ProductPicCtrl(server, 'ProductPic');
    }


    getSchema() {
        return {
            title: Joi.string().max(100).allow(null),
            description_short: Joi.string().max(500).allow(null),
            description_long: Joi.string().max(750).allow(null),
            seo_uri: Joi.string().max(50).allow(null),
            base_price: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            sale_price: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            is_on_sale: Joi.boolean().default(false),
            is_available: Joi.boolean().default(false),
            tax_code: Joi.number().allow(null),
            video_url: Joi.string().max(500).allow(null),
            fit: Joi.number().integer().positive().allow(null),
            type: Joi.number().integer().positive().default(1),
            sub_type: Joi.number().integer().positive().allow(null),
            shipping_package_type: Joi.number().integer().positive().allow(null),
            material_type: Joi.number().integer().positive().allow(null),
            product_artist_id: Joi.string().uuid().allow(null),
            created_at: Joi.date().optional(),
            updated_at: Joi.date().optional()
        };
    }


    getWithRelated(opts) {
        let options = opts || {};

        return [
            'artist',
            {
                sizes: (query) => {
                    if(!options.viewAllRelated) {
                        query.where('is_visible', '=', true);
                    }
                    query.orderBy('sort', 'ASC');
                },

                variations: (query) => {
                    if(!options.viewAllRelated) {
                        query.where('published', '=', true);
                    }
                    query.orderBy('ordinal', 'ASC');
                },

                pics: (query) => {
                    if(!options.viewAllRelated) {
                        query.where('is_visible', '=', true);
                    }
                    query.orderBy('sort_order', 'ASC');
                }
            }
        ]
    }


    async getProductByIdHandler(request, h) {
        let withRelated = this.getWithRelated(request.query);
        withRelated.push('variations.options');

        return this.getByIdHandler(
            request.query.id,
            { withRelated: withRelated },
            h
        );
    }


    async productSeoHandler(request, h) {
        try {
            let withRelated = this.getWithRelated();
            withRelated.push('pics.pic_variants', 'variations.options');

            global.logger.info('REQUEST: productSeoHandler', {
                meta: request.query
            });

            const Product = await this.modelForgeFetch(
                { 'seo_uri': request.query.id },
                { withRelated: withRelated }
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
     * Deletes a product, including all of its sizes, pictures and artist
     *
     * @param {*} request
     * @param {*} h
     */

     //TODO THIS STILL NEEDS REFACTORING
    async productDeleteHandler(request, h) {
        try {
            const productId = request.query.id;

            const Product = await this.modelForgeFetch(
                { id: productId },
                { withRelated: getWithRelated(request.query) }
            );

            if(!Product) {
                throw Boom.badRequest('Unable to find product.');
            }

            const productJSON = Product.toJSON();

            // Delete product pics
            if(productJSON.hasOwnProperty('pics')) {
                try {
                    const picPromises = [];

                    productJSON.pics.forEach((pic) => {
                        picPromises.push(
                            ProductPicController.deletePic(pic.id)
                        )
                    });

                    await Promise.all(picPromises);
                }
                catch(err) {
                    global.logger.error("productDeleteHandler - ERROR DELETING PRODUCT PICS", err)
                    throw err;
                }
            }

            // Delete product sizes
            if(productJSON.hasOwnProperty('sizes')) {
                try {
                    const sizePromises = [];

                    productJSON.sizes.forEach((size) => {
                        sizePromises.push(
                            productSizeController.deleteProductSize(size.id)
                        )
                    });

                    await Promise.all(sizePromises);
                }
                catch(err) {
                    global.logger.error("productDeleteHandler - ERROR DELETING PRODUCT SIZES", err)
                    throw err;
                }
            }

            // Delete this product model
            await this.getModel().destroy({ id: productId })

            return h.apiSuccess({
                id: productId
            });
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
            sizes: globalTypes.product.sizes,
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
                    query.where('is_visible', '=', true);
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


    async getProductsForArtistHandler(artistId, h) {
        return this.fetchAll(h, (qb) => {
            qb.where('product_artist_id', '=', artistId);
        });
    }


    featuredProductPic(productJson) {
        let pic = null;

        if(Array.isArray(productJson.pics)) {
            let len = productJson.pics.length;

            // The related sizes for a product are ordered by sort order (ASC)
            // so the first 'is_visible' pic will be the featured pic
            for(let i=0; i<len; i++) {
                if(productJson.pics[i].is_visible && productJson.pics[i].url) {
                    pic = productJson.pics[i].url;
                    break;
                }
            }
        }

        return pic;
    }

}

module.exports = ProductCtrl;
