const { DB_TABLES } = require('../../plugins/core/services/CoreService');
const { tenantId, randomUuid } = require('../utils');

exports.seed = (knex) => {
    return knex(DB_TABLES.master_types)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                const d = new Date();

                return Promise.all([
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
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
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
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
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
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
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
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
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
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
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
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
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
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
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
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
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
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
