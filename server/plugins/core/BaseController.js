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


    /**
     * Creates or updates a model
     * Note this method does not add the tenant_id to the payload
     *
     * @param {*} data
     */
    async upsertModel(data) {
        try {
            global.logger.info(`REQUEST: BaseController.upsertModel (${this.modelName})`, {
                meta: data
            });

            const ModelInstance = data.id
                ? await this.getModel().update(data, {id: data.id})
                : await this.getModel().create(data);

            global.logger.info(`RESPONSE: BaseController.upsertModel (${this.modelName})`, {
                meta: {
                    model: ModelInstance ? ModelInstance.toJSON() : null
                }
            });

            return ModelInstance;
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }
    }


    /**
     * Route handler for upserting a model
     *
     * @param {*} request
     * @param {*} h
     */
    async upsertHandler(request, h) {
        try {
            const ModelInstance = await this.upsertModel(request.payload);

            if(!ModelInstance) {
                throw Boom.badRequest(`Unable to ${request.payload.id ? 'update' : 'create'} model (${this.modelName})`);
            }

            return h.apiSuccess(ModelInstance);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async deleteModel(id, tenant_id) {
        global.logger.info(`REQUEST: BaseController.deleteModel (${this.modelName})`, {
            meta: {
                id,
                tenant_id
            }
        });

        const ModelInstance = await this.getModel().destroy({
            id,
            tenant_id
        });

        global.logger.info(`RESPONSE: BaseController.deleteModel (${this.modelName})`, {
            meta: ModelInstance ? ModelInstance.toJSON() : null
        });

        return ModelInstance;
    }


    async deleteHandler(request, h) {
        try {
            const ModelInstance = await this.deleteModel(
                request.query.id,
                this.getTenantId(request)
            );

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


    async modelForgeFetch(forgeOptions, fetchOptions) {
        global.logger.info(`REQUEST: BaseController.modelForgeFetch (${this.modelName})`, {
            meta: {
                forgeOptions,
                fetchOptions
            }
        });

        const ModelInstance = await this.getModel()
            .forge(forgeOptions)
            .fetch(fetchOptions);

        global.logger.info(`RESPONSE: BaseController.modelForgeFetch (${this.modelName})`, {
            meta: {
                model: ModelInstance ? ModelInstance.toJSON() : null
            }
        });

        return ModelInstance;
    }


    async modelForgeFetchHandler(forgeOptions, fetchOptions, h) {
        try {
            const ModelInstance = await this.modelForgeFetch(forgeOptions, fetchOptions);
            return h.apiSuccess(ModelInstance);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    getByIdHandler(request, fetchOptions, h) {
        return this.modelForgeFetchHandler(
            { id: request.query.id },
            fetchOptions,
            h
        );
    }

    // async getByIdHandler(request, fetchOptions, h) {
    //     return await this.modelForgeFetchHandler(
    //         { id: request.query.id, tenant_id: this.getTenantId(request) },
    //         fetchOptions,
    //         h
    //     );
    // }


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

        const parsed = queryString.parse(request.url.search, {arrayFormat: 'bracket'});

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
                const andWhere = [];

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
        const queryData = this.queryHelper(request);
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
            };
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

                // tenant id
                if(request.query && request.query.tenant_id) {
                    qb.andWhere('tenant_id', '=', request.query.tenant_id);
                }
            })
            .orderBy(queryData.orderBy, queryData.orderDir)
            .fetchPage(config);
    }


    getTenantId(request) {
        // https://github.com/BoseCorp/hapi-auth-jwt2#want-to-access-the-jwt-token-after-validation
        return request.auth.credentials.id;
    }


    addTenantId(request, requestKey) {
        const tenantId = this.getTenantId(request);

        if(requestKey) {
            request[requestKey].tenant_id = tenantId;
        }
        else {
            request.tenant_id = tenantId;
        }
    }

}

module.exports = BaseController;
