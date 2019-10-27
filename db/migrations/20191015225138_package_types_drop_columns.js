const CoreService = require('../../server/plugins/core/core.service');

module.exports.up = (knex) => {
    return knex.schema.table(CoreService.DB_TABLES.package_types, function(t) {
        t.dropColumn('type');
        t.dropColumn('mass_unit');
    });
};

module.exports.down = (knex) => {
    return knex.schema.table(CoreService.DB_TABLES.package_types, function(t) {
        t.integer('type').nullable();
        t.string('mass_unit').nullable();
    });
};
