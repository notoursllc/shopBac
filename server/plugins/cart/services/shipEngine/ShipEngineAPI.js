const axios = require('axios');


function getAxios() {
    if(!getAxios.$axios) {
        getAxios.$axios = axios.create({
            baseURL: 'https://api.shipengine.com/v1/',
            headers: {
                'api-key': process.env.SHIPENGINE_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000, // wait for 10s
            validateStatus() {
                return true;
            }
        });
    }

    return getAxios.$axios;
}


async function getCarriers() {
    const { data } = await getAxios().get('carriers');
    return data.carriers;
}


// async function getCarrierIds() {
//     const carriers = await getCarriers();
//     return carriers.map((obj) => obj.carrier_id)
// }


/**
 * https://www.shipengine.com/docs/rates/
 *
 * @param {*} payload
 * @returns
 */
async function getRates(payload) {
    global.logger.info('REQUEST: ShipEngineAPI.getRates', {
        meta: { }
    });

    const { data } = await getAxios().post('rates', payload);

    global.logger.info('RESPONSE: ShipEngineAPI.getRates', {
        meta: { data }
    });

    return data;
}


async function getRate(id) {
    global.logger.info('REQUEST: ShipEngineAPI.getRate', {
        meta: { id }
    });

    const { data } = await getAxios().get(`rates/${id}`);

    global.logger.info('RESPONSE: ShipEngineAPI.getRate', {
        meta: { data }
    });

    return data;
}


async function buyShippingLabel(rateId) {
    global.logger.info('REQUEST: ShipEngineAPI.buyShippingLabel', {
        meta: { rateId }
    });

    const { data } = await getAxios().post(`labels/rates/${rateId}`);

    global.logger.info('RESPONSE: ShipEngineAPI.buyShippingLabel', {
        meta: { data }
    });

    return data;
}


async function getShippingLabel(labelId) {
    global.logger.info('REQUEST: ShipEngineAPI.getShippingLabel', {
        meta: { labelId }
    });

    const { data } = await getAxios().get(`labels/${labelId}`);

    global.logger.info('RESPONSE: ShipEngineAPI.getShippingLabel', {
        meta: { data }
    });

    return data;
}


/*
* https://www.shipengine.com/docs/addresses/validation/
*/
async function validateAddresses(payload) {
    global.logger.info('REQUEST: ShipEngineAPI.validateAddresses', {
        meta: { payload }
    });

    const { data } = await getAxios().post('addresses/validate', payload);

    global.logger.info('RESPONSE: ShipEngineAPI.validateAddresses', {
        meta: { data }
    });

    return data;
}


module.exports = {
    getRates,
    getRate,
    buyShippingLabel,
    getShippingLabel,
    validateAddresses
};
