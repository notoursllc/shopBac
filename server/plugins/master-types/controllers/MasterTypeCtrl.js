const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');


class MasterTypeCtrl extends BaseController {

    constructor(server) {
        super(server, 'MasterType');
    }


    getSchema() {
        return {
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().default(true),
            object: Joi.string().max(100).required(),
            name: Joi.string().max(100).required(),
            value: Joi.number().integer().min(0).required(),
            slug: Joi.string().required(),
            description: Joi.string().max(500).allow('').allow(null),
            metadata: Joi.array().allow(null),
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


    getAllHandler(request, h) {
        return this.fetchAllHandler(h, (qb) => {
            qb.where('tenant_id', '=', request.query.tenant_id);

            if(request.query.object) {
                qb.andWhere('object', '=', request.query.object);
            }
        });
    }

}

module.exports = MasterTypeCtrl;
