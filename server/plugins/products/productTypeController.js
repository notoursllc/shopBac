'use strict';

const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const helperService = require('../../helpers.service');

let server = null;


function getModel() {
    return server.app.bookshelf.model('ProductType');
}


function setServer(s) {
    server = s;
}


function getProductTypeSchema() {
    return {
        name: Joi.string().max(100).required(),
        value: Joi.number().integer().min(0).required(),
        created_at: Joi.date(),
        updated_at: Joi.date()
    };
}


/**
 * Gets a product artist by a given attribute, or all results if no attributes are passed
 *
 * @param attrName
 * @param attrValue
 * @returns {Promise}
 */
async function getProductTypeByAttribute(attrName, attrValue) {
    let forgeOpts = null;

    if(attrName) {
        forgeOpts = {};
        forgeOpts[attrName] = attrValue;
    }

    return await getModel().forge(forgeOpts).fetch();
}



/***************************************
 * route handlers
 /**************************************/

 async function productTypeListHandler(request, h) {
    try {
        const ProductTypes = await getModel().query((qb) => {
            qb.where('is_available', '=', request.query.is_available === false ? false : true);
        }).fetchAll();

        return h.apiSuccess(
            ProductTypes.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.notFound(err);
    }
}


/**
 * Route handler for getting a ProductArtist by ID
 *
 * @param {*} request
 * @param {*} h
 */
async function getProductTypeByIdHandler(request, h) {
    try {
        const ProductType = await getProductTypeByAttribute('id', request.query.id)
        return h.apiSuccess(ProductType);
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


/**
 * Route handler for creating a new ProductArtist
 *
 * @param {*} request
 * @param {*} h
 */
async function productTypeCreateHandler(request, h) {
    try {
        const ProductType = await getModel().create(request.payload);

        if(!ProductType) {
            throw Boom.badRequest('Unable to create a a new product type.');
        }

        return h.apiSuccess(
            ProductType.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


/**
 * Route handler for updating a package type
 *
 * @param {*} request
 * @param {*} h
 */
async function productTypeUpdateHandler(request, h) {
    try {
        request.payload.updated_at = request.payload.updated_at || new Date();

        const ProductType = await getModel().update(
            request.payload,
            { id: request.payload.id }
        );

        if(!ProductType) {
            throw Boom.badRequest('Unable to find product type.');
        }

        return h.apiSuccess(
            ProductType.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


async function productTypeDeleteHandler(request, h) {
    try {
        const ProductType = await getModel().destroy({
            id
        });

        if(!ProductType) {
            throw Boom.badRequest('Unable to find product type.');
        }

        return h.apiSuccess(
            ProductType.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


// async function artistGetProductsHandler(request, h) {
//     try {
//         let parsed = queryString.parse(request.url.search, {arrayFormat: 'bracket'});
//         parsed.where = [
//             'product_artist_id',
//             '=',
//             request.query.id
//         ];

//         request.url.search = '?' + queryString.stringify(parsed, {sort: false, arrayFormat: 'bracket'})

//         const Products = await helperService.fetchPage(
//             request,
//             server.app.bookshelf.model('Product')
//         );

//         return h.apiSuccess(
//             Products,
//             Products.pagination
//         );
//     }
//     catch(err) {
//         global.logger.error(err);
//         global.bugsnag(err);
//         throw Boom.badRequest(err);
//     }
// }


module.exports = {
    setServer,
    getProductTypeSchema,
    getProductTypeByAttribute,
    productTypeListHandler,
    getProductTypeByIdHandler,
    productTypeCreateHandler,
    productTypeUpdateHandler,
    productTypeDeleteHandler,
}
