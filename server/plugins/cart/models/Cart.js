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
                 * Pretty simple for now as we only have nexus in CA.
                 *
                 * https://blog.taxjar.com/sales-tax-and-shipping/
                 */
                sales_tax: function() {
                    let taxAmount = 0;
                    const subTotal = this.get('sub_total');

                    if(this.get('shipping_countryCodeAlpha2') === 'US' && subTotal) {
                        switch(this.get('shipping_state')) {
                            case 'CA':
                                // NOTE: shipping is not taxable in CA as long as we show the shipping
                                // cost as a separate line item (i.e. not included in the price)
                                taxAmount = subTotal * parseFloat(process.env.TAX_RATE_CALIFORNIA || '0.09');
                                break;

                            default:
                        }
                    }

                    // accounting.toFixed returns a string, so converting to float:
                    // return accounting.toFixed(taxAmount, 2);
                    return Math.ceil(taxAmount);
                },

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

                shipping_fullName: function() {
                    let name = `${this.get('shipping_firstName')} ${this.get('shipping_lastName')}`;
                    return name.trim();
                }
            },

            // Relationships:

            // cart_id is the foreign key in CartItem
            cart_items: function() {
                return this.hasMany('CartItem', 'cart_id');
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
