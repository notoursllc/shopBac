const Joi = require('joi');
const Boom = require('@hapi/boom');
const bcrypt = require('bcryptjs');
const TenantBaseCtrl = require('./TenantBaseCtrl');
const { cryptPassword, testPasswordStrength } = require('../../../helpers.service');

class TenantMemberCtrl extends TenantBaseCtrl {

    constructor(server) {
        super(server, 'TenantMember');
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
    //     return Joi.object({
    //         id: Joi.string().max(100).required(),
    //         password: Joi.string().max(100).required(),
    //         active: Joi.boolean().default(true),
    //         created_at: Joi.date(),
    //         updated_at: Joi.date()
    //     });
    // }

    /**
     * This method is called by the client when he wants to receive a new JWT
     *
     * @param {*} request
     * @param {*} h
     */
    async loginHandler(request, h) {
        global.logger.info('REQUEST: TenantMemberCtrl.loginHandler', {
            meta: {
                payload: request.payload
            }
        });

        let TenantMember;

        try {
            TenantMember = await this.modelForgeFetch(
                { email: request.payload.email }
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }

        if(!TenantMember
            || !bcrypt.compareSync(request.payload.password, TenantMember.get('password'))) {
            throw Boom.unauthorized();
        }

        try {
            // This is the httpOnly cookie that is used by the server that is required for access.
            // cookieAuth is a decoration added by the Hapi "cookie" module to set a session cookie:
            // https://hapi.dev/module/cookie/api/?v=11.0.1
            // The cookie content (the object sent to cookieAuth.set) will be encrypted.
            request.cookieAuth.set({
                id: TenantMember.get('id')
            });

            global.logger.info('RESPONSE: TenantMemberCtrl.loginHandler - set cookie', {
                meta: {
                    'tenant member id': TenantMember.get('id')
                }
            });

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    logoutHandler(request, h) {
        try {
            request.cookieAuth.clear();
            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async createHandler(request, h) {
        const [ TenantMember, Tenant ] = await Promise.all([
            this.modelForgeFetch(
                { email: request.payload.email }
            ),
            this.getTenant(request)
        ]);

        if(TenantMember) {
            throw Boom.badData('A TenantMember with the specified email address already exists');
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
}


module.exports = TenantMemberCtrl;
