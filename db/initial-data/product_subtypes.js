const Promise = require('bluebird');
const faker = require('faker');
const CoreService = require('../../server/plugins/core/core.service');


exports.seed = (knex) => {
    return knex(CoreService.DB_TABLES.product_subtypes)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${CoreService.DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                let promises = [];
                let d = new Date();

                promises.push(
                    knex(CoreService.DB_TABLES.product_subtypes).insert({
                        id: faker.random.uuid(),
                        name: 'PRODUCT_SUBTYPE_HATS',
                        value: 0x01,
                        slug: 'hats',
                        is_available: true,
                        created_at: d,
                        updated_at: d
                    }),

                    knex(CoreService.DB_TABLES.product_subtypes).insert({
                        id: faker.random.uuid(),
                        name: 'PRODUCT_SUBTYPE_TOPS',
                        value: 0x02,
                        slug: 'tops',
                        is_available: true,
                        created_at: d,
                        updated_at: d
                    }),

                    knex(CoreService.DB_TABLES.product_subtypes).insert({
                        id: faker.random.uuid(),
                        name: 'PRODUCT_SUBTYPE_SOCKS',
                        value: 0x04,
                        slug: 'socks',
                        is_available: true,
                        created_at: d,
                        updated_at: d
                    })
                )

                return Promise.all(promises);
            }
        );
};
