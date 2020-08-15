const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');


class ProductSkuVariantTypeCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductSkuVariant');
    }


    getSchema() {
        return {
            tenant_id: Joi.string().uuid(),
            label: Joi.string().max(100).required(),
            description: Joi.string().max(500).allow(null),
            optionData: Joi.array().allow(null).required(),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    getByIdHandler(request, h) {
        return this.modelForgeFetchHandler(
            {
                id: request.query.id,
                tenant_id: this.getTenantId(request)
            },
            null,
            h
        );
    }

}

module.exports = ProductSkuVariantTypeCtrl;
