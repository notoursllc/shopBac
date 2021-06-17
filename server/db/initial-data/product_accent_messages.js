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
                const promises = [];
                const d = new Date();

                ['Just In!', 'Sold Out'].forEach((message) => {
                    promises.push(
                        knex(DB_TABLES.product_accent_messages).insert({
                            id: randomUuid(),
                            tenant_id: tenantId,
                            message: message,
                            created_at: d,
                            updated_at: d
                        })
                    )
                });

                return Promise.all(promises);
            }
        );
};
