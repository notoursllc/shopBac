const { DB_TABLES } = require('../../plugins/core/services/CoreService');
const { cryptPassword } = require('../../helpers.service');
const { tenantId } = require('../utils');

exports.seed = (knex) => {
    return knex(DB_TABLES.tenants)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                const d = new Date();

                return knex(DB_TABLES.tenants).insert({
                    id: tenantId,
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
