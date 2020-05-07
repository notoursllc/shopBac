const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');


class ProductSkuOptionCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductSkuOption');
    }


    getSchema() {
        return {
            label: Joi.string().max(100).required(),
            description: Joi.string().max(500).allow(null),
            optionData: Joi.array().allow(null).required(),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    getByIdHandler(request, h) {
        return this.modelForgeFetchHandler(
            { id: request.query.id, tenant_id: this.getTenantId(request) },
            null,
            h
        );
    }


    // getAllHandler(request, h) {
    //     return this.fetchAllHandler(h, (qb) => {
    //         qb.where('tenant_id', '=', this.getTenantId(request));

    //         if(request.query.object) {
    //             qb.where('object', '=', request.query.object);
    //         }
    //     });
    // }


    getPageHandler(request, h) {
        this.addTenantId(request, 'query');

        return super.getPageHandler(
            request,
            null,
            h
        );
    }


    upsertHandler(request, h) {
        this.addTenantId(request, 'payload');
        return super.upsertHandler(request, h);
    }

}

module.exports = ProductSkuOptionCtrl;
