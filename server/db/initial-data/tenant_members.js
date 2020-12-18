const { DB_TABLES } = require('../../plugins/core/services/CoreService');
const { tenantId, randomUuid } = require('../utils');

exports.seed = (knex) => {
    return knex(DB_TABLES.tenant_members)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                const d = new Date();

                return knex(DB_TABLES.tenant_members).insert({
                    id: randomUuid(),
                    tenant_id: tenantId,
                    email: 'greg@greg.com',
                    password: '$2b$10$hyvqFDIVH03o6vA4trlJP.sKtUP/NDjQQaCF1oBKSa7OwLFsKpnD.',
                    active: true,
                    created_at: d,
                    updated_at: d
                });
            }
        );
};
