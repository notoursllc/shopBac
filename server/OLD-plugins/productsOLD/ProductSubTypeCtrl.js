const BaseTypeCtrl = require('../core/BaseTypeCtrl');


class ProductSubTypeCtrl extends BaseTypeCtrl {

    constructor(server) {
        super(server, 'ProductSubType');
    }

}

module.exports = ProductSubTypeCtrl;
