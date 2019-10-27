const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');


class ProductCollectionCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductCollection');
    }


    getSchema() {
        return {
            published: Joi.boolean().default(false),
            sales_channel_type: Joi.number().integer().min(0).optional(),
            name: Joi.string().max(100).required(),
            value: Joi.number().integer().min(0).required(),
            description: Joi.string().max(500).optional(),
            image_url: Joi.string().max(200).optional(),
            seo_page_title: Joi.string().max(200).optional(),
            seo_page_desc: Joi.string().max(500).allow(null),
            seo_uri: Joi.string().max(100).allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }

}

module.exports = ProductCollectionCtrl;
