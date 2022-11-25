const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.product_artists, (t) => {
        t.string('alt_text').nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.product_artists, (t) => {
        t.dropColumn('vialt_textdeo');
    })
};

