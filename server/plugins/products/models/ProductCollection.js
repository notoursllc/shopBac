const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.product_collections,

        uuid: true,

        hasTimestamps: true,

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
