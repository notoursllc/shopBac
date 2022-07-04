const accounting = require('accounting');
const paypalSdk = require('@paypal/checkout-server-sdk');

class PayPalCtrl {

    constructor(server) {
        this.server = server;
        this.payPalEnvironment = null;
        this.paypalHttpClient = null;
    }


    /**
     * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
     */
    async getPaypalEnvironment(tenantId) {
        if(this.payPalEnvironment) {
            return this.payPalEnvironment;
        }

        const Tenant = await this.server.app.bookshelf
            .model('Tenant')
            .query((qb) => {
                qb.where('id', '=', tenantId);
            })
            .fetch();

        const clientId = Tenant.get('paypal_client_id');
        const clientSecret = Tenant.get('paypal_client_secret');

        if(!clientId) {
            throw new Error("Unable to obtain paypal client ID from Tenant")
        }
        if(!clientSecret) {
            throw new Error("Unable to obtain paypal client secret from Tenant")
        }

        if(process.env.PAYPAL_MODE === 'sandbox') {
            this.payPalEnvironment = new paypalSdk.core.SandboxEnvironment(clientId, clientSecret);
        }
        else {
            this.payPalEnvironment = new paypalSdk.core.LiveEnvironment(clientId, clientSecret);
        }

        return this.payPalEnvironment;
    }


    /**
     *
     * Returns PayPal HTTP client instance with environment that has access
     * credentials context. Use this instance to invoke PayPal APIs, provided the
     * credentials have access.
     */
    async getPaypalClient(tenantId) {
        if(this.paypalHttpClient) {
            return this.paypalHttpClient;
        }

        const payPalEnv = await this.getPaypalEnvironment(tenantId);
        this.paypalHttpClient = new paypalSdk.core.PayPalHttpClient(payPalEnv);
        return this.paypalHttpClient;
    }


    async sendRequest(tenantId, request) {
        const client = await this.getPaypalClient(tenantId);
        return client.execute(request);
    }


    getUSD(cents) {
        if(cents) {
            return accounting.toFixed(cents/100, 2);
        }
        return '0.00'
    }


    /***************
     * APIs
     ***************/

    /*
    * https://developer.paypal.com/docs/checkout/reference/server-integration/get-transaction/
    */
    async getOrder(orderId, tenantId) {
        const request = new paypalSdk.orders.OrdersGetRequest(orderId);
        return this.sendRequest(tenantId, request);
    }


    /*
    * https://developer.paypal.com/docs/checkout/integration-features/refunds/
    */
    async refundPayment(orderId, tenantId, amount) {
        const paypalData = await this.getOrder(orderId, tenantId);
        let paymentCaptureId = null;

        // console.log("PAYPAL ORDER", orderId, tenantId, paypalData.result.purchase_units[0].payments.captures)

        if(Array.isArray(paypalData.result.purchase_units) && Array.isArray(paypalData.result.purchase_units[0].payments.captures)) {
            paypalData.result.purchase_units[0].payments.captures.forEach((obj) => {
                if(obj.final_capture) {
                    paymentCaptureId = obj.id;
                }
            });
        }

        if(!paymentCaptureId) {
            throw new Error("A PayPal payment capture ID could not be found for this transaction");
        }

        const request = new paypalSdk.payments.CapturesRefundRequest(paymentCaptureId);
        request.requestBody({
            amount: {
                currency_code: 'USD',
                value: this.getUSD(amount)
            }
        });

        return this.sendRequest(tenantId, request);
    }


    /*
    * https://github.com/paypal/Checkout-NodeJS-SDK/blob/master/samples/CaptureIntentExamples/createOrder.js
    */
    async createPaymentFromCart(Cart) {
        const req = new paypalSdk.orders.OrdersCreateRequest();
        req.prefer("return=representation");

        /*
        let items = [];

        Cart.related('cart_items').forEach((CartItem) => {
            const Product = CartItem.related('product');
            console.log("++++++++++ PRODUCT ", Product.toJSON())

            // https://developer.paypal.com/docs/api/orders/v2/#definition-item
            items.push({
                name: Product.get('title'),
                description: Product.get('description'),
                sku: Product.get('id'),
                // unit_amount: {
                //     currency_code: 'USD',
                //     value: this.getUSD(
                //         CartItem.related('product_variant_sku').get('display_price')
                //     )
                // },
                // tax: {
                //     currency_code: "USD",
                //     value: "10.00"
                // },
                quantity: CartItem.get('qty'),
                sku: CartItem.related('product_variant_sku').get('sku'),
                category: 'PHYSICAL_GOODS'
            });
        });
        */

        // Full set of params here:
        // https://developer.paypal.com/docs/checkout/reference/server-integration/set-up-transaction/#on-the-server
        let requestConfig = {
            intent: 'CAPTURE',

            // https://developer.paypal.com/docs/api/orders/v2/#definition-order_application_context
            application_context: {
                brand_name: process.env.BRAND_NAME,
                locale: 'en-US',
                shipping_preference: 'NO_SHIPPING',  // NO_SHIPPING, SET_PROVIDED_ADDRESS
                user_action: 'PAY_NOW'
            },

            // https://developer.paypal.com/docs/api/orders/v2/#definition-purchase_unit_request
            purchase_units: [{
                reference_id: 'default',

                // https://developer.paypal.com/docs/api/orders/v2/#definition-amount_with_breakdown
                amount: {
                    currency_code: 'USD', // https://developer.paypal.com/docs/api/reference/currency-codes/
                    value: this.getUSD(Cart.get('grand_total')),
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: this.getUSD(Cart.get('sub_total'))
                        },
                        shipping: {
                            currency_code: 'USD',
                            value: this.getUSD(Cart.get('shipping_total'))
                        },
                        // handling: {
                        //     currency_code: 'USD',
                        //     value: '10.00'
                        // },
                        tax_total: {
                            currency_code: 'USD',
                            value: this.getUSD(Cart.get('sales_tax'))
                        },
                        // shipping_discount: {
                        //     currency_code: 'USD',
                        //     value: '10'
                        // }
                    }
                },

                /*
                items: items,
                shipping: {
                    // method: "United States Postal Service",
                    name: {
                        full_name: makeFullName(Cart.get('shipping_firstName'), Cart.get('shipping_lastName'))
                    },
                    // https://developer.paypal.com/docs/api/orders/v2/#definition-shipping_detail.address_portable
                    address: {
                        address_line_1: Cart.get('shipping_streetAddress'),
                        address_line_2: Cart.get('shipping_extendedAddress') || null,
                        admin_area_2: Cart.get('shipping_city'),
                        admin_area_1: Cart.get('shipping_state'),
                        postal_code: Cart.get('shipping_postalCode'),
                        country_code: Cart.get('shipping_countryCodeAlpha2')
                    }
                }
                */
            }]
        };

        req.requestBody(requestConfig);
        return this.sendRequest(Cart.get('tenant_id'), req);
    }


    /*
    * https://github.com/paypal/Checkout-NodeJS-SDK/blob/master/samples/CaptureIntentExamples/captureOrder.js
    */
    async executePayment(paymentToken, tenantId) {
        const req = new paypalSdk.orders.OrdersCaptureRequest(paymentToken);
        req.requestBody({});

        return this.sendRequest(tenantId, req);
    }

}


module.exports = PayPalCtrl;
