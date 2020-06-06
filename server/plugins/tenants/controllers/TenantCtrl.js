const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const owasp = require('owasp-password-strength-test');
const isObject = require('lodash.isobject');
const BaseController = require('../../core/BaseController');
const { cryptPassword } = require('../../../helpers.service');


owasp.config({
    allowPassphrases: true,
    maxLength: 128,
    minLength: 8,
    minPhraseLength: 20,
    minOptionalTestsToPass: 4
});


class TenantCtrl extends BaseController {

    constructor(server) {
        super(server, 'Tenant');
        this.validTenantCache = [];
    }


    getAuthSchema() {
        return {
            id: Joi.string().max(100).required(),
            password: Joi.string().max(100).required()
        };
    }

    getRefreshSchema() {
        return {
            id: Joi.string().max(100).required(),
            // refresh_token: Joi.string().required()
        };
    }

    getCreateSchema() {
        return {
            email: Joi.string().max(100).required(),
            password: Joi.string().max(100).required(),
            application_name: Joi.string().max(100),
            application_url: Joi.string().max(100)
        };
    }

    getSchema() {
        return {
            id: Joi.string().max(100).required(),
            password: Joi.string().max(100).required(),
            active: Joi.boolean().default(true),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }

    // TODO: needs more work
    getAllHandler(request, h) {
        return this.fetchAllHandler(h, (qb) => {
            // qb.where('tenant_id', '=', this.getTenantId(request));
        });
    }


    getByIdHandler(request, h) {
        return this.modelForgeFetchHandler(
            { id: request.query.id },
            null,
            h
        );
    }


    getByEmail(email) {
        return this.modelForgeFetch(
            { email },
            null
        );
    }


    /**
     * This method is called by the client when he wants to receive a new JWT
     *
     * @param {*} request
     * @param {*} h
     */
    async authHandler(request, h) {
        let Tenant;
        const refreshTokenFromCookie = Array.isArray(request.state.bvrt) ? request.state.bvrt[request.state.bvrt.length - 1] : request.state.bvrt;

        try {
            Tenant = await this.modelForgeFetch(
                { id: request.payload.id },
                null
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }

        let isMatch = false;

        if(Tenant) {
            if(request.payload.hasOwnProperty('password')) {
                isMatch = bcrypt.compareSync(request.payload.password, Tenant.get('password'));
            }
            else {
                // get the refresh token from cookie (request.state)
                isMatch = bcrypt.compareSync(refreshTokenFromCookie, Tenant.get('refresh_token'));
            }
        }

        if(!Tenant || !isMatch) {
            throw Boom.unauthorized();
        }

        try {
            const authToken = this.createToken(Tenant);
            const refreshToken = uuid();

            // return the refresh token in a httpOnly cookie
            h.state(
                'bvrt',
                refreshToken,
                {
                    ttl: null,
                    isSecure: process.env.NODE_ENV === 'production',
                    isHttpOnly: true,
                    clearInvalid: true,
                    strictHeader: false,
                    path: '/'
                }
            );

            await this.upsertModel({
                id: Tenant.get('id'),
                refresh_token: cryptPassword(refreshToken) // hashing the refresh token for better security
            });

            return h.apiSuccess({
                authToken,
                refreshToken
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async createHandler(request, h) {
        const Tenant = await this.getByEmail(request.payload.email);

        // console.log("TENANT", Tenant);
        if(Tenant) {
            throw Boom.badData('A user with this email address already exists');
        }

        const passwordValidation = owasp.test(request.payload.password);
        console.log('PWD VALIDATION', request.payload.password, passwordValidation);

        // TODO: throw error if errors

        // request.payload.api_key = crypto.randomBytes(32).toString('hex');
        request.payload.password = cryptPassword(request.payload.password);
        return super.upsertHandler(request, h);
    }


    upsertHandler(request, h) {
        // todo: check if email already exists if creating new tenant

        const passwordValidation = owasp.test(request.payload.password);

        // console.log('PWD VALIDATION', request.payload.password, passwordValidation);

        // request.payload.api_key = crypto.randomBytes(32).toString('hex');
        request.payload.password = cryptPassword(request.payload.password);
        return super.upsertHandler(request, h);
    }


    /**
     * Sign the JWT
     */
    createToken(Tenant) {
        // For now I think all I need is the tenant id in the token
        return jwt.sign(
            {
                id: Tenant.get('id')
            },
            process.env.JWT_TOKEN_SECRET,
            {
                algorithm: 'HS256',
                expiresIn: process.env.JWT_TOKEN_EXPIRES_IN_SECONDS ? parseInt(process.env.JWT_TOKEN_EXPIRES_IN_SECONDS, 10) : 120 // expressed in seconds or a string describing a time span (https://www.npmjs.com/package/jsonwebtoken)
            }
        );
    }


    async validateJwtKey(decoded, request) {
        // if (request.plugins['hapi-auth-jwt2']) {
        //     decoded.extraInfo = request.plugins['hapi-auth-jwt2'].extraInfo;
        // }

        console.log(" - - - - - - - decoded token:");
        console.log(decoded);
        console.log(" - - - - - - - request info:");
        console.log(request.info);
        console.log(" - - - - - - - user agent:");
        console.log(request.headers['user-agent']);

        let isValid = false;

        if(!isObject(decoded) || !decoded.id) {
            return {
                isValid: false
            };
        }

        // try getting from cache first, so we don't have to call the DB every time
        if(this.validTenantCache[decoded.id] && this.validTenantCache[decoded.id] > new Date().getTime()) {
            isValid = true;
            console.log("validateJwtKey - IS VALID FROM CACHE", this.validTenantCache);
        }
        // else look up the tenant from the DB, and if active,
        // set as valid and update the cache
        else {
            try {
                const Tenant = await this.modelForgeFetch(
                    { id: decoded.id },
                    null
                );

                if(Tenant
                    && Tenant.get('id') === decoded.id
                    && Tenant.get('active')) {
                    isValid = true;
                    // this.validTenantCache[decoded.id] = new Date().getTime() + (60 * 10 * 1000); // now + 10 minutes
                    this.validTenantCache[decoded.id] = new Date().getTime() + (30 * 1000); // now + 30 seconds
                    console.log("validateJwtKey - IS VALID FROM DB - UPDATING CACHE", this.validTenantCache)
                }
            }
            catch(err) {
                global.logger.error(err);
            }
        }

        // isValid is the only required field needed in the resposne obejct
        // you can add other stuff too which will be available to the route handler for its own use (tenant ID?)
        return {
            isValid,
            decoded
        };
    };
}


module.exports = TenantCtrl;
