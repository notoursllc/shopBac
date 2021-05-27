const axios = require('axios');

class ShipEngine {

    constructor() {
        this.$axios = axios.create({
            baseURL: 'https://api.shipengine.com/v1/',
            headers: {
                'api-key': process.env.SHIPENGINE_API_KEY,
                'Content-Type': 'application/json'
            },
            validateStatus() {
                return true;
            }
        });
    }

    async getCarriers() {
        const { data } = await this.$axios.get('carriers');
        return data.carriers;
    }

    async getCarrierIds() {
        const carriers = await this.getCarriers();
        return carriers.map((obj) => obj.carrier_id)
    }

}


module.exports = ShipEngine;
