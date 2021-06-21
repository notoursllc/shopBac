const path = require('path');
const pug = require('pug');
const isObject = require('lodash.isobject');
const accounting = require('accounting');
const helpers = require('../../../helpers.service');

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY
});


function send(config) {
    return new Promise((resolve, reject) => {

        global.logger.debug('REQUEST: MailgunService -> send()', {
            meta: config
        });

        mg.messages.create(
            process.env.MAILGUN_DOMAIN,
            {
                from: `${process.env.DOMAIN_NAME} <${process.env.EMAIL_INFO}>`,
                to: config.to,
                subject: config.subject,
                text:config.text,
                html: config.html
            })
            .then((msg) => {
                console.log(msg)

                global.logger.debug('RESPONSE: MailgunService -> send()', {
                    meta: msg
                });
            })
            .catch((err) => {
                console.log(err)
            });
    });
}


/**
 * Creates a substring but does not break up words
 *
 * @param str The string to trim
 * @param maxLen The maximum length to trim the string to
 * @param suffix The suffix to append to the end of the string if it is trimmed.  Pass null to append nothing.
 */
function substringOnWords(str, maxLen, suffix) {
    let cleanStr = str.trim();
    let end = (suffix === undefined ? '...' : '');
    let max = parseInt(maxLen, 10) || 25;
    let arr = cleanStr.length ? cleanStr.split(' ') : [];
    let words = [];
    let finalCount = 0;
    let forEachDone = false;

    arr.forEach((part, index) => {
        if(!forEachDone) {
            let pl = part.length;
            let lengthIncludingSpaces = index > 0 ? pl + 1 : pl;

            if(finalCount + lengthIncludingSpaces <= max) {
                words.push(part);
                finalCount += lengthIncludingSpaces;
            }
            else {
                forEachDone = true;
            }
        }
    });

    // If there is nothing in 'words' then the original string 'cleanStr'
    // had no spaces in it, so we'll just return the truncated 'cleanStr'
    if(!words.length) {
        return cleanStr.length > max ? cleanStr.substring(0, max) + end : cleanStr;
    }

    let done = words.join(' ');
    return (cleanStr.length > done.length ? done + end : done);
}


function getShippingName(Cart) {
     const firstName = Cart.get('shipping_firstName');
    const lastName = Cart.get('shipping_lastName');
    let val = [];

    if(firstName) {
        val.push(firstName);
    }

    if(lastName) {
        val.push(lastName);
    }

    return val.join(' ');
}


function getPurchaseDescription(Cart) {
    let cart = Cart.toJSON();
    let totalNumItems = cart.num_items;
    let cart_items = cart.cart_items;
    let firstItem = null;
    let remainingItems = 0;

    if(Array.isArray(cart_items)) {
        if(isObject(cart_items[0]) && isObject(cart_items[0].product) && cart_items[0].product.hasOwnProperty('title')) {
            firstItem = substringOnWords(cart_items[0].product.title);
            remainingItems = totalNumItems - 1;

            if(!remainingItems) {
                return `"${firstItem}"`;
            }
        }

        let itemText = remainingItems === 1 ? 'item' : 'items';
        return `"${firstItem}" and ${remainingItems} more ${itemText}`;
    }

    return null;
}


function formatPrice(price) {
    return price ? accounting.toFixed(price/100, 2) : price;
}


function emailPurchaseReceiptToBuyer(Cart, Tenant, orderTitle) {
    const pugConfig = {
        orderTitle,
        baseUrl: helpers.getSiteUrl(true),
        tenantLogo: Tenant.get('application_logo'),
        id: Cart.get('id'),
        shipping: {
            name: getShippingName(Cart),
            address: Cart.get('shipping_streetAddress')
        },
        sub_total: formatPrice(Cart.get('sub_total')),
        shipping_total: formatPrice(Cart.get('shipping_total')),
        sales_tax: formatPrice(Cart.get('sales_tax')),
        grand_total: formatPrice(Cart.get('grand_total'))
    };

    global.logger.debug('REQUEST: MailgunService -> emailPurchaseReceiptToBuyer()', {
        meta: {
            pugConfig
        }
    });

    let html = pug.renderFile(
        path.join(__dirname, '../email-templates', 'purchase-receipt.pug'),
        pugConfig
    );

    return send({
        to: Cart.get('shipping_email'),
        subject: `Your order from goBreadVan.com - ${orderTitle}`,
        // text: 'sample text for purchase receipt', //TODO:
        html: html
    });
}


function emailPurchaseAlertToAdmin(Cart, orderTitle) {
    try {
        const pugConfig = {
            orderTitle,
            baseUrl: helpers.getSiteUrl(true),
            id: Cart.get('id'),
            shipping_firstName: Cart.get('shipping_firstName'),
            shipping_lastName: Cart.get('shipping_lastName'),
            shipping_streetAddress: Cart.get('shipping_streetAddress'),
            shipping_extendedAddress: Cart.get('shipping_extendedAddress'),
            shipping_company: Cart.get('shipping_company'),
            shipping_city: Cart.get('shipping_city'),
            shipping_state: Cart.get('shipping_state'),
            shipping_postalCode: Cart.get('shipping_postalCode'),
            shipping_countryCodeAlpha2: Cart.get('shipping_countryCodeAlpha2'),
            shipping_email: Cart.get('shipping_email'),
            sub_total: formatPrice(Cart.get('sub_total')),
            shipping_total: formatPrice(Cart.get('shipping_total')),
            sales_tax: formatPrice(Cart.get('sales_tax')),
            grand_total: formatPrice(Cart.get('grand_total'))
        }

        global.logger.debug('REQUEST: MailgunService -> emailPurchaseAlertToAdmin()', {
            meta: {
                pugConfig
            }
        });

        let html = pug.renderFile(
            path.join(__dirname, '../email-templates', 'admin-purchase-alert.pug'),
            pugConfig
        );

        return send({
            to: process.env.EMAIL_ADMIN,
            subject: `NEW ORDER: ${orderTitle}`,
            html: html
        });
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
    }
}


function sendPurchaseEmails(Cart, Tenant) {
    let orderTitle = getPurchaseDescription(Cart);

    Promise
        .all([
            emailPurchaseReceiptToBuyer(Cart, Tenant, orderTitle),
            emailPurchaseAlertToAdmin(Cart, orderTitle)
        ])
        .catch((err) => {
            global.logger.error(err);
            global.bugsnag(err);
        });
}



module.exports = {
    sendPurchaseEmails
}
