const Joi = require('joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');


class MasterTypeCtrl extends BaseController {

    constructor(server) {
        super(server, 'MasterType');
    }


    getSchema() {
        return {
            tenant_id: Joi.string().uuid().required(),
            published: Joi.boolean(),
            object: Joi.string().max(100).required(),
            name: Joi.string().max(100),
            value: Joi.number().integer().min(0),
            slug: Joi.string().allow('').allow(null),
            description: Joi.string().max(500).allow('').allow(null),
            metadata: Joi.array().allow(null),
            ordinal: Joi.number().integer().min(0).allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    async bulkUpdateOrdinals(request, h) {
        try {
            global.logger.info(`REQUEST: MasterTypeCtrl.bulkUpdateOrdinals`);

            const promises = [];
            const tenant_id = this.getTenantIdFromAuth(request);

            request.payload.ordinals.forEach((obj) => {
                promises.push(
                    this.upsertModel({
                        ...obj,
                        tenant_id
                    })
                );
            });

            await Promise.all(promises);

            global.logger.info('RESPONSE: MasterTypeCtrl.bulkUpdateOrdinals');

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    getNextAvailableTypeValue(allTypes) {
        let highestValue = 0;

        // find the highest value
        allTypes.forEach((obj) => {
            if(obj.value > highestValue) {
                highestValue = obj.value;
            }
        });

        let factor = 0;

        if(highestValue) {
            factor = parseInt(Math.log(highestValue) / Math.log(2), 10); // current factor
            factor++; // what the new factor should be
        }

        return Math.pow(2, factor);
    }


    async upsertHandler(request, h) {
        try {
            const tenantId = this.getTenantIdFromAuth(request);

            if(!tenantId) {
                throw Boom.unauthorized();
            }

            const allMasterTypes = await this.fetchAll({
                tenant_id: tenantId,
                object: request.payload.object
            });

            // Add the next available value to the payload if we're adding a new one:
            if(!request.payload.id) {
                request.payload.value = this.getNextAvailableTypeValue(allMasterTypes.toJSON());
            }

            return super.upsertHandler(request, h);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async fetchAllHandler(request, h) {
        try {
            global.logger.info(`REQUEST: MasterTypeController.fetchAllHandler`, {
                meta: {
                    query: request.query
                }
            });

            const Models = await this.fetchAllForTenant(request);

            // console.log("FETCH ALL", Models)
            const json = Models.toJSON();
            const all = {};

            json.forEach((obj) => {
                if(obj.object && !all.hasOwnProperty(obj.object)) {
                    all[obj.object] = [];
                }

                all[obj.object].push(obj);
            })

            global.logger.info(`RESPONSE: MasterTypeController.fetchAllHandler`, {
                meta: {
                }
            });

            return h.apiSuccess(
                all
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }

}

module.exports = MasterTypeCtrl;
