function getLocationId() {
    return process.env.NODE_ENV === 'development' ? process.env.SQUARE_SANDBOX_LOCATION_ID : process.env.SQUARE_PRODUCTION_LOCATION_ID;
}

function getAccessToken() {
    return process.env.NODE_ENV === 'development' ? process.env.SQUARE_SANDBOX_ACCESS_TOKEN : process.env.SQUARE_PRODUCTION_ACCESS_TOKEN;
}

module.exports = {
    getLocationId: getLocationId,
    getAccessToken: getAccessToken
}
