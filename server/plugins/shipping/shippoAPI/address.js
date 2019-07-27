'use strict';

const { postCreate } = require('./helpers');
const basePath = '/addresses';


/**
 * Validates a new address
 * API REFERENCE:  https://goshippo.com/docs/reference/bash#addresses-create
 *
 * @param {*} config
 */
function validateNewAddress(config) {
    config.validate = true;
    return postCreate(basePath, config)
}


module.exports = {
    validateNewAddress
}
