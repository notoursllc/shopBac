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
        is_available: Joi.boolean().default(true),
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
async function getTypeByAttribute(attrName, attrValue) {
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

 async function getTypeListHandler(request, h) {
    try {
        const ProductSubTypes = await getModel().query((qb) => {
            if(helperService.isBoolean(request.query.is_available)) {
                qb.where('is_available', '=', request.query.is_available);
            }
        }).fetchAll();

        return h.apiSuccess(
            ProductSubTypes.toJSON()
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
async function getTypeByIdHandler(request, h) {
    try {
        const ProductSubType = await getTypeByAttribute('id', request.query.id)
        return h.apiSuccess(ProductSubType);
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
async function typeCreateHandler(request, h) {
    try {
        const ProductSubType = await getModel().create(request.payload);

        if(!ProductSubType) {
            throw Boom.badRequest('Unable to create a new product sub-type.');
        }

        return h.apiSuccess(
            ProductSubType.toJSON()
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
async function typeUpdateHandler(request, h) {
    try {
        request.payload.updated_at = request.payload.updated_at || new Date();

        const ProductSubType = await getModel().update(
            request.payload,
            { id: request.payload.id }
        );

        if(!ProductSubType) {
            throw Boom.badRequest('Unable to find product sub-type.');
        }

        return h.apiSuccess(
            ProductSubType.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


async function typeDeleteHandler(request, h) {
    try {
        const ProductSubType = await getModel().destroy({
            id: request.query.id
        });

        if(!ProductSubType) {
            throw Boom.badRequest('Unable to find product sub-type.');
        }

        return h.apiSuccess(
            ProductSubType.toJSON()
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
    getTypeByAttribute,
    getTypeListHandler,
    getTypeByIdHandler,
    typeCreateHandler,
    typeUpdateHandler,
    typeDeleteHandler
}
