const Joi = require('joi');


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(
            ['BookshelfOrm', 'Core'],
            function (server) {

                const ExchangeRateCtrl = new (require('./controllers/ExchangeRateCtrl'))(server);

                server.route([
                    {
                        method: 'GET',
                        path: '/exchange-rate',
                        options: {
                            description: 'Gets the current ExchangeRate',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                query: Joi.object({
                                    tenant_id: Joi.string().uuid().required(),
                                })
                            },
                            handler: (request, h) => {
                                return ExchangeRateCtrl.fetchRateHandler(request, h);
                            }
                        }
                    }
                ]);


                // LOADING BOOKSHELF MODELS:
                server.app.bookshelf.model(
                    'ExchangeRate',
                    require('./models/ExchangeRate')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );
            }
        );
    }
};
