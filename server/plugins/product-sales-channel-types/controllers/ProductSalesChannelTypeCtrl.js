const BaseTypeCtrl = require('../../core/BaseTypeCtrl');


class ProductTypeCtrl extends BaseTypeCtrl {

    constructor(server) {
        super(server, 'ProductSalesChannelType');
    }

}

module.exports = ProductTypeCtrl;
