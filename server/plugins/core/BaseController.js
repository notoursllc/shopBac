const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const queryString = require('query-string');
const isString = require('lodash.isstring');
const forEach = require('lodash.foreach');

class BaseController {

    constructor(server, modelName) {
        this.server = server;
        this.modelName = modelName;
    }


    getModel() {
        return this.server.app.bookshelf.model(this.modelName)
    }


    modelForgeFetch(forgeObj, fetchObj) {
        return this.getModel().forge(forgeObj).fetch(fetchObj);
    }


    /**
     * Gets a model by a given attribute, or all results if no attributes are passed
     *
     * @param attrName
     * @param attrValue
     * @returns {Promise}
     */
    getByAttribute(attrName, attrValue) {
        let forgeOpts = null;

        if(attrName) {
            forgeOpts = {};
            forgeOpts[attrName] = attrValue;
        }

        return this.modelForgeFetch(forgeOpts)
    }


    async getByIdHandler(id, fetchConfig, h) {
        try {
            global.logger.info(`REQUEST: BaseController.getByIdHandler (${this.modelName})`, {
                meta: {
                    id: id,
                    fetchConfig: fetchConfig
                }
            });

            const ModelInstance = await this.modelForgeFetch(
                {'id': id},
                fetchConfig
            )

            global.logger.info(`RESPONSE: BaseController.getByIdHandler (${this.modelName})`, {
                meta: ModelInstance ? ModelInstance.toJSON() : null
            });

            return h.apiSuccess(ModelInstance);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    /**
     * Route handler for creating a new model
     *
     * @param {*} request
     * @param {*} h
     */
    async createHandler(request, h) {
        try {
            global.logger.info(`REQUEST: BaseController.createHandler (${this.modelName})`, {
                meta: request.payload
            });

            const ModelInstance = await this.getModel().create(request.payload);

            global.logger.info(`RESPONSE: BaseController.createHandler (${this.modelName})`, {
                meta: ModelInstance ? ModelInstance.toJSON() : null
            });

            if(!ModelInstance) {
                throw Boom.badRequest(`Unable to create a new model (${this.modelName})`);
            }

            return h.apiSuccess(ModelInstance);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    /**
     * Route handler for updating a model
     *
     * @param {*} request
     * @param {*} h
     */
    async updateHandler(request, h) {
        try {
            global.logger.info(`REQUEST: BaseController.updateHandler (${this.modelName})`, {
                meta: request.payload
            });

            const ModelInstance = await this.getModel().update(
                request.payload,
                { id: request.payload.id }
            );

            global.logger.info(`RESPONSE: BaseController.updateHandler (${this.modelName})`, {
                meta: ModelInstance ? ModelInstance.toJSON() : null
            });

            if(!ModelInstance) {
                throw Boom.badRequest('Unable to find model');
            }

            return h.apiSuccess(ModelInstance);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async deleteHandler(id, h) {
        try {
            global.logger.info(`REQUEST: BaseController.deleteHandler (${this.modelName})`, {
                meta: { id }
            });

            const ModelInstance = await this.getModel().destroy({
                id: id
            });

            global.logger.info(`RESPONSE: BaseController.deleteHandler (${this.modelName})`, {
                meta: ModelInstance ? ModelInstance.toJSON() : null
            });

            if(!ModelInstance) {
                throw Boom.badRequest(`Unable to find model (${this.modelName})`);
            }

            return h.apiSuccess(
                ModelInstance.toJSON()
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async fetchAll(queryBufferModiferFn) {
        try {
            global.logger.info(`REQUEST: BaseController.fetchAll (${this.modelName})`);

            const Models = await this.getModel().query(queryBufferModiferFn).fetchAll();

            global.logger.info(`RESPONSE: BaseController.fetchAll (${this.modelName})`, {
                meta: Models ? Models.toJSON() : null
            });

            return Models;
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async fetchAllHandler(h, queryBufferModiferFn) {
        try {
            const Models = await this.fetchAll(queryBufferModiferFn);
            return h.apiSuccess(Models);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async getPageHandler(request, withRelatedConfig, h) {
        try {
            global.logger.info(`REQUEST: BaseController.getPageHandler (${this.modelName})`, {
                meta: {
                    query: request.query,
                    withRelatedConfig
                }
            });

            const Models = await this.fetchPage(request, withRelatedConfig);
            const pagination = Models ? Models.pagination : null;

            global.logger.info(`RESPONSE: BaseController.getPageHandler (${this.modelName})`, {
                meta: {
                    // logging the entire products json can be quite large,
                    // so avoiding it for now, and just logging the pagination data
                    pagination
                }
            });

            return h.apiSuccess(
                Models,
                pagination
            );
        }
        catch(err) {
            console.log(err)
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }


    queryHelper(request) {
        let response = {
            pageSize: null,
            page: null,
            orderBy: null,
            orderDir: 'DESC',
            where: null,
            whereRaw: null,
            andWhere: null,
            limit: null
        };

        let parsed = queryString.parse(request.url.search, {arrayFormat: 'bracket'});

        if(parsed.pageSize) {
            response.pageSize = parseInt(parsed.pageSize, 10) || null;
        }
        if(parsed.page) {
            response.page = parseInt(parsed.page, 10) || null;
        }
        if(parsed.limit) {
            response.limit = parseInt(parsed.limit, 10) || null;
        }
        if(parsed.orderDir === 'DESC' || parsed.orderDir === 'ASC') {
            response.orderDir = parsed.orderDir;
        }
        if(parsed.orderBy) {
            response.orderBy = parsed.orderBy;
        }
        if(parsed.whereRaw) {
            response.whereRaw = parsed.whereRaw;
        }
        if(parsed.where) {
            response.where = parsed.where;

            // and where:
            // andWhere: [ 'product_type_id,=,3', 'total_inventory_count,>,0' ]
            if(parsed.andWhere) {
                let andWhere = [];

                if(Array.isArray(parsed.andWhere)) {
                    forEach(parsed.andWhere, (val) => {
                        if(isString(val)) {
                            val = val.split(',').map((item) => {
                                return item.trim()
                            });
                        }

                        if(Array.isArray(val) && val.length === 3) {
                            andWhere.push(val);
                        }
                    });

                    if(andWhere.length) {
                        response.andWhere = andWhere;
                    }
                }
            }
        }

        return response;
    }


    fetchPage(request, withRelated) {
        let queryData = this.queryHelper(request);
        let config = {};

        if(queryData.hasOwnProperty('limit') && queryData.limit) {
            config.limit = queryData.limit;

            if(queryData.hasOwnProperty('offset')) {
                config.offset = queryData.offset;
            }
        }
        else {
            config = {
                pageSize: queryData.pageSize || 100,
                page: queryData.page || 1
            }
        }

        if(Array.isArray(withRelated) && withRelated.length) {
            config.withRelated = withRelated;
        }

        return this.getModel()
            .query((qb) => {
                // qb.innerJoin('manufacturers', 'cars.manufacturer_id', 'manufacturers.id');
                // qb.groupBy('cars.id');

                if(queryData.where) {
                    qb.where(queryData.where[0], queryData.where[1], queryData.where[2]);
                }

                if(queryData.whereRaw) {
                    if(queryData.whereRaw.length === 1) {
                        qb.whereRaw(queryData.whereRaw);
                    }
                    else {
                        qb.whereRaw(queryData.whereRaw.shift(), queryData.whereRaw);
                    }
                }

                if(queryData.andWhere) {
                    forEach(queryData.andWhere, function(arr) {
                        qb.andWhere(arr[0], arr[1], arr[2]);
                    });
                }
            })
            .orderBy(queryData.orderBy, queryData.orderDir)
            .fetchPage(config);
    }

}

module.exports = BaseController;
