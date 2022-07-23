const axios = require('axios');


async function getAxios() {
    return axios.create({
        baseURL: 'https://openexchangerates.org/api/',
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 10000, // wait for 10s
        validateStatus() {
            return true;
        }
    });
}


/**
 * https://docs.openexchangerates.org/docs/latest-json
 *
 * @returns
 */
async function getLatestRates() {
    global.logger.info('REQUEST: OpenExchangeRatesService.getLatestRates', {
        meta: {}
    });

    const $axios = await getAxios();
    const response = await $axios.get('latest.json', {
        params: {
            app_id: process.env.OPEN_EXCHANGE_RATES_APP_ID,
            base: 'USD'
        }
    });

    global.logger.info('RESPONSE: OpenExchangeRatesService.getLatestRates', {
        meta: response?.data
    });

    return response?.data;
}



module.exports = {
    getLatestRates
}
