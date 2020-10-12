
const CoreService = require('../../plugins/core/core.service');

exports.up = function(knex, Promise) {
    return knex.schema.table(CoreService.DB_TABLES.product_skus, function(t) {
        t.string('accent_message_id').nullable();
        t.timestamp('accent_message_begin', true).nullable();
        t.timestamp('accent_message_end', true).nullable();
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table(CoreService.DB_TABLES.product_skus, function(t) {
        t.dropColumn('accent_message_id');
        t.dropColumn('accent_message_begin');
        t.dropColumn('accent_message_end');
    })
};
