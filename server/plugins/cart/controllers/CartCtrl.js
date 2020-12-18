const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');

class CartCtrl extends BaseController {

    constructor(server) {
        super(server, 'Cart');
    }


    async upsertHandler(request, h) {

    }

}

module.exports = CartCtrl;
