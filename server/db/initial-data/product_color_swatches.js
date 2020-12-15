const CoreService = require('../../plugins/core/core.service');
const { tenantId, randomUuid } = require('../utils');


exports.seed = (knex) => {
    return knex(CoreService.DB_TABLES.product_color_swatches)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${CoreService.DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                const d = new Date();

                return Promise.all([
                    knex(CoreService.DB_TABLES.product_color_swatches).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        hex: '#e21212',
                        label: 'Red',
                        description: 'Red color description',
                        created_at: d,
                        updated_at: d
                    }),

                    knex(CoreService.DB_TABLES.product_color_swatches).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        hex: '#4b7bd2',
                        label: 'Blue',
                        description: 'Blue color description',
                        created_at: d,
                        updated_at: d
                    }),

                    knex(CoreService.DB_TABLES.product_color_swatches).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        hex: '#62d24b',
                        label: 'Green',
                        description: 'Green color description',
                        created_at: d,
                        updated_at: d
                    }),
                ]);
            }
        );
};
