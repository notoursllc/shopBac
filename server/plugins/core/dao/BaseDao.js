const GERNERIC_ERROR_MSG = 'An error occurred while executing the DB operation.';
const { DB_TABLES } = require('../services/CoreService.js');


class BaseDao {

    constructor(server) {
        this.knex = server.app.knex;
        this.tableName = null;
        this.schema = {};
        this.hidden = ['tenant_id', 'deleted_at'];
        this.softDelete = false;
        this.tables = DB_TABLES;
    }

    getSchema() {
        return this.schema;
    }


    getKnex(transactionFn) {
        if(transactionFn) {
            return transactionFn(this.tableName);
        }

        return this.knex(this.tableName);
    }


    getAllColumns(includeHiddenCols) {
        let keys = Object.keys(this.schema);

        if(!includeHiddenCols) {
            keys = keys.filter(key => !this.hidden.includes(key))
        }

        // using a Set will de-dupe the column names
        const colNameSet = new Set(keys);
        return Array.from(colNameSet);
    }


    sanitize(results) {
        const arr = Array.isArray(results) ? results : [results];

        const clean = arr.map((obj) => {
            this.hidden.forEach((key) => {
                delete obj[key];
            });
            return obj;
        });

        return clean;
    }


    stripInvalidCols(data) {
        const cols = this.getAllColumns();
        const validData = {};

        for(const key in data) {
            if(cols.includes(key)) {
                validData[key] = data[key];
            }
        }

        return validData;
    }


    prepareForUpsert(data) {
        const doClean = (obj) => {
            const d = { ...this.upsertFormat(obj) };
            delete d.created_at;
            delete d.updated_at;
            delete d.deleted_at;

            return d;
        }

        if(Array.isArray(data)) {
            return data.map((obj) => doClean(obj));
        }

        return doClean(data);
    }


    async addRelations(parentResults, childQuery, parentResultKey, childResultKey, relationName) {
        const parentIds = [];

        if(!Array.isArray(parentResults)) {
            parentResults = [parentResults]
        }

        parentResults.forEach(result => {
            if(result.hasOwnProperty(parentResultKey) && result[parentResultKey] !== null) {
                parentIds.push( result[parentResultKey] );
            }
        });

        const relations = await childQuery.whereIn(childResultKey, parentIds);

        parentResults.map((row) => {
            row[relationName] = relations.filter((r) => r[childResultKey] === row[parentResultKey])
            return row;
        });

        return parentResults;
    }


    async tenantInsert(tenant_id, data, trx) {
        this.throwIfNoTenantId(tenant_id);

        try {
            const payload = this.tenantBuildCreatePayload(
                tenant_id,
                data
            );

            return this.getKnex(trx)
                .returning('id')
                .insert(payload)
                .into(this.tableName);
        }
        catch(err) {
            console.error(err);
            throw new Error(GERNERIC_ERROR_MSG);
        }
    }


    async tenantUpdate(tenant_id, id, data) {
        this.throwIfNoTenantId(tenant_id);

        try {
            const payload = this.tenantBuildUpdatePayload(
                tenant_id,
                data
            );

            return this.getKnex()
                .returning('id')
                .where({
                    id: id,
                    tenant_id: tenant_id
                })
                .whereNull('deleted_at')
                .update(payload);
        }
        catch(err) {
            console.error(err);
            throw new Error(GERNERIC_ERROR_MSG);
        }
    }


    async tenantGet(tenant_id, id) {
        this.throwIfNoTenantId(tenant_id);

        try {
            const results = await this.knex
                .select(this.getAllColumns())
                .from(this.tableName)
                .where({
                    tenant_id,
                    id
                })
                .whereNull('deleted_at')

            return this.sanitize(results);
        }
        catch(err) {
            console.error(err);
            throw new Error(GERNERIC_ERROR_MSG);
        }
    }


    /*
    * Deletes one row
    * http://knexjs.org/#Builder-del%20/%20delete
    */
    tenantDeleteOne(tenant_id, id) {
        this.throwIfNoTenantId(tenant_id);

        try {
            // soft delete
            if(this.softDelete) {
                return this.getKnex()
                    .returning('id')
                    .where({
                        id: id,
                        tenant_id: tenant_id
                    })
                    .whereNull('deleted_at')
                    .update({
                        deleted_at: this.knex.fn.now()
                    });
            }

            // or hard delete
            return this.getKnex()
                .returning('id')
                .where({
                    id: id,
                    tenant_id: tenant_id
                })
                .del();
        }
        catch(err) {
            console.error(err);
            throw new Error(GERNERIC_ERROR_MSG);
        }
    }
}

module.exports = BaseDao;
