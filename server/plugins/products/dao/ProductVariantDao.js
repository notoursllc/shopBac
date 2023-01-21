const Joi = require('joi');
const BaseDao = require('../../core/dao/BaseDao.js');
const ProductVariantSkuDao = require('./ProductVariantSkuDao.js');
const { makeArray } = require('../../../utils');


class ProductVariantDao extends BaseDao {

    constructor(server) {
        super(server);
        this.tableName = this.tables.product_variants;
        this.softDelete = true;
        this.ProductVariantSkuDao = new ProductVariantSkuDao(server);

        this.schema = {
            id: Joi.string().uuid(),
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().empty('').default(false),
            ordinal: Joi.number().integer().min(0).allow(null),
            label: Joi.alternatives().try(
                Joi.string().max(100),
                Joi.allow(null)
            ),
            basic_color_type: Joi.alternatives().try(
                Joi.number().integer().positive(),
                Joi.allow(null)
            ),
            sku_label_type: Joi.alternatives().try(
                Joi.string().max(100),
                Joi.allow(null)
            ),

            // PRICING
            currency: Joi.alternatives().try(
                Joi.string().max(3),
                Joi.allow(null)
            ),

            is_taxable: Joi.boolean().empty('').default(false),
            tax_code: Joi.alternatives().try(
                Joi.number(),
                Joi.allow(null)
            ),

            // ACCENT MESSAGE
            accent_message_id: Joi.alternatives().try(
                Joi.string().uuid(),
                Joi.allow(null)
            ),
            accent_message_begin: Joi.alternatives().try(
                Joi.date(),
                Joi.allow(null)
            ),
            accent_message_end: Joi.alternatives().try(
                Joi.date(),
                Joi.allow(null)
            ),

            // MEDIA
            images: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),
            swatches: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),

            // SHIPPING
            customs_country_of_origin: Joi.alternatives().try(
                Joi.string().max(2),
                Joi.allow(null)
            ),

            product_id: Joi.string().uuid(),

            // skus: Joi.array().items(
            //     // Note: should not pass the 'isUpdate' flag to getSchema() in this case.
            //     // When creating a product, the user doesn't necessarily have to also create variants,
            //     // therefore updating a product may be the first time that a variants is added, in
            //     // which case the variant will not have an id
            //     Joi.object(this.ProductVariantSkuCtrl.getSchema())
            // ),

            // TIMESTAMPS
            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date()
        };
    }


    addVirtuals(products) {
        makeArray(products).forEach((product) => {
            makeArray(product.variants).forEach((variant) => {
                // total_inventory_count
                variant.total_inventory_count = (function(v) {
                    let totalCount = 0;

                    const skus = makeArray(v.skus);
                    if(skus.length) {
                        skus.forEach((obj) => {
                            totalCount += (obj.inventory_count || 0);
                        });
                    }

                    return totalCount;
                })(variant);
            });
        });

        return products;
    }


    async addVariantRelationsToProducts(products) {
        await this.addRelations(
            products,
            this.knex.select(this.getAllColumns()).distinct().from(this.tableName).whereNull('deleted_at'),
            'id',
            'product_id',
            'variants'
        )

        await this.ProductVariantSkuDao.addVariantSkuRelationsToProducts(products);

        return this.addVirtuals(products);
    }

}

module.exports = ProductVariantDao;
