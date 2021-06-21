const accounting = require('accounting');
const paypalSdk = require('@paypal/checkout-server-sdk');


function getUSD(cents) {
    if(cents) {
        return accounting.toFixed(cents/100, 2);
    }
    return '0.00'
}

function makeFullName(first, last) {
    const names = [];
    names.push(first, last);
    return names.join(' ');
}


/**
 *
 * Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access.
 */
function getPaypalClient() {
    return new paypalSdk.core.PayPalHttpClient( getPaypalEnvironment() );
}


/**
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 */
function getPaypalEnvironment() {
    const clientId = process.env.PAYPAL_CLIENT_ID || 'PAYPAL-SANDBOX-CLIENT-ID';
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'PAYPAL-SANDBOX-CLIENT-SECRET';

    if(process.env.PAYPAL_MODE === 'sandbox') {
        return new paypalSdk.core.SandboxEnvironment(
            clientId, clientSecret
        );
    }

    return new paypalSdk.core.ProductionEnvironment(
        clientId, clientSecret
    );
}


/***************
 * APIs
 ***************/

/*
* https://developer.paypal.com/docs/checkout/reference/server-integration/get-transaction/
*/
function getOrder(orderId) {
    const request = new paypalSdk.orders.OrdersGetRequest(orderId);
    return getPaypalClient().execute(request);
}


/*
* https://github.com/paypal/Checkout-NodeJS-SDK/blob/master/samples/CaptureIntentExamples/createOrder.js
*/
function createPaymentFromCart(Cart) {
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
            //     value: getUSD(
            //         CartItem.related('product_variant_sku').get('display_price') || CartItem.related('product_variant').get('display_price')
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
                value: getUSD(Cart.get('grand_total')),
                breakdown: {
                    item_total: {
                        currency_code: 'USD',
                        value: getUSD(Cart.get('sub_total'))
                    },
                    shipping: {
                        currency_code: 'USD',
                        value: getUSD(Cart.get('shipping_total'))
                    },
                    // handling: {
                    //     currency_code: 'USD',
                    //     value: '10.00'
                    // },
                    tax_total: {
                        currency_code: 'USD',
                        value: getUSD(Cart.get('sales_tax'))
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
    return getPaypalClient().execute(req);
}


/*
* https://github.com/paypal/Checkout-NodeJS-SDK/blob/master/samples/CaptureIntentExamples/captureOrder.js
*/
function executePayment(paymentToken) {
    const req = new paypalSdk.orders.OrdersCaptureRequest(paymentToken);
    req.requestBody({});

    return getPaypalClient().execute(req);
}



module.exports = {
    getPaypalClient,
    getOrder,
    createPaymentFromCart,
    executePayment
};
