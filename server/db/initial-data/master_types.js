const faker = require('faker');
const CoreService = require('../../plugins/core/core.service');


exports.seed = (knex) => {
    return knex(CoreService.DB_TABLES.master_types)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${CoreService.DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                const d = new Date();

                return Promise.all([
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_type',
                        name: 'Apparel',
                        value: 1,
                        slug: 'apparel',
                        created_at: d,
                        updated_at: d
                    }),
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_sub_type',
                        name: 'Hats',
                        value: 1,
                        slug: 'hats',
                        created_at: d,
                        updated_at: d
                    }),
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_fit_type',
                        name: 'Mens',
                        value: 1,
                        slug: 'mens',
                        created_at: d,
                        updated_at: d
                    })
                ]);
            }
        );
};
