const Joi = require('@hapi/joi');
const BaseController = require('../core/BaseController');


class ProductArtistCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductArtist');
    }


    getSchema() {
        return {
            name: Joi.string().max(100).required(),
            email: Joi.string().max(100).optional(),
            icon: Joi.any().optional(),
            city: Joi.string().max(100).optional(),
            prov_state: Joi.string().max(100).optional(),
            country: Joi.string().length(2).optional(),
            description_long: Joi.string().optional(),
            description_short: Joi.string().optional(),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    async getProductsForArtistHandler(artistId, h) {
        return this.fetchAllHandler(h, (qb) => {
            qb.where('product_artist_id', '=', artistId);
        });
    }

}

module.exports = ProductArtistCtrl;
