const BaseTypeCtrl = require('../core/BaseTypeCtrl');


class MaterialTypeCtrl extends BaseTypeCtrl {

    constructor(server) {
        super(server, 'MaterialType');
    }

}

module.exports = MaterialTypeCtrl;
