'use strict';

const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: CoreService.DB_TABLES.package_types,

            uuid: true,

            hasTimestamps: true,

            // http://bookshelfjs.org/#Model-instance-hasMany
            products: function() {
                return this.hasMany('Product', 'shipping_package_type_id');
            }
        }
    );
};
