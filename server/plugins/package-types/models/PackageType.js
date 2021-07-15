const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.package_types,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        virtuals: {
            volume_cm: function() {
                const val = parseFloat(this.get('length_cm') || 0, 2)
                    * parseFloat(this.get('width_cm') || 0, 2)
                    * parseFloat(this.get('height_cm') || 0, 2);

                return val.toFixed(2);
            }
        },

        visible: [
            'id',
            // 'tenant_id',
            'label',
            'description',
            'notes',
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
