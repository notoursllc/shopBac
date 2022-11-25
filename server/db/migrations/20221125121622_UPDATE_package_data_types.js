const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.alterTable(DB_TABLES.products, (t) => {
        t.float('packing_length_cm').alter();
        t.float('packing_width_cm').alter();
        t.float('packing_height_cm').alter();
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable(DB_TABLES.products, (t) => {
        t.integer('packing_length_cm').alter();
        t.integer('packing_width_cm').alter();
        t.integer('packing_height_cm').alter();
    })
};

