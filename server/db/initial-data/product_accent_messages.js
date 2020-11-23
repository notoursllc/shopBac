const CoreService = require('../../plugins/core/core.service');
const { tenantId, randomUuid } = require('../utils');


exports.seed = (knex) => {
    return knex(CoreService.DB_TABLES.product_accent_messages)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${CoreService.DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                const d = new Date();

                return Promise.all([
                    knex(CoreService.DB_TABLES.product_accent_messages).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        message: 'Just In!',
                        created_at: d,
                        updated_at: d
                    }),

                    knex(CoreService.DB_TABLES.product_accent_messages).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        message: 'Sold Out',
                        created_at: d,
                        updated_at: d
                    })
                ]);
            }
        );
};
