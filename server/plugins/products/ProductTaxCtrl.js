const Joi = require('@hapi/joi');
const BaseController = require('../core/BaseController');


class ProductTaxCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductTax');
    }


    getSchema() {
        return {
            name: Joi.string().max(100).required(),
            percentage: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
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
        return this.fetchAllHandler(h, (qb) => {
            // if(helperService.isBoolean(request.query.is_available)) {
            //     qb.where('is_available', '=', request.query.is_available);
            // }
        });
    }

}

module.exports = ProductTaxCtrl;
