const CoreService = require('../../plugins/core/core.service');
const { cryptPassword } = require('../../helpers.service');

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
                    api_key: cryptPassword('68d774a2cb623ff256caf5249b7f6b72fc24ce9c190d56763a5701e7dc6d4030'),
                    application_name: 'BreadVan',
                    application_url: 'goBreadVan.com',
                    active: true,
                    created_at: d,
                    updated_at: d
                });
            }
        );
};
