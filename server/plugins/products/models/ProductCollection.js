const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.product_collections,

        softDelete: false,

        // tenant_id is not visible
        visible: [
            'id',
            'published',
            'name',
            'value',
            'description',
            'image_url',
            'seo_page_title',
            'seo_page_desc',
            'seo_uri',
            'created_at',
            'updated_at'
        ]
    });
};
