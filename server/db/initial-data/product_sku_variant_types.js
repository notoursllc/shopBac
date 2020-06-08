const faker = require('faker');
const CoreService = require('../../plugins/core/core.service');


exports.seed = (knex) => {
    return knex(CoreService.DB_TABLES.product_sku_variant_types)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${CoreService.DB_TABLES.product_artists}_id_seq RESTART WITH 1`);
        // })
        .then(
            () => {
                const d = new Date();

                return Promise.all([
                    knex(CoreService.DB_TABLES.product_sku_variant_types).insert({
                        id: faker.random.uuid(),
                        label: 'Sizes',
                        // optionData: [{'property':'S','value':'s'},{'property':'M','value':'m'},{'property':'L','value':'l'}],
                        optionData: JSON.stringify([{'property':'S','value':'s'},{'property':'M','value':'m'},{'property':'L','value':'l'}]),
                        created_at: d,
                        updated_at: d
                    }),
                    knex(CoreService.DB_TABLES.product_sku_variant_types).insert({
                        id: faker.random.uuid(),
                        label: 'Colors',
                        // optionData: [{'property':'Red','value':'red'},{'property':'Blue','value':'blue'}],
                        optionData: JSON.stringify([{'property':'Red','value':'red'},{'property':'Blue','value':'blue'}]),
                        created_at: d,
                        updated_at: d
                    })
                ]);
            }
        );
};
