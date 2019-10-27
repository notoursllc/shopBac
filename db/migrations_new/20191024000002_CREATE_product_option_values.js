const CoreService = require('../../server/plugins/core/core.service');


/**
 * model: ProductOptionValue
 *
 * The value of a given product option
 * This table simply keeps these option names
 *
 * The foreign key is to the variant the option belongs to
 */

module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.product_option_values,
        (t) => {
            t.uuid('id').primary();
            t.string('value').nullable();

            // Foreign Keys:
            t.uuid('product_option_label_id')
                .notNullable()
                .references('id')
                .inTable(CoreService.DB_TABLES.product_option_labels)
                .onDelete('CASCADE');

            t.uuid('product_variant_id')
                .notNullable()
                .references('id')
                .inTable(CoreService.DB_TABLES.product_variants)
                .onDelete('CASCADE');

            t.index([
                'id',
                'product_variant_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.product_option_values);
};
