const Joi = require('@hapi/joi');
const BaseController = require('../core/BaseController');


class ShippingPackageTypeCtrl extends BaseController {

    constructor(server) {
        super(server, 'PackageType');
    }


    getSchema() {
        return {
            label: Joi.string().max(100).required(),
            length: Joi.number().precision(2).min(0).required(),
            width: Joi.number().precision(2).min(0).required(),
            height: Joi.number().precision(2).min(0).allow(null),
            weight: Joi.number().precision(2).min(0).allow(null),
            mass_unit: Joi.string().allow('oz').optional(),  // see note #1 below
            distance_unit: Joi.string().length(2).required(),
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

module.exports = ShippingPackageTypeCtrl;


/**
 * NOTES:
 *
 * 1) In order to have mass unit consistency with the product weight and the shipping package weight,
 *      I am forcing the 'oz' mass_unit so we can easily calculate the total weight of the package
 *      (product weight + package weight)
 */
