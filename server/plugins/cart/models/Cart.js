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

            format(attributes) {
                if (attributes.selected_shipping_rate) {
                    attributes.selected_shipping_rate = JSON.stringify(attributes.selected_shipping_rate)
                }

                if (attributes.shipping_rate_quote) {
                    attributes.shipping_rate_quote = JSON.stringify(attributes.shipping_rate_quote)
                }

                if (attributes.tax_nexus_applied) {
                    attributes.tax_nexus_applied = JSON.stringify(attributes.tax_nexus_applied)
                }

                return attributes;
            },

            virtuals: {
                num_items: function() {
                    let numItems = 0;

                    this.related('cart_items').forEach((model) => {
                        numItems += parseInt(model.get('qty') || 0, 10);
                    });

                    return numItems;
                },

                weight_oz_total: function() {
                    let weight = 0;

                    this.related('cart_items').forEach((model) => {
                        weight += model.get('item_weight_total') || 0;
                    });

                    return weight;
                },

                sub_total: function() {
                    // return server.plugins.Cart.getCartSubTotal( this.related('cart_data') );
                    let subtotal = 0;

                    this.related('cart_items').forEach((model) => {
                        subtotal += model.get('item_price_total') || 0;
                    });

                    return subtotal;

                    // NOTE: accounting.toFixed() returns a string!
                    // http://openexchangerates.github.io/accounting.js/
                    // return accounting.toFixed(subtotal, 2);
                },

                /**
                 * Calculate the sales tax amount.
                 * https://blog.taxjar.com/sales-tax-and-shipping/
                 *
                 * UPDATE: Commenting this out for now since I am using
                 * Stripe Tax instead, and thus sales_tax is now an actual
                 * column in the DB
                 */
                //  sales_tax: function() {
                //     const tax_nexus_applied = this.get('tax_nexus_applied');
                //     let taxableAmount = 0;

                //     this.related('cart_items').forEach((CartItem) => {
                //         const ProductVariant = CartItem.related('product_variant');

                //         if(ProductVariant && ProductVariant.get('is_taxable')) {
                //             taxableAmount += CartItem.get('item_price_total') || 0;
                //         }
                //     });

                //     const taxAmount = taxableAmount && isObject(tax_nexus_applied) && tax_nexus_applied.tax_rate
                //         ? taxableAmount * tax_nexus_applied.tax_rate
                //         : 0;

                //     // accounting.toFixed returns a string, so converting to float:
                //     return Math.ceil(taxAmount);
                // },


                shipping_total: function() {
                    const obj = this.get('selected_shipping_rate');
                    let total = 0;

                    if(isObject(obj)) {
                        if(isObject(obj.shipping_amount)) {
                            total += obj.shipping_amount.amount ? obj.shipping_amount.amount * 100 : 0;
                        }

                        if(isObject(obj.other_amount)) {
                            total += obj.other_amount.amount ? obj.other_amount.amount * 100 : 0;
                        }

                        if(isObject(obj.insurance_amount)) {
                            total += obj.insurance_amount.amount ? obj.insurance_amount.amount * 100 : 0;
                        }

                        if(isObject(obj.confirmation_amount)) {
                            total += obj.confirmation_amount.amount ? obj.confirmation_amount.amount * 100 : 0;
                        }
                    }

                    return total;
                },

                grand_total: function() {
                    const subtotal = this.get('sub_total') || 0;
                    const salesTax = this.get('sales_tax') || 0;
                    const shipping = this.get('shipping_total') || 0;

                    return subtotal + salesTax + shipping;
                },

                tax_rate: function() {
                    const salesTax = this.get('sales_tax') || 0;
                    const grandTotal = this.get('grand_total');

                    if(!salesTax || !grandTotal) {
                        return null;
                    }

                    const preTaxGrandTotal = grandTotal - salesTax;
                    return (salesTax / preTaxGrandTotal).toFixed(5);
                },

                shipping_fullName: function() {
                    return `${this.get('shipping_firstName')} ${this.get('shipping_lastName')}`.trim();
                },

                billing_fullName: function() {
                    const prefix = this.get('billing_same_as_shipping') ? 'shipping' : 'billing';
                    return `${this.get(`${prefix}_firstName`)} ${this.get(`${prefix}_lastName`)}`.trim();
                },

                billing_address: function() {
                    const prefix = this.get('billing_same_as_shipping') ? 'shipping' : 'billing';

                    return {
                        firstName: this.get(`${prefix}_firstName`),
                        lastName: this.get(`${prefix}_lastName`),
                        streetAddress: this.get(`${prefix}_streetAddress`),
                        extendedAddress: this.get(`${prefix}_extendedAddress`),
                        city: this.get(`${prefix}_city`),
                        state: this.get(`${prefix}_state`),
                        postalCode: this.get(`${prefix}_postalCode`),
                        countryCodeAlpha2: this.get(`${prefix}_countryCodeAlpha2`),
                        phone: this.get(`${prefix}_phone`)
                    }
                }
            },

            // Relationships:

            // cart_id is the foreign key in CartItem
            cart_items: function() {
                return this.hasMany('CartItem', 'cart_id');
            },

            // cart_id is the foreign key in CartRefund
            cart_refunds: function() {
                return this.hasMany('CartRefund', 'cart_id');
            },

            hidden: [
                'tenant_id',
                'deleted_at'
            ]
        },
        {
            masks: {
                shopping_cart: 'id,cart_items'
            }
        }
    );
};
