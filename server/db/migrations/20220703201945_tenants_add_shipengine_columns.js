const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.tenants, (t) => {
        t.string('shipengine_api_key').nullable();
        t.json('shipengine_carriers').nullable();

        t.string('shipping_from_name').nullable();
        t.string('shipping_from_streetAddress').nullable();
        t.string('shipping_from_extendedAddress').nullable();
        t.string('shipping_from_company').nullable();
        t.string('shipping_from_city').nullable();
        t.string('shipping_from_state').nullable();
        t.string('shipping_from_postalCode').nullable();
        t.string('shipping_from_countryCodeAlpha2', 2).nullable();
        t.string('shipping_from_phone').nullable();
    })
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.tenants, (t) => {
        t.dropColumn('shipengine_api_key');
        t.dropColumn('shipengine_carriers');

        t.dropColumn('shipping_from_name');
        t.dropColumn('shipping_from_streetAddress');
        t.dropColumn('shipping_from_extendedAddress');
        t.dropColumn('shipping_from_company');
        t.dropColumn('shipping_from_city');
        t.dropColumn('shipping_from_state');
        t.dropColumn('shipping_from_postalCode');
        t.dropColumn('shipping_from_countryCodeAlpha2', 2);
        t.dropColumn('shipping_from_phone');
    })
};
