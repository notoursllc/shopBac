const CoreService = require('../../plugins/core/core.service');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.taxes,
        (t) => {
            t.uuid('id').primary();
            t.string('name').nullable();
            t.decimal('percentage');
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            t.index([
                'id'
            ]);
        }
    );
};



module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.taxes);
};
