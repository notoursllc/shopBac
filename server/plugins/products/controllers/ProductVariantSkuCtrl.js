const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');

class ProductVariantSkuCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductVariantSku');
    }


    getSchema(isUpdate) {
        const schema = {
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

            // STRIPE
            stripe_price_id: Joi.string(),
            stripe_product_id: Joi.string().uuid(),

            // TIMESTAMPS
            created_at: Joi.date(),
            updated_at: Joi.date()
        };

        if(isUpdate) {
            schema.id = Joi.string().uuid().required();
        }

        return schema;
    }


    // decrementInventoryCount(Cart) {
    //     try {
    //         global.logger.info(`REQUEST: ProductVariantSkuCtrl.decrementInventoryCount`, {
    //             meta: {
    //                 cart_id: Cart.get('id')
    //             }
    //         });

    //         // TODO: IN PROGRESS
    //         Cart.related('cart_items').forEach((model) => {
    //             const ProductVariantSku = model.related('product_variant_sku');

    //             if(ProductVariantSku) {
    //                 // TODO: I think CartItem model needs to be updated
    //                 // so inventory_count is returned
    //                 let newInventoryCount = ProductVariantSku.get('inventory_count') - model.get('qty');
    //                 if(newInventoryCount < 0) {
    //                     newInventoryCount = 0;
    //                 }

    //                 const UpdatedProductVariantSku = await getModel().update(
    //                     { inventory_count: newInventoryCount },
    //                     { id: ProductVariantSku.get('id') }
    //                 );
    //             }
    //         });

    //         global.logger.info(`RESPONSE: ProductVariantSkuCtrl.decrementInventoryCount`, {
    //             meta: {}
    //         });
    //     }
    //     catch(err) {
    //         global.logger.error(err);
    //         global.bugsnag(err);
    //         throw err;
    //     }
    // }
}


module.exports = ProductVariantSkuCtrl;
