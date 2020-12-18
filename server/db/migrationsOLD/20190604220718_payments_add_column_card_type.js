const { DB_TABLES } = require('../../plugins/core/services/CoreService');


exports.up = function(knex, Promise) {
    return knex.schema.table(DB_TABLES.payments, (t) => {
        t.string('payment_type').nullable();
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table(DB_TABLES.payments, (t) => {
        t.dropColumn('payment_type');
    })
};
