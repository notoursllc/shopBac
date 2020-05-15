const Promise = require('bluebird');
const faker = require('faker');
const CoreService = require('../../plugins/core/core.service');
const globalTypes = require('../../global_types.js')
const fakeFitOptions = buildSampleFitOptions();


function buildSampleFitOptions() {
    let opts = [];

    // adding one option for each fit
    Object.keys(globalTypes.product.fits).forEach((key) => {
        opts.push(globalTypes.product.fits[key]);
    });

    // adding a few multi-fit options
    opts.push(globalTypes.product.fits.FIT_TYPE_MENS | globalTypes.product.fits.FIT_TYPE_BOYS);  // mens and boys
    opts.push(globalTypes.product.fits.FIT_TYPE_WOMENS | globalTypes.product.fits.FIT_TYPE_GIRLS);  // womens and girls

    return opts;
}


function getRandomFitOption() {
    return fakeFitOptions[Math.floor(Math.random() * fakeFitOptions.length)];
}



exports.seed = (knex) => {
    return knex(CoreService.DB_TABLES.products)
        .del()
        // .then(() => {
        //     return knex.raw(`ALTER SEQUENCE ${CoreService.DB_TABLES.products}_id_seq RESTART WITH 1`);
        // })
        .then(() => {
            let promises = [];
            let d = new Date();
            let cents;
            let artistIndex = 0;

            global.productSeedUuids = [];

            for(let i=1; i<31; i++) {
                if(artistIndex === 5) {
                    artistIndex = 0
                }

                cents = (i < 10) ? parseFloat('0.0' + i) : parseFloat('0.' + i);

                let uuid = faker.random.uuid();
                global.productSeedUuids.push(uuid);

                // For now just seeding with tops and socks:
                let productSubtypeTops = 0x02;
                let productSubtypeSocks = 0x04;
                let subType = i % 2 ?productSubtypeTops : productSubtypeSocks;

                let materialType = i % 2 ? globalTypes.product.material_types.MATERIAL_TYPE_COTTON : globalTypes.product.material_types.MATERIAL_TYPE_TRI_BLEND;
                let shippingPackageType = (subType === productSubtypeTops ? 0x01 : 0x04);

                promises.push(
                    knex(CoreService.DB_TABLES.products)
                        .insert({
                            id: uuid,
                            title: 'Product Title ' + i,
                            description_short: 'Short description ' + i + ' - ' + faker.lorem.sentence(),
                            description_long: 'Long description ' + i + ' - ' + faker.lorem.paragraph(),
                            seo_uri: 'seo_uri_' + i,
                            base_price: ((100 + i + cents).toFixed(2)),
                            sale_price: ((99 - i + cents).toFixed(2)),
                            is_on_sale: faker.random.boolean(),
                            is_available: faker.random.boolean(),
                            tax_code: 20010,
                            video_url: 'https://www.youtube.com/watch?v=JUaY0AOLopU',
                            fit: getRandomFitOption(),
                            type: 1, // PRODUCT_TYPE_APPAREL
                            sub_type: subType,
                            material_type: materialType,
                            shipping_package_type: shippingPackageType,
                            created_at: d,
                            updated_at: d,
                            product_artist_id: global.productArtistSeedUuids[artistIndex]
                        })
                )
            }

            return Promise.all(promises);
        });
};