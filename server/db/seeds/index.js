const tenants = require('../initial-data/tenants');
const tenant_members = require('../initial-data/tenant_members');
const master_types = require('../initial-data/master_types');
const product_collections = require('../initial-data/product_collections');
const product_accent_messages = require('../initial-data/product_accent_messages');


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
            return tenant_members.seed(knex, Promise);
        })
        .then(() => {
            return master_types.seed(knex, Promise);
        })
        .then(() => {
            return product_collections.seed(knex, Promise);
        })
        .then(() => {
            return product_accent_messages.seed(knex, Promise)
        });
        // .then(() => {
               // NOTE: Promise.all required Bluebird, as the node Promise doesn't support all
               // which is why Im commenting this out for now
        //     return Promise.all([
        //         master_types.seed(knex, Promise),
        //         product_collections.seed(knex, Promise)
        //     ]);
        // });
};
