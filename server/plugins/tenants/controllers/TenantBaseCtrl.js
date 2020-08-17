const BaseController = require('../../core/BaseController');


class TenantBaseCtrl extends BaseController {

    constructor(server, modelName) {
        super(server, modelName);
        this.validTenantCache = [];
    }


    getTenant(request) {
        return this.modelForgeFetch(
            { id: this.getTenantIdFromAuth(request) }
        );
    }


    getByIdHandler(request, h) {
        return this.modelForgeFetchHandler(
            { id: request.query.id },
            null,
            h
        );
    }

}


module.exports = TenantBaseCtrl;
