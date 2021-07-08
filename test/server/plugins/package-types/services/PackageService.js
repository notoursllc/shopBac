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
            // product
            {
                packing_length_cm: 3,
                packing_width_cm: 2,
                packing_height_cm: 1,
                packing_volume_cm: 7
            },

            // box
            { length_cm: 4, width_cm: 3, height_cm: 2, volume_cm: 24 }
        );
        expect(result.fitItems, 'fitItems').to.be.greaterThan(0);
    });

    it('should return zero fits when a product length is > the container length', async () => {
        let result = PackageService.doesItFit(
            // product
            {
                packing_length_cm: 5, // <--- GT
                packing_width_cm: 2,
                packing_height_cm: 1,
                packing_volume_cm: 10
            },

            // box
            { length_cm: 4, width_cm: 2, height_cm: 1, volume_cm: 8 }
        );
        expect(result.fitItems, 'fitItems').to.equal(0);
    });

    it('should return zero fits when a product width is > the container width', async () => {
        let result = PackageService.doesItFit(
            // product
            {
                packing_length_cm: 3,
                packing_width_cm: 5, // <--- GT
                packing_height_cm: 1,
                packing_volume_cm: 15
            },

            // box
            { length_cm: 4, width_cm: 3, height_cm: 2, volume_cm: 24 }
        );
        expect(result.fitItems, 'fitItems').to.equal(0);
    });

    it('should return zero fits when a product height is > the container height', async () => {
        let result = PackageService.doesItFit(
            // product
            {
                packing_length_cm: 3,
                packing_width_cm: 2,
                packing_height_cm: 3, // <--- GT
                packing_volume_cm: 18
            },

            // box
            { length_cm: 4, width_cm: 3, height_cm: 2, volume_cm: 24 }
        );
        expect(result.fitItems, 'fitItems').to.equal(0);
    });

});


describe('PackageService.pickSmallestBoxForProduct()', () => {

    it('should return the perfect match box in the list of boxes', async () => {
        let result = PackageService.pickSmallestBoxForProduct(
            // product
            { packing_length_cm: 1, packing_width_cm: 3, packing_height_cm: 1, packing_volume_cm: 3 },

            // boxes
            [
                { length_cm: 1, width_cm: 3, height_cm: 1, volume_cm: 3 }, // <--- should be this one
                { length_cm: 1, width_cm: 4, height_cm: 1, volume_cm: 4 }, // fits, but too wide
                { length_cm: 1, width_cm: 3, height_cm: 2, volume_cm: 6 }, // fits, too tall
                { length_cm: 1, width_cm: 2, height_cm: 1, volume_cm: 2 }, // doesn't fit at all
            ]

        );
        expect(result.length_cm, 'length_cm').to.equal(1);
        expect(result.width_cm, 'width_cm').to.equal(3);
        expect(result.height_cm, 'height_cm').to.equal(1);
    });


    it('should return the smallest avail box when a perfect match is not available', async () => {
        let result = PackageService.pickSmallestBoxForProduct(
            // product
            { packing_length_cm: 1, packing_width_cm: 3, packing_height_cm: 1, packing_volume_cm: 3 },

            // boxes
            [
                { length_cm: 1, width_cm: 4, height_cm: 1, volume_cm: 4 }, // <--- fits (too wide), but has the smallest volume (4)
                { length_cm: 1, width_cm: 3, height_cm: 2, volume_cm: 6 }, // fits (too tall) but volume is greater than above (6)
                { length_cm: 1, width_cm: 2, height_cm: 1, volume_cm: 2 }, // doesn't fit at all
            ]

        );
        expect(result.length_cm, 'length_cm').to.equal(1);
        expect(result.width_cm, 'width_cm').to.equal(4);
        expect(result.height_cm, 'height_cm').to.equal(1);
    });


    it('should return null when the product does not fit into any of the boxes', async () => {
        let result = PackageService.pickSmallestBoxForProduct(
            // product
            { packing_length_cm: 2, packing_width_cm: 3, packing_height_cm: 1, packing_volume_cm: 6 },

            // boxes
            [
                { length_cm: 2, width_cm: 2, height_cm: 1, volume_cm: 4 },
                { length_cm: 2, width_cm: 1, height_cm: 2, volume_cm: 4 },
                { length_cm: 1, width_cm: 1, height_cm: 1, volume_cm: 1 }
            ]

        );
        expect(result).to.equal(null);
    });

});


describe('PackageService.getAllBoxesThatFitProduct()', () => {

    it('should return all boxes that fit a product', async () => {
        let result = PackageService.getAllBoxesThatFitProduct(
            // product
            { packing_length_cm: 2, packing_width_cm: 3, packing_height_cm: 1, packing_volume_cm: 6 },

            // boxes
            [
                { length_cm: 2, width_cm: 3, height_cm: 1, volume_cm: 6 }, // exact fit
                { length_cm: 2, width_cm: 4, height_cm: 1, volume_cm: 8 }, // fits but wider
                { length_cm: 2, width_cm: 3, height_cm: 2, volume_cm: 12 }, // fits but taller
                { length_cm: 3, width_cm: 3, height_cm: 1, volume_cm: 9 }, // fits but longer
                { length_cm: 2, width_cm: 1, height_cm: 2, volume_cm: 4 }, // doesn't fit
                { length_cm: 1, width_cm: 1, height_cm: 1, volume_cm: 1 } // doesn't fit
            ]
        );

        console.log("ALL BOXEX THAT FIT", result)

        expect(result.length).to.equal(4);
        expect(result[0].length_cm).to.equal(2);
        expect(result[0].width_cm).to.equal(3);
        expect(result[0].height_cm).to.equal(1);
    });


    it('should return an empth array if no boxes fit a product', async () => {
        let result = PackageService.getAllBoxesThatFitProduct(
            // product
            { packing_length_cm: 2, packing_width_cm: 3, packing_height_cm: 1, packing_volume_cm: 6 },

            // boxes
            [
                { length_cm: 2, width_cm: 1, height_cm: 2, volume_cm: 4 }, // doesn't fit
                { length_cm: 1, width_cm: 1, height_cm: 1, volume_cm: 1 } // doesn't fit
            ]
        );

        expect(result.length).to.equal(0);
    });


    it('the first result should be the best fitting box when an exact match box is not available', async () => {
        let result = PackageService.getAllBoxesThatFitProduct(
            // product
            { packing_length_cm: 2, packing_width_cm: 3, packing_height_cm: 1, packing_volume_cm: 6 }, // volume: 6

            // boxes
            [
                { length_cm: 2, width_cm: 3, height_cm: 2, volume_cm: 12 }, // fits but taller
                { length_cm: 3, width_cm: 3, height_cm: 1, volume_cm: 9 }, // fits but longer
                { length_cm: 2, width_cm: 4, height_cm: 1, volume_cm: 8 }, // fits but wider <--- closest match
                { length_cm: 2, width_cm: 1, height_cm: 2, volume_cm: 4 }, // doesn't fit
                { length_cm: 1, width_cm: 1, height_cm: 1, volume_cm: 1 } // doesn't fit
            ]
        );

        expect(result[0].length_cm).to.equal(2);
        expect(result[0].width_cm).to.equal(4);
        expect(result[0].height_cm).to.equal(1);
    });
});


describe('PackageService.sortProductsByVolume()', () => {
    const mixedProds = [
        { packing_length_cm: 1, packing_width_cm: 1, packing_height_cm: 1, packing_volume_cm: 1 },
        { packing_length_cm: 4, packing_width_cm: 4, packing_height_cm: 4, packing_volume_cm: 52 },
        { packing_length_cm: 2, packing_width_cm: 2, packing_height_cm: 2, packing_volume_cm: 8 },
        { packing_length_cm: 4, packing_width_cm: 1, packing_height_cm: 2, packing_volume_cm: 8 },
        { packing_length_cm: 3, packing_width_cm: 3, packing_height_cm: 3, packing_volume_cm: 18 }
    ];

    it('should sort in ascending order', async () => {
        let result = PackageService.sortProductsByVolume(mixedProds, true);

        expect(result[0].packing_volume_cm).to.equal(1);
        expect(result[1].packing_volume_cm).to.equal(8);
        expect(result[2].packing_volume_cm).to.equal(8);
        expect(result[3].packing_volume_cm).to.equal(18);
        expect(result[4].packing_volume_cm).to.equal(52);
    });

    it('should sort in descending order', async () => {
        let result = PackageService.sortProductsByVolume(mixedProds, false);

        expect(result[0].packing_volume_cm).to.equal(52);
        expect(result[1].packing_volume_cm).to.equal(18);
        expect(result[2].packing_volume_cm).to.equal(8);
        expect(result[3].packing_volume_cm).to.equal(8);
        expect(result[4].packing_volume_cm).to.equal(1);
    });
});


describe('PackageService.addProductsToBox()', () => {
    it('should add one product to the box with no remaining volume', async () => {
        let result = PackageService.addProductsToBox(
            // products
            [
                { packing_length_cm: 1, packing_width_cm: 1, packing_height_cm: 1, packing_volume_cm: 1 },
            ],

            // box
            { length_cm: 1, width_cm: 1, height_cm: 1, volume_cm: 1 }
        );

        expect(result.packed.length).to.equal(1);
        expect(result.unpacked.length).to.equal(0);
        expect(result.remainingVolume).to.equal(0);
    });

    it('should not add any products to the box because the products dont fit', async () => {
        let result = PackageService.addProductsToBox(
            // products
            [
                { packing_length_cm: 2, packing_width_cm: 1, packing_height_cm: 1, packing_volume_cm: 2 },
            ],

            // box
            { length_cm: 1, width_cm: 1, height_cm: 1, volume_cm: 1 }
        );

        expect(result.packed.length).to.equal(0);
        expect(result.unpacked.length).to.equal(1);
        expect(result.remainingVolume).to.equal(1);
    });

    it('should add one product to the box with one unpacked product', async () => {
        let result = PackageService.addProductsToBox(
            // products
            [
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 1, packing_volume_cm: 6 },
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 2, packing_volume_cm: 12 },
            ],

            // box
            { length_cm: 3, width_cm: 2, height_cm: 2, volume_cm: 12 }
        );

        expect(result.packed.length).to.equal(1);
        expect(result.packed[0].packing_length_cm).to.equal(3);
        expect(result.packed[0].packing_width_cm).to.equal(2);
        expect(result.packed[0].packing_height_cm).to.equal(1);

        expect(result.unpacked.length).to.equal(1);
        expect(result.unpacked[0].packing_length_cm).to.equal(3);
        expect(result.unpacked[0].packing_width_cm).to.equal(2);
        expect(result.unpacked[0].packing_height_cm).to.equal(2);

        expect(result.remainingVolume).to.equal(6);
    });

    it('should add two products to the box with no unpacked products', async () => {
        let result = PackageService.addProductsToBox(
            // products
            [
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 1, packing_volume_cm: 6 },
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 2, packing_volume_cm: 12 },
            ],

            // box
            { length_cm: 3, width_cm: 2, height_cm: 4, volume_cm: 24 }
        );

        expect(result.packed.length).to.equal(2);
        expect(result.unpacked.length).to.equal(0);
        expect(result.remainingVolume).to.equal(6);
    });

    it('should add two products to the box with one unpacked product because of no remaining volume', async () => {
        let result = PackageService.addProductsToBox(
            // products
            [
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 1, packing_volume_cm: 6 },
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 2, packing_volume_cm: 12 },
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 2, packing_volume_cm: 12 },
            ],

            // box
            { length_cm: 3, width_cm: 2, height_cm: 4, volume_cm: 24 }
        );

        // console.log("addProductsToBox", result)
        expect(result.packed.length).to.equal(2);
        expect(result.unpacked.length).to.equal(1);
        expect(result.remainingVolume).to.equal(6);
    });

    it(`should add one product to each box even though both products fit in a single box
        because one product has "ship_alone" = true`, async () => {
        let result = PackageService.addProductsToBox(
            // products
            [
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 1, packing_volume_cm: 6 },
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 2, packing_volume_cm: 12, ship_alone: true }
            ],

            // box
            { length_cm: 3, width_cm: 2, height_cm: 4, volume_cm: 24 }
        );

        console.log("addProductsToBox", result)

        expect(result.packed.length).to.equal(2);
        expect(result.unpacked.length).to.equal(1);
        expect(result.remainingVolume).to.equal(6);
    });
});


describe('PackageService.productsWithoutSuitableBox()', () => {
    const prods = [
        { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 1, packing_volume_cm: 6 },
        { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 2, packing_volume_cm: 12 },
        { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 2, packing_volume_cm: 12 },
    ];

    it('should return an empty array when all products have a suitable box ', async () => {
        let result = PackageService.productsWithoutSuitableBox(
            prods,
            [
                { length_cm: 3, width_cm: 2, height_cm: 3, volume_cm: 18 }
            ]
        );

        // console.log("productsWithoutSuitableBox", result)
        expect(result.length).to.equal(0);
    });

    it('should return an an array with 3 indexes when no products have a suitable box', async () => {
        let result = PackageService.productsWithoutSuitableBox(
            prods,
            [
                { length_cm: 1, width_cm: 2, height_cm: 1, volume_cm: 2 }
            ]
        );

        expect(result.length).to.equal(prods.length);
    });

    it('should return an an array with 1 index', async () => {
        let result = PackageService.productsWithoutSuitableBox(
            prods,
            [
                { length_cm: 3, width_cm: 2, height_cm: 1, volume_cm: 6 }
            ]
        );

        expect(result[0]).to.equal(1);
        expect(result[1]).to.equal(2);
    });
});


describe('PackageService.packProducts()', () => {
    it('should PACK', async () => {
        let result = PackageService.packProducts(
            // products
            [
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 1, packing_volume_cm: 6 },
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 2, packing_volume_cm: 12 },
                { packing_length_cm: 3, packing_width_cm: 2, packing_height_cm: 2, packing_volume_cm: 12 },
            ],

            // boxes
            [
                { length_cm: 3, width_cm: 2, height_cm: 4, volume_cm: 24 },
                // { length_cm: 3, width_cm: 2, height_cm: 5, volume_cm: 30 },
                // { length_cm: 3, width_cm: 2, height_cm: 6, volume_cm: 36 }
            ]
        );
    });
});


