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
                        description: 'apparel description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),

                    // product_sub_type
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_sub_type',
                        name: 'Hats',
                        value: 1,
                        slug: 'hats',
                        description: 'hats description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_sub_type',
                        name: 'Tops',
                        value: 2,
                        slug: 'tops',
                        description: 'tops description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),

                    // product_fit_type
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_fit_type',
                        name: 'Mens',
                        value: 1,
                        slug: 'mens',
                        description: 'mens description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_fit_type',
                        name: 'Womens',
                        value: 2,
                        slug: 'womens',
                        description: 'womens description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_fit_type',
                        name: 'Boys',
                        value: 4,
                        slug: 'boys',
                        description: 'boys description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_fit_type',
                        name: 'Girls',
                        value: 8,
                        slug: 'girls',
                        description: 'girls description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),

                    // product_sales_channel_type
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_sales_channel_type',
                        name: 'goBreadVan.com',
                        value: 1,
                        slug: 'gobreadvan.com',
                        description: 'gobreadvan.com description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),

                    // product_vendor_type
                    knex(CoreService.DB_TABLES.master_types).insert({
                        id: faker.random.uuid(),
                        tenant_id: '11111111-1111-1111-1111-111111111111',
                        published: true,
                        object: 'product_vendor_type',
                        name: 'BreadVan',
                        value: 1,
                        slug: 'breadvan',
                        description: 'breadvan description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    })
                ]);
            }
        );
};
