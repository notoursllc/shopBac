const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.createTable(
        DB_TABLES.package_types,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.string('label').nullable();
            t.text('description').nullable();
            t.text('notes').nullable();
            t.string('code').nullable();
            t.string('code_for_carrier').nullable();
            t.float('length_cm').nullable();
            t.float('width_cm').nullable();
            t.float('height_cm').nullable();
            t.float('weight_oz').nullable();
            t.float('max_weight_oz').nullable();
            t.integer('ordinal').nullable().defaultTo(1);
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();
            t.timestamp('deleted_at', true).nullable();

            t.index([
                'id'
            ]);
        }
    );
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists(DB_TABLES.package_types);
};
