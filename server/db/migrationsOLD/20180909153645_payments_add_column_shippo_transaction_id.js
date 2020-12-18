const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex, Promise) {
    return knex.schema.table(DB_TABLES.payments, (t) => {
        t.string('shippo_transaction_id').nullable();
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table(DB_TABLES.payments, (t) => {
        t.dropColumn('shippo_transaction_id');
    })
};
