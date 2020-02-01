const Joi = require('@hapi/joi');
const BaseController = require('./BaseController');
const helperService = require('../../helpers.service');


class BaseTypeCtrl extends BaseController {

    constructor(server, modelName) {
        super(server, modelName);
    }


    getSchema() {
        return {
            name: Joi.string().max(100).required(),
            value: Joi.number().integer().min(0).required(),
            slug: Joi.string().required(),
            published: Joi.boolean().default(true),
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
            if(helperService.isBoolean(request.query.published)) {
                qb.where('published', '=', request.query.published);
            }
        });
    }

}

module.exports = BaseTypeCtrl;
