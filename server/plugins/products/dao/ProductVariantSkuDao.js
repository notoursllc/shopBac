const Joi = require('joi');
const BaseDao = require('../../core/dao/BaseDao.js');
const { makeArray } = require('../../../utils');


class ProductVariantSkuDao extends BaseDao {

    constructor(server) {
        super(server);
        this.tableName = this.tables.product_variant_skus;
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

            // STRIPE
            stripe_price_id: Joi.string(),
            stripe_product_id: Joi.string(),

            // TIMESTAMPS
            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date()
        };
    }


    addVirtuals(products) {
        makeArray(products).forEach((product) => {
            makeArray(product.variants).forEach((variant) => {
                makeArray(variant.skus).forEach((sku) => {
                    // display price
                    sku.display_price = (function(s) {
                        if(s.is_on_sale && s.sale_price !== null) {
                            return s.sale_price;
                        }

                        return s.base_price;
                    })(sku)
                });
            });
        });

        return products;
    }


    async addVariantSkuRelationsToProducts(products) {
        const productVariantMap = {};

        products.forEach(prod => {
            if(Array.isArray(prod.variants)) {
                prod.variants.forEach(v => {
                    if(v.id) {
                        productVariantMap[v.id] = v;
                    }
                });
            }
        });

        const variantIds = Object.keys(productVariantMap);

        if(variantIds.length) {
            // Get all skus for the collection of variants
            const skus = await this.knex
                .select(this.getAllColumns())
                .distinct()
                .from(this.tableName)
                .whereIn('product_variant_id', variantIds)
                .whereNull('deleted_at');

            skus.forEach(sku => {
                if(!Array.isArray(productVariantMap[sku.product_variant_id].skus)) {
                    productVariantMap[sku.product_variant_id].skus = [];
                }
                productVariantMap[sku.product_variant_id].skus.push(sku);
            });
        }

        return this.addVirtuals(products);
    }
}

module.exports = ProductVariantSkuDao;
