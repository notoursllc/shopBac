const path = require('path');
const pug = require('pug');
const isObject = require('lodash.isobject');
const accounting = require('accounting');
const helpers = require('../../../helpers.service');
const postmark = require("postmark");

const postmarkClient = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

function send(config) {
    try {
        return postmarkClient.sendEmail({
            From: process.env.EMAIL_INFO,
            To: config.to,
            Subject: config.subject,
            HtmlBody: config.html,
            TextBody: config.text,
            MessageStream: 'outbound'
        });
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw err;
    }
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


async function emailPurchaseReceiptToBuyer(Cart, Tenant, orderTitle) {
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

    global.logger.info('REQUEST: PostmarkService -> emailPurchaseReceiptToBuyer()', {
        meta: {
            pugConfig
        }
    });

    let html = pug.renderFile(
        path.join(__dirname, '../email-templates', 'purchase-receipt.pug'),
        pugConfig
    );

    const response = await send({
        to: Cart.get('shipping_email'),
        subject: `Your order from goBreadVan.com - ${orderTitle}`,
        // text: 'sample text for purchase receipt', //TODO:
        html: html
    });

    global.logger.info('RESPONSE: PostmarkService -> emailPurchaseReceiptToBuyer()', {
        meta: {
            response
        }
    });

    return response;
}


async function emailPurchaseAlertToAdmin(Cart, orderTitle) {
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

    global.logger.info('REQUEST: PostmarkService -> emailPurchaseAlertToAdmin()', {
        meta: {
            pugConfig
        }
    });

    let html = pug.renderFile(
        path.join(__dirname, '../email-templates', 'admin-purchase-alert.pug'),
        pugConfig
    );

    const response = await send({
        to: process.env.EMAIL_ADMIN,
        subject: `NEW ORDER: ${orderTitle}`,
        html: html
    });

    global.logger.info('RESPONSE: PostmarkService -> emailPurchaseAlertToAdmin()', {
        meta: {
            response
        }
    });

    return response;
}


async function emailContactUsFormToAdmin(pugConfig) {
    try {
        global.logger.info('REQUEST: PostmarkService -> emailContactUsFormToAdmin()', {
            meta: {
                pugConfig
            }
        });

        const html = pug.renderFile(
            path.join(__dirname, '../email-templates', 'contact-us.pug'),
            pugConfig
        );

        const response = await send({
            to: process.env.EMAIL_ADMIN,
            subject: `CONTACT US form submission (${process.env.BRAND_NAME})`,
            html: html
        });

        global.logger.info('RESPONSE: PostmarkService -> emailContactUsFormToAdmin()', {
            meta: {
                response
            }
        });

        return response;
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
    }
}




module.exports = {
    getPurchaseDescription,
    emailPurchaseReceiptToBuyer,
    emailPurchaseAlertToAdmin,
    emailContactUsFormToAdmin
}
