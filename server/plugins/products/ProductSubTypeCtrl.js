const ProductTypeCtrl = require('./ProductTypeCtrl');


class ProductSubTypeCtrl extends ProductTypeCtrl {

    constructor(server) {
        super(server, 'ProductSubType');
    }

}

module.exports = ProductSubTypeCtrl;
