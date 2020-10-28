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
async function createCustomerFromShoppingCart(Cart) {
    try {
        const apiInstance = getPaymentsApi();

        // https://github.com/square/connect-nodejs-sdk/blob/master/docs/CreateCustomerRequest.md
        let data = await apiInstance.createCustomer({
            idempotency_key: generateIdempotencyKey(),
            given_name: Cart.get('shipping_firstName'),
            family_name: Cart.get('shipping_lastName'),
            company_name: Cart.get('shipping_company'),
            email_address: Cart.get('shipping_email'),

            // https://github.com/square/connect-nodejs-sdk/blob/master/docs/Address.md
            address: {
                first_name: Cart.get('shipping_firstName'),
                last_name: Cart.get('shipping_lastName'),
                address_line_1: Cart.get('shipping_streetAddress'),
                address_line_2: Cart.get('shipping_extendedAddress') || null,
                locality: Cart.get('shipping_city'),
                administrative_district_level_1: Cart.get('shipping_state'),
                postal_code: Cart.get('shipping_postalCode'),
                country: Cart.get('shipping_countryCodeAlpha2')
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
