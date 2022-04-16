const Joi = require('@hapi/joi');
const { DB_TABLES } = require('../../core/services/CoreService.js');
const BaseDao = require('../../core/dao/BaseDao.js');
const ProductVariantSkuDao = require('./ProductVariantSkuDao.js');

class ProductVariantDao extends BaseDao {

    constructor(server) {
        super(server);
        this.ProductVariantSkuDao = new ProductVariantSkuDao(server);

        this.tableName = DB_TABLES.product_variants;
        this.softDelete = true;

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

            // PRICING
            currency: Joi.alternatives().try(
                Joi.string().max(3),
                Joi.allow(null)
            ),

            base_price: Joi.number().integer().min(0).empty('').default(0),
            cost_price: Joi.number().integer().min(0).empty('').default(0),
            compare_at_price: Joi.number().integer().min(0).empty('').default(0),
            sale_price: Joi.number().integer().min(0).empty('').default(0),
            is_on_sale: Joi.boolean().empty('').default(false),
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
            weight_oz: Joi.number().precision(2).min(0).max(99999999.99).empty('').default(0),
            customs_country_of_origin: Joi.alternatives().try(
                Joi.string().max(2),
                Joi.allow(null)
            ),

            // product_id: Joi.string().uuid().required(),
            product_id: Joi.string().uuid(),

            // TIMESTAMPS
            created_at: Joi.date(),
            updated_at: Joi.date()
        }

        this.foreignKeys = {
            'product_id': { as: 'product', relation: 'belongsTo'}
        };
    }


    getSchemaWithRelations() {
        return {
            ...this.schema,
            skus: Joi.array().items(
                // Note: should not pass the 'isUpdate' flag to getSchema() in this case.
                // When creating a product, the user doesn't necessarily have to also create variants,
                // therefore updating a product may be the first time that a variants is added, in
                // which case the variant will not have an id
                Joi.object(this.ProductVariantSkuDao.getSchema())
            ),
        }
    }


    upsertFormat(data) {
        if (data.images) {
            data.images = JSON.stringify(data.images)
        }

        if (data.swatches) {
            data.swatches = JSON.stringify(data.swatches)
        }

        return data;
    }

}

module.exports = ProductVariantDao;
