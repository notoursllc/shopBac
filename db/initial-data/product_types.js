const Promise = require('bluebird');
const faker = require('faker');
const CoreService = require('../../server/plugins/core/core.service');


exports.seed = (knex) => {
    return knex(CoreService.DB_TABLES.product_types)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${CoreService.DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                let promises = [];
                let d = new Date();

                promises.push(
                    knex(CoreService.DB_TABLES.product_types).insert({
                        id: faker.random.uuid(),
                        name: 'PRODUCT_TYPE_APPAREL',
                        value: 0x01,
                        slug: 'apparel',
                        is_available: true,
                        created_at: d,
                        updated_at: d
                    })
                )

                return Promise.all(promises);
            }
        );
};
