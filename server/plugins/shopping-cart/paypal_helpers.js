const paypalSdk = require('@paypal/checkout-server-sdk');
const axios = require('axios');

function getPalPalAxios() {
    // return axios;
    try {
        if(!getPalPalAxios.$axios) {
            getPalPalAxios.$axios = axios.create({
                baseURL: 'https://api.sandbox.paypal.com',
                timeout: 10000,
                headers: {
                    'Authorization':  `Bearer ${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });
        }

        return getPalPalAxios.$axios;
    }
    catch(err) {
        console.log("Axios create error", err)
    }
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
    let clientId = process.env.PAYPAL_CLIENT_ID || 'PAYPAL-SANDBOX-CLIENT-ID';
    let clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'PAYPAL-SANDBOX-CLIENT-SECRET';

    if(process.env.PAYPAL_MODE === 'sandbox') {
        return new paypalSdk.core.SandboxEnvironment(
            clientId, clientSecret
        );
    }

    return new paypalSdk.core.ProductionEnvironment(
        clientId, clientSecret
    );
}


module.exports = {
    getPaypalClient,
    getPalPalAxios
}
