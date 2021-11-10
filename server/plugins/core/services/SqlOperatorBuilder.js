const qs = require('qs');
const isObject = require('lodash.isobject');

/**
 * This pattern was inspired by: https://strapi.oschina.io/documentation/v3.x/content-api/parameters.html#available-operators
 *
 * No suffix or eq: Equals
 * ne: Not equals
 * lt: Less than
 * gt: Greater than
 * lte: Less than or equal to
 * gte: Greater than or equal to
 * in: Included in an array of values
 * nin: Isn't included in an array of values
 * like: %like%
 * null: Is null/Is not null
 *
 * https://knexjs.org/#Builder-wheres
 */
 function buildFilters(query, qb) {
    const parsed = qs.parse(query);
    // console.log("PARSED STR", parsed);

    const operators = {
        eq: 'eq',
        ne: 'ne',
        lt: 'lt',
        gt: 'gt',
        lte: 'lte',
        gte: 'gte',
        in: 'in',
        nin: 'nin',
        like: 'like',
        null: 'null'
    }

    const blacklist = [
        '_pageSize',
        '_page',
        '_sort',
        '_withRelated'
    ];

    let whereUsed = false;


    const addWhere = (prop, operator, value) => {
        if(!whereUsed) {
            qb.where(prop, operator, value);
            whereUsed = true;
        }
        else {
            qb.andWhere(prop, operator, value);
        }
    }

    const trimArray = (arr) => {
        const clean = [];

        arr.forEach((item) => {
            const trimmed = item.trim();
            if(trimmed) {
                clean.push(trimmed)
            }
        });

        return clean;
    }

    for(let prop in parsed) {
        let operator = operators.eq;
        let propValue = parsed[prop];

        // an operator modifier is an object
        // with only one key, which is one of the
        // keys in 'operators'
        if(isObject(parsed[prop])) {
            const keys = Object.keys(parsed[prop]);

            if(keys.length === 1 && operators.hasOwnProperty(keys[0])) {
                operator = keys[0];
                propValue = parsed[prop][operator];
            }
        }

        if(!blacklist.includes(prop)) {
            switch(operator) {
                case operators.eq:
                    addWhere(prop, '=', propValue)
                    break;

                case operators.ne:
                    addWhere(prop, '!=', propValue)
                    break;

                case operators.lt:
                    addWhere(prop, '<', propValue)
                    break;

                case operators.gt:
                    addWhere(prop, '>', propValue)
                    break;

                case operators.lte:
                    addWhere(prop, '<=', propValue)
                    break;

                case operators.gte:
                    addWhere(prop, '>=', propValue)
                    break;

                case operators.in:
                    qb.whereIn(prop, trimArray(propValue));
                    break;

                case operators.nin:
                    qb.whereNotIn(prop, trimArray(propValue));
                    break;

                case operators.like:
                    addWhere(prop, 'LIKE', propValue);
                    break;

                case operators.null:
                    if(propValue === 'true' || propValue === true) {
                        qb.whereNull(prop);
                    }
                    else {
                        qb.whereNotNull(prop);
                    }
                    break;
            }
        }
    }
}


module.exports = {
    buildFilters
};
