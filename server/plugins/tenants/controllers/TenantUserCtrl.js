const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const isObject = require('lodash.isobject');
const BaseController = require('../../core/BaseController');
const { cryptPassword, testPasswordStrength } = require('../../../helpers.service');


class TenantUserCtrl extends BaseController {

    constructor(server) {
        super(server, 'TenantUser');
        this.validTenantCache = [];
        this.TenantCtrl = new (require('./TenantCtrl'))(server);
    }


    getLoginSchema() {
        return {
            email: Joi.string().max(100).required(),
            password: Joi.string().max(100).required()
        };
    }


    getCreateSchema() {
        return {
            tenant_id: Joi.string().max(100).required(),
            email: Joi.string().max(100).required(),
            password: Joi.string().max(100).required(),
            active: Joi.boolean().default(true)
        };
    }

    // getSchema() {
    //     return {
    //         id: Joi.string().max(100).required(),
    //         password: Joi.string().max(100).required(),
    //         active: Joi.boolean().default(true),
    //         created_at: Joi.date(),
    //         updated_at: Joi.date()
    //     };
    // }


    getByIdHandler(request, h) {
        return this.modelForgeFetchHandler(
            { id: request.query.id },
            null,
            h
        );
    }


    /**
     * This method is called by the client when he wants to receive a new JWT
     *
     * @param {*} request
     * @param {*} h
     */
    async loginHandler(request, h) {
        const TenantUser = await this.modelForgeFetch(
            { email: request.payload.email }
        );

        if(!TenantUser) {
            throw Boom.unauthorized();
        }
        if(!bcrypt.compareSync(request.payload.password, TenantUser.get('password'))) {
            throw Boom.unauthorized();
        }

        try {
            // return the auth token in a httpOnly cookie
            // TODO: this cookie should be SameSite
            h.state(
                'bv_session_token',
                this.createToken(TenantUser),
                {
                    ttl: null,
                    isSecure: process.env.NODE_ENV === 'production',
                    isHttpOnly: false,
                    clearInvalid: true,
                    strictHeader: false,
                    path: '/'
                }
            );

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async createHandler(request, h) {
        const [ TenantUser, Tenant ] = await Promise.all([
            this.modelForgeFetch(
                { email: request.payload.email }
            ),
            this.TenantCtrl.modelForgeFetch(
                { id: request.payload.tenant_id }
            )
        ]);

        if(TenantUser) {
            throw Boom.badData('A TenantUser with the specified email address already exists');
        }
        if(!Tenant) {
            throw Boom.badData('A Tenant with the specified ID does not exist');
        }

        // TODO: throw error if errors
        // const passwordValidation = testPasswordStrength(request.payload.password);
        // console.log('PWD VALIDATION', request.payload.password, passwordValidation);

        request.payload.password = cryptPassword(request.payload.password);
        return super.upsertHandler(request, h);
    }


    // upsertHandler(request, h) {
    //     // todo: check if email already exists if creating new tenant

    //     const passwordValidation = owasp.test(request.payload.password);

    //     // console.log('PWD VALIDATION', request.payload.password, passwordValidation);

    //     // request.payload.api_key = crypto.randomBytes(32).toString('hex');
    //     request.payload.password = cryptPassword(request.payload.password);
    //     return super.upsertHandler(request, h);
    // }


    /**
     * Sign the JWT
     */
    createToken(User) {
        // For now I think all I need is the tenant id in the token
        return jwt.sign(
            {
                id: User.get('id')
            },
            process.env.ADMIN_JWT_TOKEN_SECRET,
            {
                algorithm: 'HS256',
                expiresIn: process.env.ADMIN_JWT_TOKEN_EXPIRES_IN_SECONDS ? parseInt(process.env.ADMIN_JWT_TOKEN_EXPIRES_IN_SECONDS, 10) : 120 // expressed in seconds or a string describing a time span (https://www.npmjs.com/package/jsonwebtoken)
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


module.exports = TenantUserCtrl;
