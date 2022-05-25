

const Joi = require('joi');
// const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');


class TaxNexusCtrl extends BaseController {

    constructor(server) {
        super(server, 'TaxNexus');
    }


    getSchema() {
        return {
            id: Joi.string().uuid().allow(null),
            tenant_id: Joi.string().uuid(),
            countryCodeAlpha2: Joi.alternatives().try(Joi.string().trim().max(2), Joi.allow(null)),
            state: Joi.alternatives().try(Joi.string().trim().max(100), Joi.allow(null)),
            tax_rate: Joi.alternatives().try(Joi.number().integer().min(0), Joi.allow(null)),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }

}

module.exports = TaxNexusCtrl;





