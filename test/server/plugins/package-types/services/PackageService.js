const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const PackageService = require('../../../../../server/plugins/package-types/services/PackageService');

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const expect = Code.expect;
const it = lab.test;


describe('PackageService.fitItems()', () => {

    it('should return a positive number of fits when all of a products length/width/height is less than the containers length/width/height', async () => {
        let result = PackageService.doesItFit(
            { length: 3, width: 2, height: 1 },
            { length: 4, width: 3, height: 2 }
        );
        expect(result.fitItems, 'fitItems').to.be.greaterThan(0);
    });

    it('should return zero fits when a product length is >= the container length', async () => {
        let result = PackageService.doesItFit(
            {
                length: 5, // <--- GT
                width: 2,
                height: 1
            },
            { length: 4, width: 3, height: 2 }
        );
        expect(result.fitItems, 'fitItems').to.equal(0);

        let result2 = PackageService.doesItFit(
            {
                length: 4, // <--- EQ
                width: 2,
                height: 1
            },
            { length: 4, width: 3, height: 2 }
        );
        expect(result2.fitItems, 'fitItems').to.equal(0);
    });

    it('should return zero fits when a product width is >= the container width', async () => {
        let result = PackageService.doesItFit(
            {
                length: 3,
                width: 4, // <--- GT
                height: 1
            },
            { length: 4, width: 3, height: 2 }
        );
        expect(result.fitItems, 'fitItems').to.equal(0);

        let result2 = PackageService.doesItFit(
            {
                length: 3,
                width: 3, // <--- EQ
                height: 1
            },
            { length: 4, width: 3, height: 2 }
        );
        expect(result2.fitItems, 'fitItems').to.equal(0);
    });

    it('should return zero fits when a product height is >= the container height', async () => {
        let result = PackageService.doesItFit(
            {
                length: 3,
                width: 2,
                height: 3 // <--- GT
            },
            { length: 4, width: 3, height: 2 }
        );
        expect(result.fitItems, 'fitItems').to.equal(0);

        let result2 = PackageService.doesItFit(
            {
                length: 3,
                width: 3,
                height: 2 // <--- EQ
            },
            { length: 4, width: 3, height: 2 }
        );
        expect(result2.fitItems, 'fitItems').to.equal(0);
    });

});
