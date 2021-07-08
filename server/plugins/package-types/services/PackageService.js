const isObject = require('lodash.isobject');


function doesItFit(product, box) {
    const result = {
        fitItems: 0,
        boxVolume: box.volume_cm,
        itemVolume: product.packing_volume_cm,
        remainingBoxVolume: box.volume_cm
    }

    let fits = false;

    if(box.volume_cm >= product.packing_volume_cm) {
        fits = product.packing_length_cm <= box.length_cm
            && product.packing_width_cm <= box.width_cm
            && product.packing_height_cm <= box.height_cm;

        if(!fits) {
            // turn the item 90 degrees to see if that could make it fit
            fits = product.packing_length_cm <= box.width_cm
                && product.packing_width_cm <= box.length_cm
                && product.packing_height_cm <= box.height_cm;
        }

        if(!fits) {
            // stand the product up
            fits = product.packing_length_cm <= box.height_cm // standing up
                && product.packing_height_cm <= box.length_cm
                && product.packing_width_cm <= box.width_cm;
        }

        if(!fits) {
            // rotate the standing product 90 degrees
            fits = product.packing_length_cm <= box.height_cm // standing up
                && product.packing_height_cm <= box.width_cm
                && product.packing_width_cm <= box.length_cm;
        }
    }

    if(!fits) {
        return result;
    }

    // Figuring out how many of these items can fit inside the box:
    // https://www.youtube.com/watch?v=WeY3Gd99Bkk
    const lengthCapacity = box.length_cm / product.packing_length_cm;
    const widthCapacity = box.width_cm / product.packing_width_cm;
    const heightCapacity = box.height_cm / product.packing_height_cm;

    result.fitItems = lengthCapacity * widthCapacity * heightCapacity;
    result.remainingBoxVolume = result.fitItems === 0 ? box.volume_cm : box.volume_cm - product.packing_volume_cm;

    return result;
}


/**
 * The smallest box is the one that passes doesItFit() and also has the smallest volume
 *
 * @param {*} product
 * @param {*} allBoxes
 */
function pickSmallestBoxForProduct(product, allBoxes) {
    let smallestBox = {
        volume: null,
        box: null
    };

    allBoxes.forEach((box) => {
        const result = doesItFit(product, box);

        // if the package fits in the box...
        if(result.fitItems !== 0) {
            if(!smallestBox.box || result.boxVolume < smallestBox.volume) {
                smallestBox.volume = result.boxVolume;
                smallestBox.box = box;
            }
        }
    });

    return smallestBox.box;
}


/**
 * Returns a list of boxes in ascending order (best fit -> worst fit)
 * that fit the given product
 *
 * @param {*} product
 * @param {*} boxes
 * @returns Array
 */
function getAllBoxesThatFitProduct(product, boxes) {
    const fits = {};

    boxes.forEach((box) => {
        const result = doesItFit(product, box);

        // if the package fits in the box...
        //
        // fitItems indicates the accuracy of the fit.
        // fitItems = 1 is a perfect fit.
        // fitItems = 1.3333 is a pretty good fit
        // fitItems = 2 means two of these products could have fit, etc
        // Indexing by fitItems allows me to sort the results by best fit
        if(result.fitItems !== 0) {
            fits[result.fitItems] = box;

            // Note: if there are results with the same fitItems value,
            // then the last one wins.   I guess that's OK?
        }
    });

    const ordered = Object.keys(fits)
        .map(key => parseFloat(key)) // convert each key into a float so it can be sorted
        .sort()
        .map((key) => fits[key + '']);

    return ordered;
}


function sortProductsByVolume(products, ascending) {
    const productsCopy = [...products];

    // https://www.javascripttutorial.net/array/javascript-sort-an-array-of-objects/
    productsCopy.sort((a, b) => {
        const aVol = parseInt(a.packing_volume_cm || 0);
        const bVol = parseInt(b.packing_volume_cm || 0);

        if(ascending) {
            return aVol - bVol;
        }
        return bVol - aVol;
    });

    return productsCopy;
}


/**
 * Tries to add as many products as possible to a box
 * @param {*} products
 * @param {*} box
 */
function addProductsToBox(products, box) {
    const results = {
        packed: [],
        unpacked: [],
        remainingVolume: box.volume_cm
    }

    products.forEach((product, idx) => {
        const fits = doesItFit(product, box);

        // A product is considered to fit in a box if the product dimensions fit,
        // and if there is enough remaining volume in the box to accommodate it
        if(fits.fitItems !== 0 && results.remainingVolume >= product.packing_volume_cm) {
            // results.packed.push(idx);
            results.packed.push(product);
            results.remainingVolume -= product.packing_volume_cm;
        }
        else {
            results.unpacked.push(product)
            // results.unpacked.push(idx)
        }
    });

    return results;
}


function productsWithoutSuitableBox(products, boxes) {
    const noMatchIndexes = [];

    products.forEach((prod, index) => {
        const matches = getAllBoxesThatFitProduct(prod, boxes);
        if(!matches.length) {
            noMatchIndexes.push(index)
        }
    });

    return noMatchIndexes;
}


/**
 * Attempts to add as many products to a single box as possible.
 * Returns all boxes that products were added to, and products that were
 * unable to be packed
 *
 * @param {*} products
 * @param {*} boxes
 * @param {*} maxRecursionCounter The maximum number of times recursion can happen
 * @param {*} collector
 * @returns
 */
function packProcessor(products, boxes, maxRecursionCounter, collector) {
    if(!isObject(collector)) {
        collector = { packed: [], unpacked: [] }
    }

    if(!maxRecursionCounter) {
        return collector;
    }

    // sort the products by volume, largest first
    // (sorting a copy of the products array because we are modifying it)
    const sortedProducts = sortProductsByVolume(
        [...products]
    );

    // See which box holds the most products:
    // For each box, try to pack as many products into it.
    const boxPackingTestResults = [];
    boxes.forEach((box, index) => {
        boxPackingTestResults.push(
            addProductsToBox(sortedProducts, box)
        );
    });

    // console.log("boxPackingTestResults", boxPackingTestResults)

    // Now that all boxes have been packed,
    // lets find the one box with the most packed products and the least remaining volume
    let bestPackedBox = null;
    boxPackingTestResults.forEach((packedBox, idx) => {
        if(!bestPackedBox ||
            (packedBox.packed.length > bestPackedBox.packed.length && packedBox.remainingVolume <= bestPackedBox.remainingVolume)) {

            bestPackedBox = {
                ...packedBox,
                box: boxes[idx]
            };
        }
    });

    // console.log("SELETED bestPackedBox", bestPackedBox);

    if(bestPackedBox) {
        collector.packed.push({
            box: bestPackedBox.box,
            products: bestPackedBox.packed,
            remainingVolume: bestPackedBox.remainingVolume
        });

        if(bestPackedBox.unpacked.length) {
            collector.unpacked = collector.unpacked.concat(bestPackedBox.unpacked);

            // re-run the processing, using the products that are still unpacked as the input
            return packProcessor(
                collector.unpacked,
                boxes,
                --maxRecursionCounter,
                {
                    packed: collector.packed,
                    unpacked: []
                }
            )
        }
    }

    return collector;
}


function packProducts(products, allBoxes) {
    const knownUnpacked = [];

    // Making a copy so we don't destroy the products array
    const productsCopy = [...products];

    // First lets remove any products from productsCopy that dont have any suitable boxes at all
    productsWithoutSuitableBox(productsCopy, allBoxes).forEach((idx) => {
        knownUnpacked.push(
            productsCopy.splice(idx, 1) // splice returns the removed item
        );
    });

    // TODO: addProductsToBox() should be updated to pack products into single boxes that have 'ship_alone' = true

    // Now productsCopy holds products that all have suitable boxes...
    // so we can recurse and all products should eventually end up in a box
    const results = packProcessor(
        productsCopy,
        allBoxes,
        productsCopy.length
    );

    results.unpacked = results.unpacked.concat(knownUnpacked);

    results.packed.forEach((obj, idx) => {
        console.log(`PACKED ${idx}`, obj)
    });
    results.unpacked.forEach((obj, idx) => {
        console.log(`UNPACKED ${idx}`, obj)
    });
}


module.exports.doesItFit = doesItFit;
module.exports.pickSmallestBoxForProduct = pickSmallestBoxForProduct;
module.exports.getAllBoxesThatFitProduct = getAllBoxesThatFitProduct;
module.exports.sortProductsByVolume = sortProductsByVolume;
module.exports.addProductsToBox = addProductsToBox;
module.exports.productsWithoutSuitableBox = productsWithoutSuitableBox;
module.exports.packProducts = packProducts;
