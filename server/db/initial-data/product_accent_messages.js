const { DB_TABLES } = require('../../plugins/core/services/CoreService');
const { tenantId, randomUuid } = require('../utils');


exports.seed = (knex) => {
    return knex(DB_TABLES.product_accent_messages)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                const d = new Date();

                return Promise.all([
                    knex(DB_TABLES.product_accent_messages).insert({
                        id: randomUuid(),
                        tenant_id: tenantId,
                        message: 'Just In!',
                        created_at: d,
                        updated_at: d
                    }),

                    knex(DB_TABLES.product_accent_messages).insert({
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
