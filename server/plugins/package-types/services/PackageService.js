function doesItFit(product, container) {
    const itemVolume = product.length * product.width * product.height;
    const boxVolume = container.length * container.width * container.height;

    const result = {
        fitItems: 0,
        boxVolume: boxVolume,
        itemVolume: itemVolume,
        remainingBoxVolume: boxVolume
    }

    let fits = product.length < container.length
        && product.width < container.width
        && product.height < container.height;

    if(!fits) {
        // turn the item 90 degrees to see if that could make it fit
        fits = product.length < container.width
            && product.width < container.length
            && product.height < container.height;
    }

    if(!fits) {
        // stand the product up
        fits = product.length < container.height // standing up
            && product.height < container.length
            && product.width < container.width;
    }

    if(!fits) {
        // rotate the standing product 90 degrees
        fits = product.length < container.height // standing up
            && product.height < container.width
            && product.width < container.length;
    }

    if(!fits) {
        return result;
    }

    // Figuring out how many of these items can fit inside the container:
    // https://www.youtube.com/watch?v=WeY3Gd99Bkk
    const lengthCapacity = container.length / product.length;
    const widthCapacity = container.width / product.width;
    const heightCapacity = container.height / product.height;

    result.fitItems = lengthCapacity * widthCapacity * heightCapacity;
    result.remainingBoxVolume = result.fitItems === 0 ? boxVolume : boxVolume - itemVolume;

    return result;
}


module.exports.doesItFit = doesItFit;
