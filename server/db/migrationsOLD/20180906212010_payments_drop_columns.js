const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = (knex) => {
    return knex.schema.table(DB_TABLES.payments, (t) => {
        t.dropColumn('transaction_id');
        t.dropColumn('success');
        t.dropColumn('void');
    });
};


module.exports.down = (knex) => {
    return knex.schema.table(DB_TABLES.payments, function(t) {
        t.string('transaction_id');
        t.boolean('success');
        t.boolean('void');
    })
};
