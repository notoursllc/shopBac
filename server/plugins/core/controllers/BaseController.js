const Joi = require('joi');
const Boom = require('@hapi/boom');
const SqlOperatorBuilder = require('../services/SqlOperatorBuilder.js');

class BaseController {

    constructor(server, modelName) {
        this.server = server;
        this.modelName = modelName;
    }


    getModel() {
        return this.server.app.bookshelf.model(this.modelName)
    }


    getTenantIdFromAuth(request) {
        return request.auth.credentials.tenant_id;
    }


    getAuthStrategy(request) {
        return request.auth.strategy;
    }


    isAuthStrategy_storeauth(request) {
        return this.getAuthStrategy(request) === 'storeauth';
    }


    isAuthStrategy_session(request) {
        return this.getAuthStrategy(request) === 'session';
    }


    getPaginationSchema() {
        return {
            _sort: Joi.string().max(50),

            _pageSize: Joi.alternatives().try(
                Joi.number().integer().min(0),
                Joi.string().max(5)
            ),

            _page: Joi.alternatives().try(
                Joi.number().integer().min(0),
                Joi.string().max(5)
            )
        };
    }


    getTenantIdSchema() {
        return {
            tenant_id: Joi.string().uuid().required()
        }
    }


    getWithRelatedSchema() {
        return {
            _withRelated: Joi.string()
        }
    }


    /**
     * The .fetch() knex method acceps an object of options that
     * can include a param called "withRelated".
     * *
     * @param {*} requestQuery
     * @param {*} allRelationsObj   All possible relations
     * @returns
     */
    getWithRelatedFetchConfig(requestQuery, allRelationsObj) {
        if(!requestQuery._withRelated) {
            return {};
        }

        const relations = requestQuery._withRelated.split(',').map(item => item.trim());

        // Return all of the relations if the query contains '*'
        if(relations.includes('*')) {
            return allRelationsObj
        }
        else {
            let withRelated = {}
            // Only set if the relation name that was passed exists in allRelationsObj
            relations.forEach((key) => {
                if(allRelationsObj.hasOwnProperty(key)) {
                    withRelated[key] = allRelationsObj[key];
                }
            });

            return withRelated;
        }
    }


    /**
     * Creates or updates a model
     * Note this method does not add the tenant_id to the payload
     *
     * @param {*} data
     */
    async upsertModel(data, options) {
        global.logger.info(`REQUEST: BaseController.upsertModel (${this.modelName})`, {
            meta: {
                data,
                options
            }
        });

        // this fixes an edge case where sending an id attribute with a null value
        // would cause the create method to throw an error because it expects the payload
        // not to have an id attribute
        const modelId = data.id;
        if(!modelId) {
            delete data.id;
        }

        // https://bookshelfjs.org/api.html#Model-instance-save
        const ModelInstance = await this.getModel()
            .forge(
                modelId ? {id: modelId} : null
            )
            .save(data, options)

        global.logger.info(`RESPONSE: BaseController.upsertModel (${this.modelName})`, {
            meta: {
                model: ModelInstance ? ModelInstance.toJSON() : null
            }
        });

        return ModelInstance;
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


    async deleteModel(id, tenant_id, options) {
        global.logger.info(`REQUEST: BaseController.deleteModel (${this.modelName})`, {
            meta: {
                id,
                tenant_id
            }
        });

        const ModelInstance = await this.getModel()
            .forge({
                id,
                tenant_id
            })
            .destroy(options);

        global.logger.info(`RESPONSE: BaseController.deleteModel (${this.modelName})`, {
            meta: ModelInstance ? ModelInstance.toJSON() : null
        });

        return ModelInstance;
    }


    async deleteHandler(request, h) {
        try {
            const ModelInstance = await this.deleteModel(
                request.query.id,
                this.getTenantIdFromAuth(request)
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


    /**
     *
     * @param {*} params  - Most likely request.query
     * @param {*} fetchConfig
     * @returns Promise
     * @example:
     * this.fetchAll(
     *   request.query,
     *   { withRelated: ['variants'] }
     * )
     */
    fetchAll(params, fetchConfig) {
        let orderBy = null;
        let orderDir = 'DESC';

        if(params._sort) {
            const arr = params._sort.split(':');
            orderBy = arr[0];
            orderDir = arr[1] || 'DESC'
        }

        const Model = this.getModel()
            .query((qb) => {
                SqlOperatorBuilder.buildFilters(
                    params,
                    qb
                )
            })
            .orderBy(orderBy, orderDir);

        if(params._pageSize || params._page) {
            return Model.fetchPage({
                pageSize: params._pageSize,
                page: params._page,
                ...fetchConfig
            });
        }

        return Model.fetchAll({
            ...fetchConfig
        });
    }


    fetchOne(params, fetchConfig) {
        return this.getModel()
            .query((qb) => {
                SqlOperatorBuilder.buildFilters(
                    params,
                    qb
                )
            })
            .fetch({
                ...fetchConfig
            });
    }


    fetchOneForTenant(request, fetchConfig) {
        const tenantId = this.getTenantIdFromAuth(request);

        if(!tenantId) {
            throw Boom.unauthorized();
        }

        request.query.tenant_id = tenantId;
        return this.fetchOne(request.query, fetchConfig);
    }


    fetchAllForTenant(request, fetchConfig) {
        const tenantId = this.getTenantIdFromAuth(request);

        if(!tenantId) {
            throw Boom.unauthorized();
        }

        request.query.tenant_id = tenantId;
        return this.fetchAll(request.query, fetchConfig);
    }


    async fetchOneForTenantHandler(request, h, fetchConfig) {
        try {
            global.logger.info(`REQUEST: BaseController.fetchOneForTenantHandler (${this.modelName})`, {
                meta: {
                    query: request.query,
                    fetchConfig
                }
            });

            const Model = await this.fetchOneForTenant(request, fetchConfig);

            global.logger.info(`RESPONSE: BaseController.fetchOneForTenantHandler (${this.modelName})`, {
                meta: {
                    model: Model ? Model.toJSON() : null
                }
            });

            return h.apiSuccess(
                Model
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }


    async fetchAllForTenantHandler(request, h, fetchConfig) {
        try {
            global.logger.info(`REQUEST: BaseController.fetchAllForTenantHandler (${this.modelName})`, {
                meta: {
                    query: request.query,
                    fetchConfig
                }
            });

            const Models = await this.fetchAllForTenant(request, fetchConfig);
            const pagination = Models ? Models.pagination : null;

            global.logger.info(`RESPONSE: BaseController.fetchAllForTenantHandler (${this.modelName})`, {
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
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }
}

module.exports = BaseController;
