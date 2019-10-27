const CoreService = require('../../server/plugins/core/core.service');


/**
 * model: ProductOptionLabel
 *
 * A product has various options (size, color).
 * This table simply keeps these option names
 *
 * The foreign key is to the product the option belongs to
 */

module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.product_option_labels,
        (t) => {
            t.uuid('id').primary();
            t.string('label').nullable();

            // Foreign Keys:
            t.uuid('product_id')
                .notNullable()
                .references('id')
                .inTable(CoreService.DB_TABLES.products)
                .onDelete('CASCADE');

            t.index([
                'id',
                'product_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.product_option_labels);
};
