const Joi = require('joi');
const BaseDao = require('../../core/dao/BaseDao.js');
const ProductArtistDao = require('./ProductArtistDao.js');
const ProductVariantDao = require('./ProductVariantDao.js');
const { makeArray } = require('../../../utils');

const joiPositiveNumberOrNull = Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.allow(null)
);

//this.knex = server.app.knex;
class ProductDao extends BaseDao {

    constructor(server) {
        super(server);
        this.tableName = this.tables.products;
        this.softDelete = true;
        this.ProductArtistDao = new ProductArtistDao(server);
        this.ProductVariantDao = new ProductVariantDao(server);

        this.schema = {
            id: Joi.string().uuid(),
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().default(false),
            title: Joi.alternatives().try(Joi.string().trim().max(100), Joi.allow(null)),
            caption: Joi.alternatives().try(Joi.string().trim().max(200), Joi.allow(null)),
            description: Joi.alternatives().try(Joi.string().trim().max(2000), Joi.allow(null)),
            copyright: Joi.alternatives().try(Joi.string().trim().max(200), Joi.allow(null)),
            is_good: Joi.boolean().default(true),

            // these should be stringified values in the payload:
            metadata: Joi.alternatives().try(Joi.array(), Joi.allow(null)),

            // TYPES
            type: joiPositiveNumberOrNull,
            sub_type: joiPositiveNumberOrNull,
            sales_channel_type: joiPositiveNumberOrNull,
            package_type: joiPositiveNumberOrNull,
            vendor_type: joiPositiveNumberOrNull,
            collections: joiPositiveNumberOrNull,
            gender_type: joiPositiveNumberOrNull,
            fit_type: joiPositiveNumberOrNull,
            sleeve_length_type: joiPositiveNumberOrNull,
            feature_type: joiPositiveNumberOrNull,

            // SEO
            seo_page_title: Joi.alternatives().try(
                Joi.string().trim().max(70),
                Joi.allow(null)
            ),
            seo_page_desc: Joi.alternatives().try(
                Joi.string().trim().max(320),
                Joi.allow(null)
            ),
            seo_uri: Joi.alternatives().try(
                Joi.string().trim().max(50),
                Joi.allow(null)
            ),

            // MEDIA
            // images: Joi.array().allow(null),
            youtube_video_url: Joi.string().trim().max(500).empty('').allow(null).default(null),
            video: Joi.alternatives().try(
                Joi.object(),
                Joi.allow(null)
            ),

            // SHIPPING
            shippable: Joi.boolean().empty('').default(true),
            customs_country_of_origin: Joi.alternatives().try(
                Joi.string().max(2),
                Joi.allow(null)
            ),
            customs_harmonized_system_code: Joi.alternatives().try(
                Joi.string(),
                Joi.allow(null)
            ),

            // PACKAGING
            ship_alone: Joi.boolean().empty('').default(false),
            packing_length_cm: joiPositiveNumberOrNull,
            packing_width_cm: joiPositiveNumberOrNull,
            packing_height_cm: joiPositiveNumberOrNull,

            tax_code: Joi.alternatives().try(
                Joi.string().trim().max(50),
                Joi.allow(null)
            ),

            // Note that upserting the product data requires the use of FormData,
            // which means that variants will not be an array but a string that
            // needs JSON that needs to be parsed
            // variants: Joi.alternatives().try(
            //     Joi.string(),
            //     Joi.allow(null)
            // ),

            // variants: Joi.array().items(
            //     // Note: should not pass the 'isUpdate' flag to getSchema() in this case.
            //     // When creating a product, the user doesn't necessarily have to also create variants,
            //     // therefore updating a product may be the first time that a variants is added, in
            //     // which case the variant will not have an id
            //     Joi.object(this.ProductVariantCtrl.getSchema())
            // ),

            product_artist_id: Joi.alternatives().try(
                Joi.string().uuid(),
                Joi.allow(null)
            ),

            // TIMESTAMPS
            created_at: Joi.date().optional(),
            updated_at: Joi.date().optional()
        };
    }


    addVirtuals(products) {
        makeArray(products).forEach((prod) => {
            // packing_volume_cm
            prod.packing_volume_cm = (prod.packing_length_cm || 0)
                * (prod.packing_width_cm || 0)
                * (prod.packing_height_cm || 0);

            // total_inventory_count
            prod.total_inventory_count = (function(p) {
                let totalCount = 0;

                // https://bookshelfjs.org/api.html#Collection-instance-toArray
                const variants = makeArray(p.variants);
                if(variants.length) {
                    variants.forEach((obj) => {
                        totalCount += obj.total_inventory_count || 0;
                    })
                }

                return totalCount;
            })(prod);
        });

        return products;
    }


    async getProduct(id) {
        try {
            const products = await this.knex
                .select(this.getAllColumns())
                .distinct()
                .from(this.tables.products)
                .where({ id })
                .whereNull('deleted_at');

            await Promise.all([
                this.ProductVariantDao.addVariantRelationsToProducts(products),
                this.ProductArtistDao.addArtistRelationToProducts(products)
            ]);

            return this.addVirtuals(products);
        }
        catch(err) {
            console.error(err);
            throw new Error("An error occurred when fetching a product");
        }
    }


    // getSchemaWithRelations() {
    //     return {
    //         ...this.schema,
    //         variants: Joi.array().items(
    //             // Note: should not pass the 'isUpdate' flag to getSchema() in this case.
    //             // When creating a product, the user doesn't necessarily have to also create variants,
    //             // therefore updating a product may be the first time that a variants is added, in
    //             // which case the variant will not have an id
    //             Joi.object(this.ProductVariantDao.getSchemaWithRelations())
    //         )
    //     }
    // }


    upsertFormat(data) {
        if (data.metadata) {
            data.metadata = JSON.stringify(data.metadata)
        }

        return data;
    }

}

module.exports = ProductDao;
