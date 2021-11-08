const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const SqlOperatorBuilder = require('../../../../server/plugins/core/services/SqlOperatorBuilder');
const queryString = require('query-string');
const qs = require('qs');

describe('SqlOperatorBuilder.buildOperators()', () => {

    it('FIRST TEST', async () => {
        const params = qs.stringify({
            test1: '1',
            test2: {eq: '2'},
            test3: {ne: 3},
            test4: {lt: 4},
            test5: {gt: 5},
            test6: {lte: 6},
            test7: {gte: 7},
            test8: {in: [8,9,10]},
            test9: {nin: [11,12,13]},
            test10: {like: '%TEST10%'},
            test11: {null: true},
            test12: {null: false},
        });

        const mockData = {};

        // Kind of mocking the query builder that should be
        // passed into buildFilters()
        const qbMock = {
            where: (prop, operator, value) => {
                mockData.where = [prop, operator, value]
            },
            andWhere: (prop, operator, value) => {
                if(!mockData.hasOwnProperty('andWhere')) {
                    mockData.andWhere = [];
                }
                mockData.andWhere.push([prop, operator, value]);
            },
            whereIn: (prop, value) => {
                mockData.whereIn = [prop, value]
            },
            whereNotIn: (prop, value) => {
                mockData.whereNotIn = [prop, value]
            },
            whereNull: (prop) => {
                mockData.whereNull = prop
            },
            whereNotNull: (prop) => {
                mockData.whereNotNull = prop
            }
        }

        SqlOperatorBuilder.buildFilters(params, qbMock);
        console.log("mockData", mockData)

        expect(mockData).to.equal(
            {
                where: [ 'test1', '=', '1' ],
                andWhere: [
                  [ 'test2', '=', '2' ],
                  [ 'test3', '!=', '3' ],
                  [ 'test4', '<', '4' ],
                  [ 'test5', '>', '5' ],
                  [ 'test6', '<=', '6' ],
                  [ 'test7', '>=', '7' ],
                  [ 'test10', 'LIKE', '%TEST10%' ]
                ],
                whereIn: [ 'test8', [ '8', '9', '10' ] ],
                whereNotIn: [ 'test9', [ '11', '12', '13' ] ],
                whereNull: 'test11',
                whereNotNull: 'test12'
            }
        );
    });

});
