const ProductTypeCtrl = require('./ProductTypeCtrl');


class ProductSubTypeCtrl extends ProductTypeCtrl {

    constructor(server, modelName) {
        super(server, modelName);
    }

}

module.exports = ProductSubTypeCtrl;
