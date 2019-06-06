const CoreService = require('../../server/plugins/core/core.service');


exports.up = function(knex, Promise) {
    return knex.schema.table(CoreService.DB_TABLES.payments, (t) => {
        t.string('payment_type').nullable();
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table(CoreService.DB_TABLES.payments, (t) => {
        t.dropColumn('payment_type');
    })
};
