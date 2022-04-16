const Joi = require('@hapi/joi');
const { DB_TABLES } = require('../../core/services/CoreService.js');
const BaseDao = require('../../core/dao/BaseDao.js');
// const ProductDao2 = require('./ProductDao.js');

class ProductArtistDao extends BaseDao {

    constructor(server) {
        super(server);
        // this.ProductDao = new ProductDao(server);
        this.tableName = DB_TABLES.product_artists;
        this.softDelete = true;

        this.schema = {
            id: Joi.string().uuid(),
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().default(true),
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
            created_at: Joi.date(),
            updated_at: Joi.date()
        }

        // this.foreignKeys = {
        //     'product_variant_id': { as: 'product', relation: 'belongsTo'}
        // };

        this.relations = {
            products: { relation: 'hasMany', key: 'product_artist_id', dao: this.ProductDao },
        }
    }

}

module.exports = ProductArtistDao;
