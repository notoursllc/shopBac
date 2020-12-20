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

                    // product_basic_color_type
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Black',
                        value: 1,
                        slug: 'black',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"#000"}]),
                        ordinal: 1,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'White',
                        value: 2,
                        slug: 'white',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"#fff"}]),
                        ordinal: 2,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Red',
                        value: 4,
                        slug: 'red',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"#e7352b"}]),
                        ordinal: 3,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Blue',
                        value: 8,
                        slug: 'blue',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"#2290c8"}]),
                        ordinal: 4,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Green',
                        value: 16,
                        slug: 'green',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"#7bba3c"}]),
                        ordinal: 5,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Grey',
                        value: 32,
                        slug: 'grey',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"#808080"}]),
                        ordinal: 6,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Orange',
                        value: 64,
                        slug: 'orange',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"#f36b26"}]),
                        ordinal: 7,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Yellow',
                        value: 128,
                        slug: 'yellow',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"#fdd532"}]),
                        ordinal: 8,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Brown',
                        value: 256,
                        slug: 'brown',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"#825d41"}]),
                        ordinal: 9,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Pink',
                        value: 512,
                        slug: 'pink',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"#f0728f"}]),
                        ordinal: 10,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Purple',
                        value: 1024,
                        slug: 'purple',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":"8d429f"}]),
                        ordinal: 11,
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_basic_color_type',
                        name: 'Multi-color',
                        value: 2048,
                        slug: 'multi_color',
                        description: '',
                        metadata: JSON.stringify([{"property":"hex","value":""}]),
                        ordinal: 12,
                        created_at: d,
                        updated_at: d
                    }),


                    // product_feature_type
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_feature_type',
                        name: 'Pockets',
                        value: 1,
                        slug: 'pockets',
                        description: '',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_feature_type',
                        name: 'Hooded',
                        value: 2,
                        slug: 'hooded',
                        description: '',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_feature_type',
                        name: 'Seamless',
                        value: 4,
                        slug: 'seamless',
                        description: '',
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
                        name: 'Loose',
                        value: 1,
                        slug: 'loose',
                        description: 'loose description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_fit_type',
                        name: 'Slim',
                        value: 2,
                        slug: 'slim',
                        description: 'slim description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_fit_type',
                        name: 'Standard',
                        value: 4,
                        slug: 'standard',
                        description: 'standard description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),


                    // product_gender_type
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_gender_type',
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
                        object: 'product_gender_type',
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
                        object: 'product_gender_type',
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
                        object: 'product_gender_type',
                        name: 'Girls',
                        value: 8,
                        slug: 'girls',
                        description: 'girls description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_gender_type',
                        name: 'Unisex',
                        value: 16,
                        slug: 'unisex',
                        description: '',
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

                    // product_sleeve_length_type
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_sleeve_length_type',
                        name: 'Short sleeve',
                        value: 1,
                        slug: 'short_sleeve',
                        description: 'shortsleeve description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_sleeve_length_type',
                        name: 'Long sleeve',
                        value: 2,
                        slug: 'long_sleeve',
                        description: 'long_sleeve description',
                        metadata: JSON.stringify([{"property":"sample","value":"meta data"}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(DB_TABLES.master_types).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        published: true,
                        object: 'product_sleeve_length_type',
                        name: 'Sleeveless / Tank',
                        value: 4,
                        slug: 'sleeveless_tank',
                        description: 'sleeveless_tank description',
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
