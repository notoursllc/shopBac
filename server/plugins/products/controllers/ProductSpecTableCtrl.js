const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');


class ProductCollectionCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductSpecTable');
    }


    getSchema() {
        return {
            tenant_id: Joi.string().uuid(),
            name: Joi.string().max(100).required(),
            table_data: Joi.object().allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    getByIdHandler(request, h) {
        return this.modelForgeFetchHandler(
            {
                id: request.query.id,
                tenant_id: request.query.tenant_id
            },
            null,
            h
        );
    }

}

module.exports = ProductCollectionCtrl;