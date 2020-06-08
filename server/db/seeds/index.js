const tenants = require('../initial-data/tenants');
const tenant_users = require('../initial-data/tenant_users');
const product_sku_variant_types = require('../initial-data/product_sku_variant_types');
const master_types = require('../initial-data/master_types');


/**
 * Knex.js's seed functionality does not provide any order of execution guarantees,
 * so this function will run the seeds in the order that we want
 *
 * @param knex
 * @param Promise
 * @returns {*}
 */
exports.seed = (knex, Promise) => {
    return tenants
        .seed(knex, Promise)
        .then(() => {
            return tenant_users.seed(knex, Promise);
        })
        .then(() => {
            return product_sku_variant_types.seed(knex, Promise);
        })
        .then(() => {
            return master_types.seed(knex, Promise);
        });
        // .then(() => {
        //     return Promise.all([
        //         tenant_users.seed(knex, Promise),
        //         product_sku_variant_types.seed(knex, Promise),
        //         master_types.seed(knex, Promise)
        //     ]);
        // });
};
