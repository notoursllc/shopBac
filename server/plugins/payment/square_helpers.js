const SquareConnect = require('square-connect');
const uuidV4 = require('uuid/v4');


const defaultClient = SquareConnect.ApiClient.instance;
defaultClient.basePath = (process.env.NODE_ENV === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com');


const oauth2 = defaultClient.authentications['oauth2'];
oauth2.accessToken = (process.env.NODE_ENV === 'production' ? process.env.SQUARE_PRODUCTION_ACCESS_TOKEN : process.env.SQUARE_SANDBOX_ACCESS_TOKEN);





function getLocationId() {
    return process.env.NODE_ENV === 'production' ? process.env.SQUARE_PRODUCTION_LOCATION_ID : process.env.SQUARE_SANDBOX_LOCATION_ID;
}


function getPaymentsApi() {
    return new SquareConnect.PaymentsApi();
}


function generateIdempotencyKey() {
    return uuidV4();
}


/**
 * Creates a "Customer"
 *
 * https://developer.squareup.com/reference/square/customers-api/create-customer
 * @param {*} data
 */
async function createCustomerFromShoppingCart(ShoppingCart) {
    try {
        const apiInstance = getPaymentsApi();

        // https://github.com/square/connect-nodejs-sdk/blob/master/docs/CreateCustomerRequest.md
        let data = await apiInstance.createCustomer({
            idempotency_key: generateIdempotencyKey(),
            given_name: ShoppingCart.get('shipping_firstName'),
            family_name: ShoppingCart.get('shipping_lastName'),
            company_name: ShoppingCart.get('shipping_company'),
            email_address: ShoppingCart.get('shipping_email'),

            // https://github.com/square/connect-nodejs-sdk/blob/master/docs/Address.md
            address: {
                first_name: ShoppingCart.get('shipping_firstName'),
                last_name: ShoppingCart.get('shipping_lastName'),
                address_line_1: ShoppingCart.get('shipping_streetAddress'),
                address_line_2: ShoppingCart.get('shipping_extendedAddress') || null,
                locality: ShoppingCart.get('shipping_city'),
                administrative_district_level_1: ShoppingCart.get('shipping_state'),
                postal_code: ShoppingCart.get('shipping_postalCode'),
                country: ShoppingCart.get('shipping_countryCodeAlpha2')
            }
        });

        global.logger.info('RESPONSE: createCustomerFromShoppingCart', {
            meta: data
        });

        return data;
    }
    catch(error) {
        // trying to build a more coherent error message from the Square API error
        const errorJson = JSON.parse(error.response.text);

        if(isObject(errorJson) && errorJson.errors) {
            let errors = [];
            errorJson.errors.forEach((obj) => {
                errors.push(obj.detail || 'Invalid request');
            })
            throw new Error(errors.join(', '))
        }

        throw new Error('Invalid request');
    }
}


module.exports = {
    getLocationId,
    getPaymentsApi,
    generateIdempotencyKey,
    createCustomerFromShoppingCart
}
