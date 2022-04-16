const Joi = require('@hapi/joi');
const { DB_TABLES } = require('../../core/services/CoreService.js');
const BaseDao = require('../../core/dao/BaseDao.js');

class ProductVariantSkuDao extends BaseDao {

    constructor(server) {
        super(server);

        this.tableName = DB_TABLES.product_variant_skus;
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

            sku: Joi.alternatives().try(
                Joi.string().max(100),
                Joi.allow(null)
            ),

            barcode: Joi.alternatives().try(
                Joi.string().max(100),
                Joi.allow(null)
            ),

            // PRICING
            base_price: Joi.alternatives().try(
                Joi.number().integer().min(0),
                Joi.allow(null),
                Joi.allow('')
            ),

            compare_at_price: Joi.alternatives().try(
                Joi.number().integer().min(0),
                Joi.allow(null),
                Joi.allow('')
            ),

            cost_price: Joi.alternatives().try(
                Joi.number().integer().min(0),
                Joi.allow(null),
                Joi.allow('')
            ),

            sale_price: Joi.alternatives().try(
                Joi.number().integer().min(0),
                Joi.allow(null),
                Joi.allow('')
            ),

            is_on_sale: Joi.boolean().empty('').default(false),

            // SHIPPING
            weight_oz: Joi.number().precision(2).min(0).max(99999999.99).empty('').default(null),
            weight_oz: Joi.alternatives().try(
                Joi.number().precision(2).min(0).max(99999999.99),
                Joi.allow(null)
            ),

            customs_country_of_origin: Joi.alternatives().try(
                Joi.string().max(2),
                Joi.allow(null),
                Joi.allow('')
            ),

            // INVENTORY
            inventory_count: Joi.number().integer().min(0).empty('').default(0),
            track_inventory_count: Joi.boolean().empty('').default(true),
            visible_if_no_inventory: Joi.boolean().empty('').default(true),
            product_variant_id: Joi.string().uuid(),

            // TIMESTAMPS
            created_at: Joi.date(),
            updated_at: Joi.date()
        }

        this.foreignKeys = {
            'product_variant_id': { as: 'product', relation: 'belongsTo'}
        };
    }

}

module.exports = ProductVariantSkuDao;
