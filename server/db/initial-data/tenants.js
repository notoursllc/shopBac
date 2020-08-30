const CoreService = require('../../plugins/core/core.service');
exports.seed = (knex) => {
    return knex(CoreService.DB_TABLES.tenants)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${CoreService.DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                const d = new Date();

                return knex(CoreService.DB_TABLES.tenants).insert({
                    id: '11111111-1111-1111-1111-111111111111',
                    password: '$2b$10$hyvqFDIVH03o6vA4trlJP.sKtUP/NDjQQaCF1oBKSa7OwLFsKpnD.',
                    application_name: 'BreadVan',
                    application_url: 'goBreadVan.com',
                    active: true,
                    created_at: d,
                    updated_at: d
                });
            }
        );
};
