const Joi = require('joi');
const Boom = require('@hapi/boom');
// const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const uuidV4 = require('uuid/v4');
const owasp = require('owasp-password-strength-test');
const TenantBaseCtrl = require('./TenantBaseCtrl');
const { emailContactUsFormToAdmin } = require('../../cart/services/PostmarkService');

owasp.config({
    allowPassphrases: true,
    maxLength: 128,
    minLength: 8,
    minPhraseLength: 20,
    minOptionalTestsToPass: 4
});


function getJoiStringOrNull(strLen) {
    return Joi.alternatives().try(Joi.string().trim().max(strLen || 100), Joi.allow(null));
}

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

    getAccountSchema() {
        return {
            application_name: getJoiStringOrNull(),
            application_url: getJoiStringOrNull(250),
            // application_logo: getJoiStringOrNull(),
            stripe_key: getJoiStringOrNull(),
            paypal_client_id: getJoiStringOrNull(),
            paypal_client_secret: getJoiStringOrNull(),
            shipengine_api_key: getJoiStringOrNull(),
            shipengine_carriers: Joi.array().allow(null),  // IS THIS RIGHT?
            shipping_from_name: getJoiStringOrNull(),
            shipping_from_streetAddress: getJoiStringOrNull(),
            shipping_from_extendedAddress: getJoiStringOrNull(),
            shipping_from_company: getJoiStringOrNull(),
            shipping_from_city: getJoiStringOrNull(),
            shipping_from_state: getJoiStringOrNull(),
            shipping_from_postalCode: getJoiStringOrNull(),
            shipping_from_countryCodeAlpha2: getJoiStringOrNull(2),
            shipping_from_phone: getJoiStringOrNull(),
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


    updateHandler(request, h) {
        try {
            global.logger.info('REQUEST: TenantCtrl:upsertHandler', {
                meta: {
                    payload: request.payload
                }
            });

            if(Array.isArray(request.payload.shipengine_carriers)) {
                for(let i=request.payload.shipengine_carriers.length-1; i>=0; i--) {
                    if(!request.payload.shipengine_carriers[i].id
                        || !request.payload.shipengine_carriers[i].service_codes?.domestic
                        || !request.payload.shipengine_carriers[i].service_codes?.international) {
                        request.payload.shipengine_carriers.splice(i, 1);
                    }
                }
            }

            request.payload.id = request.payload.tenant_id;
            delete request.payload.tenant_id;

            return super.upsertHandler(request, h);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async contactUsHandler(request, h) {
        try {
            await emailContactUsFormToAdmin({
                name: request.payload.name,
                company: request.payload.company,
                email: request.payload.email,
                message: request.payload.message
            });

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }

    async storeAuthIsValid2(tenant_id, api_key) {
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

        global.logger.debug('TenantCtrl:11111', {
            meta: {
                api_key,
            }
        });

        this.fetchOne({
            id: tenant_id,
            active: true
        })
        .then((Tenant) => {
            global.logger.debug('TenantCtrl:222222', {
                meta: {
                    api_key
                }
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

            global.logger.debug('TenantCtrl:bcrypt.compare', {
                meta: {
                    api_key,
                    tenantApiKey
                }
            });

            // const isValid = await bcrypt.compare(api_key, tenantApiKey);
            const isValid = bcrypt.compareSync(api_key, tenantApiKey);

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
        });
    }


    async storeAuthIsValid(tenant_id, api_key) {
        try {
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

            const Tenant = await this.getModel()
                .forge({
                    id: tenant_id,
                    active: true
                })
                .fetch();

            if(!Tenant) {
                global.logger.info('TenantCtrl:storeAuthIsValid - FAILED - no Tenant found');
                return false;
            }

            const tenantApiKey = Tenant.get('api_key');

            if(!tenantApiKey) {
                global.logger.info('TenantCtrl:storeAuthIsValid - FAILED - Tenant does not have an API key');
                return false;
            }

            global.logger.debug('TenantCtrl:bcrypt.compare', {
                meta: {
                    api_key,
                    tenantApiKey
                }
            });

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
        catch(err) {
            console.log(err);
        }
    }


    async fetchAccountHandler(request, h) {
        try {
            global.logger.info('REQUEST: TenantCtrl.fetchAccountHandler', {
                meta: {
                    query: request.query
                }
            });

            const Tenant = await this.fetchOne({
                id: this.getTenantIdFromAuth(request)
            });

            if(!Tenant) {
                return h.apiSuccess();
            }

            const json = Tenant.toJSON();
            const whitelist = Object.keys(this.getAccountSchema());
            whitelist.push('api_key_public');

            const account = {};
            for(let key in json) {
                if(whitelist.includes(key)) {
                    account[key] = json[key];
                }
            }

            global.logger.info(`RESPONSE: TenantCtrl.fetchAccountHandler`, {
                meta: {
                    model: account
                }
            });

            return h.apiSuccess(
                account
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }


    async generateToken() {
        const token = uuidV4().replace(/-/g, '');
        const salt = bcrypt.genSaltSync(10);
        const hashedToken = bcrypt.hashSync(token, salt);

        return {
            token,
            hashedToken
        }
    }


    async updateApiKeyHandler(request, h) {
        try {
            console.log("UPDATE API HSNDLER")
            global.logger.info('REQUEST: TenantCtrl.updateApiKeyHandler', {
                meta: {
                    payload: request.payload
                }
            });

            const tenantId = this.getTenantIdFromAuth(request);

            const Tenant = await this.fetchOne({
                id: tenantId
            });

            if(!Tenant) {
                throw Boom.badRequest('Unable to find tenant');
            }

            const tokens = await this.generateToken();

            await Tenant.save({
                api_key: tokens.hashedToken,
                api_key_public: tokens.token
            });

            global.logger.info('RESPONSE: TenantCtrl.updateApiKeyHandler', {
                meta: {
                    model: tokens.token
                }
            });

            return h.apiSuccess({
                token: tokens.token
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }


    async deleteApiKeyHandler(request, h) {
        try {
            global.logger.info('REQUEST: TenantCtrl.deleteApiKeyHandler', {
                meta: {
                    query: request.query
                }
            });

            const tenantId = this.getTenantIdFromAuth(request);

            const Tenant = await this.fetchOne({
                id: tenantId
            });

            if(!Tenant) {
                throw Boom.badRequest('Unable to find tenant');
            }

            await Tenant.save({
                api_key: null,
                api_key_public: null
            });

            global.logger.info(`RESPONSE: TenantCtrl.deleteApiKeyHandler`, {
                meta: {}
            });

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }
}


module.exports = TenantCtrl;
