'use strict';

const path = require('path');
const fs = require('fs');
const Boom = require('@hapi/boom');
const uuidV4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const robotstxt = require('generate-robotstxt');
const helperService = require('../../helpers.service');


let server = null;


function setServer(s) {
    server = s;
}


async function getClientJwtHandler(request, h) {
    try {
        const uuid = uuidV4();
        const cartToken = helperService.cryptPassword(process.env.CART_TOKEN_SECRET + uuid);

        if(!cartToken) {
            throw new Error('Error creating cart token');
        }

        const jsonWebToken = jwt.sign(
            {
                jti: uuid,
                clientId: process.env.JWT_CLIENT_ID, // is this needed?
                ct: cartToken
            },
            process.env.JWT_TOKEN_SECRET
        );

        const response = h.response('success');
        response.type('text/plain');
        response.header('Authorization', jsonWebToken);
        return response;
    }
    catch(err) {
        throw Boom.unauthorized(err);
    }
};


function loggerHandler(request, h) {
    switch(request.payload.type) {
        // Only supportig the 'error' and 'info' types for now
        case 'error':
            global.logger.error(
                new Error(request.payload.message)
            );
            break;

        default:
            global.logger.info(request.payload.message);
    }

    h.apiSuccess();
}


async function healthzHandler(request, h) {
    try {
        const result = await server.app.knex.raw('SELECT * FROM products WHERE id != ? LIMIT 1', ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'])

        if(!result) {
            throw new Error('Health check: Error getting product.');
        }

        const response = h.response('success');
        response.type('text/plain');
        return response;
    }
    catch(err) {
        throw Boom.badRequest(err);
    }
}


/**
 * Generates a robots.txt. file
 * https://moz.com/learn/seo/robotstxt
 * https://www.robotstxt.org/
 *
 * @param {*} request
 * @param {*} h
 */
async function robotsHandler(request, h) {
    try {
        const host = `http://www.${process.env.DOMAIN_NAME}`;
        const defaultDisallow = [
            '/acts/*',
            '/cart/*',
            '/order/*'
        ];

        const robotsText = await robotstxt({
            policy: [
                {
                    userAgent: '*',
                    allow: '/',
                    disallow: defaultDisallow,
                    crawlDelay: 2
                },
                {
                    userAgent: 'Nutch',
                    disallow: '/'
                }
            ],
            sitemap: `${host}/sitemap.xml`,
            host: host
        });

        return h.response(robotsText).type('text/plain');
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


function faviconHandler(request, h) {
    // TODO: not sure if this is right
    h.response(fs.createReadStream(path.resolve(__dirname, '../../../dist/static/favicon.ico'))).code(200).type('image/x-icon');
}


module.exports = {
    setServer,
    getClientJwtHandler,
    loggerHandler,
    healthzHandler,
    faviconHandler,
    robotsHandler
}
