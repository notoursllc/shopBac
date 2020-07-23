const bcrypt = require('bcrypt');
const owasp = require('owasp-password-strength-test');

const domainName = 'goBreadVan.com';

owasp.config({
    allowPassphrases: true,
    maxLength: 128,
    minLength: 8,
    minPhraseLength: 20,
    minOptionalTestsToPass: 4
});


function getSiteUrl(full) {
    if(process.env.NODE_ENV === 'development') {
        return full ? 'http://localhost:3000' : 'localhost:3000';
    }
    else {
        return full ? `https://www.${domainName}` : `www.${domainName}`;
    }
}


function getBrandName() {
    return 'BreadVan';
}

function getDomainName() {
    return domainName;
}


function isDev() {
    return process.env.NODE_ENV === 'development';
}


function makeArray(val) {
    if(val === null || val === undefined) {
        return [];
    }
    return !Array.isArray(val) ? [val] : val;
}


// https://stackoverflow.com/questions/4187146/display-two-decimal-places-no-rounding#4187164
function twoPointDecimal(value) {
    return value.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];   // '4.27' => '4.27'
    //return (Math.floor(value * 100) / 100).toFixed(2)         // '4.27' => '4.26'  <== toFixed rounds values!
}


function stripTags(text) {
    if(text) {
        return text.replace(/(<([^>]+)>)/ig, '');
    }

    return text;
}

function stripQuotes(text) {
    if(text) {
        return text.replace(/["']/g, '');
    }

    return text;
}


/**
 * Creates a hash from a given password
 *
 * @param password
 * @returns {Promise}
 */
function cryptPassword(password) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
}


/**
 * Compares a password against the hashed password for a match
 *
 * @param password      Clear password
 * @param userPassword  Hashed password
 * @returns {Promise}
 */
function comparePassword(password, userPassword) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, userPassword, (err, isPasswordMatch) => {
            if (err) {
                return reject(err);
            }

            return resolve(isPasswordMatch);
        });
    });
}


function testPasswordStrength(pwd) {
    return owasp.test(pwd);
}


function isBoolean(val) {
    // NOTE: I read that typeof and string comparisons are slow
    // (typeof val === 'boolean')
    return val === true || val === false;
}


const multiAuthStrategies = ['jwt', 'session'];


module.exports.getSiteUrl = getSiteUrl;
module.exports.getBrandName = getBrandName;
module.exports.getDomainName = getDomainName;
module.exports.isDev = isDev;
module.exports.makeArray = makeArray;
module.exports.twoPointDecimal = twoPointDecimal;
module.exports.stripTags = stripTags;
module.exports.stripQuotes = stripQuotes;
module.exports.cryptPassword = cryptPassword;
module.exports.comparePassword = comparePassword;
module.exports.isBoolean = isBoolean;
module.exports.testPasswordStrength = testPasswordStrength;
