'use strict';

const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const helperService = require('../../helpers.service');

let server = null;


function getModel() {
    return server.app.bookshelf.model('ProductSubType');
}


function setServer(s) {
    server = s;
}


function getProductSubTypeSchema() {
    return {
        name: Joi.string().max(100).required(),
        value: Joi.number().integer().min(0).required(),
        slug: Joi.string().required(),
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
async function getProductSubTypeByAttribute(attrName, attrValue) {
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

 async function productSubTypeListHandler(request, h) {
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
 * Route handler for creating a new ProductArtist
 *
 * @param {*} request
 * @param {*} h
 */
async function productSubTypeCreateHandler(request, h) {
    try {
        const ProductType = await getModel().create(request.payload);

        if(!ProductType) {
            throw Boom.badRequest('Unable to create a a new product sub-type.');
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
async function productSubTypeUpdateHandler(request, h) {
    try {
        request.payload.updated_at = request.payload.updated_at || new Date();

        const ProductType = await getModel().update(
            request.payload,
            { id: request.payload.id }
        );

        if(!ProductType) {
            throw Boom.badRequest('Unable to find product sub-type.');
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


async function productSubTypeDeleteHandler(request, h) {
    try {
        const ProductType = await getModel().destroy({
            id
        });

        if(!ProductType) {
            throw Boom.badRequest('Unable to find product sub-type.');
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


module.exports = {
    setServer,
    getProductSubTypeSchema,
    getProductSubTypeByAttribute,
    productSubTypeListHandler,
    productSubTypeCreateHandler,
    productSubTypeUpdateHandler,
    productSubTypeDeleteHandler,
}
