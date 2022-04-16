const Joi = require('@hapi/joi');
const isObject = require('lodash.isobject');
const { DB_TABLES } = require('../../core/services/CoreService.js');
const BaseDao = require('../../core/dao/BaseDao.js');
const ProductVariantDao = require('./ProductVariantDao.js');
const ProductVariantSkuDao = require('./ProductVariantSkuDao.js');
const ProductArtistDao = require('./ProductArtistDao.js');

const joiPositiveNumberOrNull = Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.allow(null)
);


class ProductDao extends BaseDao {

    constructor(server) {
        super(server);
        this.ProductVariantDao = new ProductVariantDao(server);
        this.ProductVariantSkuDao = new ProductVariantSkuDao(server);
        this.ProductArtistDao = new ProductArtistDao(server);

        this.tableName = DB_TABLES.products;
        this.softDelete = true;

        this.schema = {
            id: Joi.string().uuid(),
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().default(false),
            title: Joi.alternatives().try(Joi.string().trim().max(100), Joi.allow(null)),
            caption: Joi.alternatives().try(Joi.string().trim().max(100), Joi.allow(null)),
            description: Joi.alternatives().try(Joi.string().trim().max(500), Joi.allow(null)),
            is_good: Joi.boolean().default(true),

            // these should be stringified values in the payload:
            metadata: Joi.alternatives().try(Joi.array(), Joi.allow(null)),

            // TYPES
            type: joiPositiveNumberOrNull,
            sub_type: joiPositiveNumberOrNull,
            sales_channel_type: joiPositiveNumberOrNull,
            package_type: joiPositiveNumberOrNull,
            vendor_type: joiPositiveNumberOrNull,
            collections: joiPositiveNumberOrNull,
            gender_type: joiPositiveNumberOrNull,
            fit_type: joiPositiveNumberOrNull,
            sleeve_length_type: joiPositiveNumberOrNull,
            feature_type: joiPositiveNumberOrNull,

            // SEO
            seo_page_title: Joi.alternatives().try(
                Joi.string().trim().max(70),
                Joi.allow(null)
            ),
            seo_page_desc: Joi.alternatives().try(
                Joi.string().trim().max(320),
                Joi.allow(null)
            ),
            seo_uri: Joi.alternatives().try(
                Joi.string().trim().max(50),
                Joi.allow(null)
            ),

            // MEDIA
            // images: Joi.array().allow(null),
            video_url: Joi.string().trim().max(500).empty('').allow(null).default(null),

            // SHIPPING
            shippable: Joi.boolean().empty('').default(true),
            customs_country_of_origin: Joi.alternatives().try(
                Joi.string().max(2),
                Joi.allow(null)
            ),
            customs_harmonized_system_code: Joi.alternatives().try(
                Joi.string(),
                Joi.allow(null)
            ),

            // PACKAGING
            ship_alone: Joi.boolean().empty('').default(false),
            packing_length_cm: joiPositiveNumberOrNull,
            packing_width_cm: joiPositiveNumberOrNull,
            packing_height_cm: joiPositiveNumberOrNull,

            // TAX
            tax_code: Joi.alternatives().try(
                Joi.string().trim().max(50),
                Joi.allow(null)
            ),

            product_artist_id: Joi.string().uuid().optional().empty('').allow(null).default(null),

            // variants: Joi.array().items(
            //     // Note: should not pass the 'isUpdate' flag to getSchema() in this case.
            //     // When creating a product, the user doesn't necessarily have to also create variants,
            //     // therefore updating a product may be the first time that a variants is added, in
            //     // which case the variant will not have an id
            //     Joi.object(this.ProductVariantDao.getSchema())
            // ),

            // TIMESTAMPS
            created_at: Joi.date(),
            updated_at: Joi.date()
            // deleted_at: Joi.date()
        };

        // experimental
        this.foreignKeys = {
            'product_artist_id': { as: 'artist', relation: 'belongsTo'}
        };

        this.relations = {
            variants: { relation: 'hasMany', key: 'product_id', dao: this.ProductVariantDao },
            // artist: { relation: 'belongsTo', key: 'product_artist_id', dao: this.ProductArtistDao }
        }
    }


    getSchemaWithRelations() {
        return {
            ...this.schema,
            variants: Joi.array().items(
                // Note: should not pass the 'isUpdate' flag to getSchema() in this case.
                // When creating a product, the user doesn't necessarily have to also create variants,
                // therefore updating a product may be the first time that a variants is added, in
                // which case the variant will not have an id
                Joi.object(this.ProductVariantDao.getSchemaWithRelations())
            )
        }
    }


    upsertFormat(data) {
        if (data.metadata) {
            data.metadata = JSON.stringify(data.metadata)
        }

        return data;
    }


    async tenantGet(tenant_id, id, relations) {
        let requestedRelations;

        if(relations === '*') {
            requestedRelations = this.relations;
        }
        else if(Array.isArray(relations)) {
            relations.forEach((name) => {
                if(this.relations[name]) {
                    if(!isObject(requestedRelations)) {
                        requestedRelations = {};
                    }
                    requestedRelations[name] = this.relations[name];
                }
            });
        }

        const results = await super.tenantGet(tenant_id, id);
        console.log("RESULTS", results);
        console.log("requestedRelations", requestedRelations);

        if(isObject(requestedRelations)) {
            const ids = results.map(obj => obj.id);
            console.log("IDS", ids)

            for(let relationName in requestedRelations) {
                const dao = requestedRelations[relationName].dao;

                // hasMany
                if(requestedRelations[relationName].relation === 'hasMany') {
                    const relationResults = await dao.getKnex()
                        .select(dao.getAllColumns())
                        .where({
                            tenant_id
                        })
                        .whereIn(requestedRelations[relationName].key, ids)
                        .whereNull('deleted_at');

                    console.log("relationResults", relationResults)

                    // For each original search result
                    // add an array for the relation name
                    // and loop through the relation search results
                    // to see if the id's match
                    results.forEach((result) => {
                        result[relationName] = [];

                        relationResults.forEach((relationResult) => {
                            if(relationResult[requestedRelations[relationName].key] === result.id) {
                                result[relationName].push(relationResult);
                            }
                        });
                    });
                }
            }
        }

        console.log("FINAL RESULTS", results)

        return results;
    }







}

module.exports = ProductDao;
