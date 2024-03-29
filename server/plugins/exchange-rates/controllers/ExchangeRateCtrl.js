

const Joi = require('joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');
const OpenExchangeRatesService = require('../services/OpenExchangeRatesService.js');


class ExchangeRateCtrl extends BaseController {

    constructor(server) {
        super(server, 'ExchangeRate');
    }


    getSchema() {
        return {
            id: Joi.string().uuid().allow(null),
            base: Joi.string(),
            rates: Joi.alternatives().try(Joi.object(), Joi.allow(null)),
            created_at: Joi.date(),
            updated_at: Joi.date(),
        };
    }


    async fetchLatestRates() {
        const data = await OpenExchangeRatesService.getLatestRates();

        if(data.error) {
            global.logger.error(data.description);
            global.bugsnag(data.description);
            return;
        }

        // There will only ever be one entry in this table.
        // Right now I dont see the value in keeping historical data
        // about every exchange rate as long as the exchange rate used is persisted in the cart
        try {
            await this.getModel()
                .forge({ id: 1 })
                .destroy();
        }
        catch(err) {
            // drop the error
        }

        const ExchangeRate = await this.getModel()
            .forge()
            .save({
                id: 1,
                base: data.base,
                rates: data.rates
            });

        return ExchangeRate;
    }


    fetchRate(fetchConfig) {
        return this.getModel()
            .forge({ id: 1 })
            .fetch(fetchConfig);
    }


    async fetchRateHandler(request, h, fetchConfig) {
        try {
            global.logger.info('REQUEST: ExchangeRateCtrl.fetchRateHandler', {
                meta: {
                    fetchConfig
                }
            });

            const ExchangeRate = await this.fetchRate(fetchConfig)
            const modelJson = ExchangeRate ? ExchangeRate.toJSON() : null;

            global.logger.info('RESPONSE: ExchangeRateCtrl.fetchRateHandler', {
                meta: modelJson
            });

            return h.apiSuccess(
                modelJson
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }


    async refreshRateHandler(request, h) {
        try {
            global.logger.info('REQUEST: ExchangeRateCtrl.refreshRateHandler', {
                meta: {}
            });

            const ExchangeRate = await this.fetchLatestRates();

            global.logger.info('RESPONSE: ExchangeRateCtrl.refreshRateHandler', {
                meta: {
                    rate: ExchangeRate ? ExchangeRate.toJSON() : null
                }
            });

            return h.apiSuccess(
                ExchangeRate
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }

}

module.exports = ExchangeRateCtrl;
