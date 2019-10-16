const Joi = require('@hapi/joi');
const BaseController = require('../core/BaseController');
const helperService = require('../../helpers.service');


class FitTypeCtrl extends BaseController {

    constructor(server) {
        super(server, 'FitType');
    }


    getSchema() {
        return {
            name: Joi.string().max(100).required(),
            value: Joi.number().integer().min(0).required(),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    /**
     * Route handler for getting a ProductVariation by ID
     *
     * @param {*} request
     * @param {*} h
     */
    async getAllHandler(request, h) {
        return this.fetchAll(h, (qb) => {
            // if(helperService.isBoolean(request.query.is_available)) {
            //     qb.where('is_available', '=', request.query.is_available);
            // }
        });
    }

}

module.exports = FitTypeCtrl;
