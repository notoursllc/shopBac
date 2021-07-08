const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.package_types,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        virtuals: {
            volume_cm: function() {
                return (this.get('length_cm') || 0)
                    * (this.get('width_cm') || 0)
                    * (this.get('height_cm') || 0);
            }
        },

        visible: [
            'id',
            // 'tenant_id',
            'label',
            'description',
            'code',
            'code_for_carrier',
            'length_cm',
            'width_cm',
            'height_cm',
            'weight_oz',
            'max_weight_oz',
            'ordinal',
            'created_at',
            'updated_at',
            // 'deleted_at'

            // virtuals:
            'volume_cm'
        ]
    });
};
