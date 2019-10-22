const BaseTypeCtrl = require('../core/BaseTypeCtrl');


class ProductTypeCtrl extends BaseTypeCtrl {

    constructor(server) {
        super(server, 'ProductType');
    }

}

module.exports = ProductTypeCtrl;
