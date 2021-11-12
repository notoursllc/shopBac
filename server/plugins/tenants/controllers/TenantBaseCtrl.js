const BaseController = require('../../core/controllers/BaseController');


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

}


module.exports = TenantBaseCtrl;
