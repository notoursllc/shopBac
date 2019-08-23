'use strict';

const isObject = require('lodash.isobject');
const Boom = require('@hapi/boom');
const { createSitemap } = require('sitemap');
const helperService = require('../../helpers.service');
const productPicController = require('./productPicController');
const globalTypes = require('../../global_types.js');


let server = null;


function getModel() {
    return server.app.bookshelf.model('Product');
}


function setServer(s) {
    server = s;
}


function getWithRelated(opts) {
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

            pics: (query) => {
                if(!options.viewAllRelated) {
                    query.where('is_visible', '=', true);
                }
                query.orderBy('sort_order', 'ASC');
            }
        }
    ]
}


/**
 * Gets a product by a given attribute
 *
 * @param attrName
 * @param attrValue
 * @returns {Promise}
 */
async function getProductByAttribute(attrName, attrValue) {
    let forgeOpts = null;

    if(attrName) {
        forgeOpts = {};
        forgeOpts[attrName] = attrValue;
    }

    return await getModel().forge(forgeOpts).fetch({
        withRelated: getWithRelated()
    });
}


/***************************************
 * route handlers
 /**************************************/

async function productShareHandler(request, h) {
    try {
        let uriParts = request.query.uri.split('/');
        let seoUri = uriParts[uriParts.length - 1];

        const Product = await getProductByAttribute('seo_uri', seoUri);
        const p = isObject(Product) ? Product.toJSON() : {};
        const url = helperService.getSiteUrl(true);
        const urlImages = `${url}/images/`;
        const featuredPic = productPicController.featuredProductPic(p);

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


async function getProductByIdHandler(request, h) {
    try {
        global.logger.info('REQUEST: getProductByIdHandler', {
            meta: request.query
        });

        const Product = await getModel()
            .forge({ id: request.query.id })
            .fetch({
                withRelated: getWithRelated(request.query)
            });

        const productJson = Product ? Product.toJSON() : null;

        global.logger.info('RESPONSE: getProductByIdHandler', {
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


async function productSeoHandler(request, h) {
    try {
        let withRelated = getWithRelated();
        withRelated.push('pics.pic_variants');

        global.logger.info('REQUEST: productSeoHandler', {
            meta: request.query
        });

        const Products = await getModel()
            .forge({
                'seo_uri': request.query.id
            })
            .fetch({
                withRelated
            });

        const productsJson = Products ? Products.toJSON() : null;

        global.logger.info('RESPONSE: productSeoHandler', {
            meta: productsJson
        });

        return h.apiSuccess(productsJson);
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


function productInfoHandler(request, h) {
    return h.apiSuccess({
        types: globalTypes.product.types,
        subTypes: globalTypes.product.subtypes,
        sizes: globalTypes.product.sizes,
        fits: globalTypes.product.fits
    });
}


async function getProductsHandler(request, h) {
    try {
        global.logger.info('REQUEST: getProductsHandler', {
            meta: request.query
        });

        const Products = await helperService.fetchPage(
            request,
            getModel(),
            getWithRelated()
        );

        const pagination = Products ? Products.pagination : null;

        global.logger.info('RESPONSE: getProductsHandler', {
            meta: {
                // logging the entire products json can be quite large,
                // so avoiding it for now, and just logging the pagination data
                pagination
            }
        });

        return h.apiSuccess(
            Products,
            pagination
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.notFound(err);
    }
}


async function productCreateHandler(request, h) {
    try {
        const Product = await getModel().create(request.payload);

        if(!Product) {
            throw Boom.badRequest('Unable to create product.');
        }

        return h.apiSuccess(
            Product.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


async function productUpdateHandler(request, h) {
    try {
        request.payload.updated_at = request.payload.updated_at || new Date();

        const Product = await getModel().update(
            request.payload,
            { id: request.payload.id }
        );

        if(!Product) {
            throw Boom.badRequest('Unable to find product.');
        }

        return h.apiSuccess(
            Product.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


async function sitemapHandler(request, h) {
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
                sitemapConfig.urls.push(
                    { url: `/${parts[2].toLowerCase()}/`,  changefreq: 'monthly', priority: 0.8 },
                )
            }
        }
    });

    const Products = await getModel().query((qb) => {
        // qb.innerJoin('manufacturers', 'cars.manufacturer_id', 'manufacturers.id');
        // qb.groupBy('cars.id');
        qb.where('is_available', '=', true);
        // qb.andWhere(arr[0], arr[1], arr[2]);
    })
    .fetchPage({
        pageSize: 100,
        page: 1
    });

    Products.toJSON().forEach((obj) => {
        sitemapConfig.urls.push({
            url: `/q/${obj.seo_uri}`,
            changefreq: 'monthly',
            priority: 1
        })
    });

    const sitemap = createSitemap(sitemapConfig);
    const xml = sitemap.toXML();

    return h.response(xml).type('application/xml')
}


module.exports = {
    setServer,
    getProductByAttribute,

    // route handlers
    productShareHandler,
    getProductByIdHandler,
    productSeoHandler,
    productInfoHandler,
    getProductsHandler,
    productCreateHandler,
    productUpdateHandler,
    sitemapHandler
};
