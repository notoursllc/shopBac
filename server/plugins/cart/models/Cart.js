const accounting = require('accounting');
const isObject = require('lodash.isobject');
const { DB_TABLES } = require('../../core/services/CoreService');


module.exports = function (baseModel, bookshelf, server) {
    return baseModel.extend(
        {
            tableName: DB_TABLES.carts,

            uuid: true,

            hasTimestamps: true,

            softDelete: true,

            hidden: ['token', 'closed_at'],

            virtuals: {
                num_items: function() {
                    let numItems = 0;

                    this.related('cart_items').forEach((model) => {
                        numItems += parseInt(model.get('qty') || 0, 10);
                    });

                    return numItems;
                },

                product_weight_total: function() {
                    // TODO: use product options instead
                    return 1;
                },

                // product_weight_total: function() {
                //     let weight = 0;

                //     this.related('cart_items').forEach((model) => {
                //         let prod = model.related('product');
                //         let qty = model.get('qty');
                //         let variants = model.get('variants');
                //         let selectedSizeVariant = isObject(variants) ? variants.size : null;
                //         let finalWeight = 0;

                //         if(prod && qty) {
                //             // If any of the product sizes has it's own weight_oz value, then that will
                //             // override the general weight_oz value of the product
                //             let prodSizes = prod.related('sizes');

                //             if(selectedSizeVariant && prodSizes) {
                //                 // Note 'prodSizes' is a Bookshelf collection object,
                //                 // which has a forEach function
                //                 prodSizes.forEach((ProductSize) => {
                //                     let weight = ProductSize.get('weight_oz');

                //                     if(ProductSize.get('size') === selectedSizeVariant && parseFloat(weight) > 0) {
                //                         finalWeight = parseFloat(weight);
                //                     }
                //                 })
                //             }

                //             // If none of the product sizes has a weight_oz value, then
                //             // use the general weight_oz value of the product
                //             if(!finalWeight) {
                //                 finalWeight = prod.get('weight_oz')
                //             }

                //             weight += parseFloat((finalWeight * qty) || 0);
                //         }
                //     });

                //     return accounting.toFixed(weight, 1);
                // },

                sub_total: function() {
                    // return server.plugins.Cart.getCartSubTotal( this.related('cart_data') );
                    let subtotal = 0;

                    this.related('cart_items').forEach((model) => {
                        const product_variant_sku = model.related('product_variant_sku');
                        if(product_variant_sku) {

                        }
                        subtotal += parseFloat(model.get('total_item_price') || 0);
                    });

                    // NOTE: accounting.toFixed() returns a string!
                    // http://openexchangerates.github.io/accounting.js/
                    return accounting.toFixed(subtotal, 2);
                },

                shipping_total: function() {
                    let obj = this.get('shipping_rate');
                    if(isObject(obj) && obj.amount) {
                        return accounting.toFixed(obj.amount, 2);
                    }
                    return null;
                },

                grand_total: function() {
                    let subtotal = parseFloat(this.get('sub_total'));
                    let salesTax = parseFloat(this.get('sales_tax') || 0);
                    let shipping = parseFloat(this.get('shipping_total') || 0);

                    return accounting.toFixed((subtotal + salesTax + shipping), 2);
                },

                shipping_fullName: function() {
                    let name = `${this.get('shipping_firstName')} ${this.get('shipping_lastName')}`;
                    return name.trim();
                }
            },

            // Relationships:

            // A payment could fail first, then another attempt
            // could succeed, all related to the same Cart,
            // so a Cart can have many Payments
            //
            // http://bookshelfjs.org/#Model-instance-hasMany
            // payments: function() {
            //     return this.hasMany('Payment', 'cart_id');
            // },

            // cart_id is the foreign key in CartItem
            cart_items: function() {
                return this.hasMany('CartItem', 'cart_id');
            },

            visible: [
                'id',
                // 'tenant_id',

                'billing_firstName',
                'billing_lastName',
                'billing_company',
                'billing_streetAddress',
                'billing_extendedAddress',
                'billing_city',
                'billing_state',
                'billing_postalCode',
                'billing_countryCodeAlpha2',
                'billing_phone',

                'shipping_firstName',
                'shipping_lastName',
                'shipping_streetAddress',
                'shipping_extendedAddress',
                'shipping_company',
                'shipping_city',
                'shipping_state',
                'shipping_postalCode',
                'shipping_countryCodeAlpha2',
                'shipping_email',

                'sales_tax',

                'created_at',
                'updated_at',
                // 'deleted_at'
                'closed_at',

                // virtuals
                'num_items',

                // relations
                'cart_items'
            ]
        },
        {
            masks: {
                shopping_cart: 'id,cart_items'
            }
        }
    );
};
