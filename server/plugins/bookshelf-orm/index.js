const Joi = require('joi');
const Hoek = require('@hapi/hoek');


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        let knex;
        let bookshelf = null;

        const schema = Joi.object().keys({
            knex: Joi.object().keys({
                client: Joi.string().optional(),
                connection: Joi.string().optional(),
                debug: Joi.boolean().optional()
            }).optional()
        });

        const validateOptions = schema.validate(options);
        if (validateOptions.error) {
            global.logger.error(
                new Error(validateOptions.error)
            );
            throw new Error(validateOptions.error);
        }

        const settings = Hoek.applyToDefaults(
            { knex: require('../../../knexfile') },
            options
        );

        try {
            knex = require('knex')(settings.knex);
        }
        catch (ex) {
            throw new Error('Bad Knex Options: ' + ex.toString());
        }

        try {
            bookshelf = require('bookshelf');
            bookshelf = bookshelf(knex);
        }
        catch (ex) {
            throw new Error('Bookshelf setup error: ' + ex.toString());
        }

        // loading bookshelf plugins:
        ['bookshelf-virtuals-plugin', 'bookshelf-uuid', 'bookshelf-paranoia', 'bookshelf-mask'].map((plugin) => {
            bookshelf.plugin(plugin);
        });

        server.app.bookshelf = bookshelf;
        server.app.knex = knex
    }
};
