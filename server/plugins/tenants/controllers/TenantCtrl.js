const Joi = require('@hapi/joi');
// const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const owasp = require('owasp-password-strength-test');
const TenantBaseCtrl = require('./TenantBaseCtrl');


owasp.config({
    allowPassphrases: true,
    maxLength: 128,
    minLength: 8,
    minPhraseLength: 20,
    minOptionalTestsToPass: 4
});


class TenantCtrl extends TenantBaseCtrl {

    constructor(server) {
        super(server, 'Tenant');
        this.validTenantCache = [];
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


    getCreateSchema() {
        return {
            password: Joi.string().max(100).required(),
            application_name: Joi.string().max(100),
            application_url: Joi.string().max(100),
            application_logo: Joi.string()
        };
    }


    // async createHandler(request, h) {
    //     const Tenant = await this.getByEmail(request.payload.email);

    //     // console.log("TENANT", Tenant);
    //     if(Tenant) {
    //         throw Boom.badData('A user with this email address already exists');
    //     }

    //     const passwordValidation = owasp.test(request.payload.password);
    //     console.log('PWD VALIDATION', request.payload.password, passwordValidation);

    //     // TODO: throw error if errors

    //     // request.payload.api_key = crypto.randomBytes(32).toString('hex');
    //     request.payload.password = cryptPassword(request.payload.password);
    //     return super.upsertHandler(request, h);
    // }


    // upsertHandler(request, h) {
    //     // todo: check if email already exists if creating new tenant

    //     const passwordValidation = owasp.test(request.payload.password);

    //     // console.log('PWD VALIDATION', request.payload.password, passwordValidation);

    //     // request.payload.api_key = crypto.randomBytes(32).toString('hex');
    //     request.payload.password = cryptPassword(request.payload.password);
    //     return super.upsertHandler(request, h);
    // }


    async storeAuthIsValid(tenant_id, api_key) {
        global.logger.info('REQUEST: TenantCtrl:storeAuthIsValid', {
            meta: {
                tenant_id,
                api_key
            }
        });

        if (!tenant_id || !api_key) {
            global.logger.info('TenantCtrl:storeAuthIsValid - FAILED');
            return false;
        }

        const Tenant = await this.modelForgeFetch({
            id: tenant_id,
            active: true
        });

        if(!Tenant) {
            global.logger.info('TenantCtrl:storeAuthIsValid - FAILED - no Tenant found');
            return false;
        }

        const tenantApiKey = Tenant.get('api_key');

        if(!tenantApiKey) {
            global.logger.info('TenantCtrl:storeAuthIsValid - FAILED - Tenant does not have an API key');
            return false;
        }

        const isValid = await bcrypt.compare(api_key, tenantApiKey);

        if(!isValid) {
            global.logger.info('TenantCtrl:storeAuthIsValid - FAILED - api key does not match hash');
            return false;
        }

        const tenantJson = Tenant.toJSON();

        global.logger.info('TenantCtrl:storeAuthIsValid - SUCCESS', {
            meta: {
                tenant: tenantJson
            }
        });

        return tenantJson;
    }

}


module.exports = TenantCtrl;
