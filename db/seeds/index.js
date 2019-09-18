let product_artists = require('../initial-data/product_artists');
let product_pics = require('../initial-data/product_pics');
let product_sizes = require('../initial-data/product_sizes');
let product_types = require('../initial-data/product_types');
let product_subtypes = require('../initial-data/product_subtypes');
let products = require('../initial-data/products');
let carts = require('../initial-data/carts');
let package_types = require('../initial-data/package_types');

/**
 * Knex.js's seed functionality does not provide any order of execution guarantees,
 * so this function will run the seeds in the order that we want
 *
 * @param knex
 * @param Promise
 * @returns {*}
 */
exports.seed = (knex, Promise) => {

    return product_artists.seed(knex, Promise)
        .then(() => {
            return products.seed(knex, Promise);
        })
        .then(() => {
            return carts.seed(knex, Promise);
        })
        .then(() => {
            return Promise.all([
                product_pics.seed(knex, Promise),
                product_sizes.seed(knex, Promise),
                product_types.seed(knex, Promise),
                product_subtypes.seed(knex, Promise),
                package_types.seed(knex, Promise)
            ])
        });
};
