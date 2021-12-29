const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = (knex) => {
    return knex.schema.table(DB_TABLES.carts, (t) => {
        t.boolean('is_gift').defaultTo(false);
    })
};


module.exports.down = (knex) => {
    return knex.schema.table(DB_TABLES.carts, (t) => {
        t.dropColumn('is_gift');
    })
};
