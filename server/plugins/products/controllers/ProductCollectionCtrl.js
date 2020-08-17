const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');


class ProductCollectionCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductCollection');
    }


    getSchema() {
        return {
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().default(false),
            name: Joi.string().max(100).required(),
            value: Joi.number().integer().min(0).required(),
            description: Joi.string().max(500).allow(null),
            image_url: Joi.string().max(200).allow(null),
            seo_page_title: Joi.string().max(200).allow(null),
            seo_page_desc: Joi.string().max(500).allow(null),
            seo_uri: Joi.string().max(100).allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    getByIdHandler(request, h) {
        return this.modelForgeFetchHandler(
            {
                id: request.query.id,
                tenant_id: this.getTenantIdFromAuth(request)
            },
            null,
            h
        );
    }

}

module.exports = ProductCollectionCtrl;
