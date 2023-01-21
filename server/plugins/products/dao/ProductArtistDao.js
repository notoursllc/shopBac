const Joi = require('joi');
const BaseDao = require('../../core/dao/BaseDao.js');


class ProductArtistDao extends BaseDao {

    constructor(server) {
        super(server);
        this.tableName = this.tables.product_artists;
        this.softDelete = true;

        this.schema = {
            id: Joi.string().uuid(),
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().default(true),
            is_global: Joi.boolean().default(true),
            name: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            description: Joi.alternatives().try(
                Joi.string().trim(),
                Joi.allow(null)
            ),
            website: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            city: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            state: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            countryCodeAlpha2: Joi.alternatives().try(
                Joi.string().trim().max(2),
                Joi.allow(null)
            ),
            image: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            alt_text: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date()
        };
    }


    async addArtistRelationToProducts(products) {
        const artistIds = [];

        products.forEach(prod => {
            if(prod.hasOwnProperty('product_artist_id') && prod['product_artist_id'] !== null) {
                artistIds.push( prod['product_artist_id'] );
            }
        });

        const artists = await this.knex
            .select(this.getAllColumns())
            .distinct()
            .from(this.tables.product_artists)
            .whereIn('id', artistIds);

        products.map((row) => {
            row.artist = artists.filter((r) => r.id === row.product_artist_id)[0]
            return row;
        });

        return products;
    }

}

module.exports = ProductArtistDao;
