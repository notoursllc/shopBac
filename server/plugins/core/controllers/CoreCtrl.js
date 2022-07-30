const Boom = require('@hapi/boom');
const robotstxt = require('generate-robotstxt');
const ExchangeRateCtrl = require('../../exchange-rates/controllers/ExchangeRateCtrl.js');

class CoreCtrl {

    constructor(server) {
        this.ExchangeRateCtrl = new ExchangeRateCtrl(server);
    }


    appConfigHandler(request, h) {
        // TODO: use ExchangeRateCtrl to fetch/return client-specific exchange rate data
        return h.apiSuccess({
            CART_PRODUCT_QUANTITY_LIMIT: parseInt(process.env.CART_PRODUCT_QUANTITY_LIMIT, 10)
        });
    }


    loggerHandler(request, h) {
        switch(request.payload.type) {
            // Only supportig the 'error' and 'info' types for now
            case 'error':
                global.logger.error(
                    new Error(request.payload.message)
                );
                break;

            default:
                global.logger.info(request.payload.message);
        }

        h.apiSuccess();
    }


    async healthzHandler(h) {
        try {
            const result = await server.app.knex.raw('SELECT * FROM products WHERE id != ? LIMIT 1', ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']);

            if(!result) {
                throw new Error('Health check: Error getting product.');
            }

            const response = h.response('success');
            response.type('text/plain');
            return response;
        }
        catch(err) {
            throw Boom.badRequest(err);
        }
    }


    /**
     * Generates a robots.txt. file
     * https://moz.com/learn/seo/robotstxt
     * https://www.robotstxt.org/
     *
     * @param {*} request
     * @param {*} h
     */
    async robotsHandler(h) {
        try {
            const host = `http://www.${process.env.DOMAIN_NAME}`;
            const defaultDisallow = [
                '/acts/*',
                '/cart/*',
                '/order/*'
            ];

            const robotsText = await robotstxt({
                policy: [
                    {
                        userAgent: '*',
                        allow: '/',
                        disallow: defaultDisallow,
                        crawlDelay: 2
                    },
                    {
                        userAgent: 'Nutch',
                        disallow: '/'
                    }
                ],
                sitemap: `${host}/sitemap.xml`,
                host: host
            });

            return h.response(robotsText).type('text/plain');
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }

}

module.exports = CoreCtrl;
