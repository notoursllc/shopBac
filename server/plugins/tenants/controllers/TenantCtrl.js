const Joi = require('joi');
const Boom = require('@hapi/boom');
// const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const uuidV4 = require('uuid/v4');
const isObject = require('lodash.isobject');
const owasp = require('owasp-password-strength-test');
const TenantBaseCtrl = require('./TenantBaseCtrl');
const ExchangeRateCtrl = require('../../exchange-rates/controllers/ExchangeRateCtrl.js');
const BunnyAPI = require('../../core/services/BunnyAPI');
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
        this.ExchangeRateCtrl = new ExchangeRateCtrl(server);
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
            application_logo: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.object(),
                Joi.allow(null)
            ),
            order_details_page_url: getJoiStringOrNull(250),
            stripe_key: getJoiStringOrNull(),
            paypal_client_id: getJoiStringOrNull(),
            paypal_client_secret: getJoiStringOrNull(),
            shipengine_api_key: getJoiStringOrNull(),
            shipengine_carriers: Joi.alternatives().try(
                Joi.string().trim(),
                Joi.allow(null)
            ),
            // shipengine_carriers: Joi.array().allow(null),
            shipping_from_name: getJoiStringOrNull(),
            shipping_from_streetAddress: getJoiStringOrNull(),
            shipping_from_extendedAddress: getJoiStringOrNull(),
            shipping_from_company: getJoiStringOrNull(),
            shipping_from_city: getJoiStringOrNull(),
            shipping_from_state: getJoiStringOrNull(),
            shipping_from_postalCode: getJoiStringOrNull(),
            shipping_from_countryCodeAlpha2: getJoiStringOrNull(2),
            shipping_from_phone: getJoiStringOrNull(),
            // supported_currencies: Joi.array().allow(null),
            supported_currencies: Joi.alternatives().try(
                Joi.string().trim(),
                Joi.allow(null)
            ),
            default_currency: getJoiStringOrNull()
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


    async updateHandler(request, h) {
        try {
            global.logger.info('REQUEST: TenantCtrl:upsertHandler', {
                meta: {
                    payload: request.payload
                }
            });

            const tenantId = this.getTenantIdFromAuth(request);

            const Tenant = await this.fetchOne({
                id: tenantId
            });

            if(!Tenant) {
                throw new Error('Tenant can not be found');
            }

            if(isObject(request.payload.application_logo)) {
                request.payload.application_logo = await BunnyAPI.storage.tenantLogoUpload(
                    `${Date.now()}-${request.payload.application_logo.filename}`,
                    request.payload.application_logo
                );

                // delete the previous image
                // No need for 'await' here right?
                if(Tenant.get('application_logo')) {
                    BunnyAPI.storage.del(Tenant.get('application_logo'));
                }
            }

            if(Array.isArray(request.payload.shipengine_carriers)) {
                for(let i=request.payload.shipengine_carriers.length-1; i>=0; i--) {
                    if(!request.payload.shipengine_carriers[i].id
                        || !request.payload.shipengine_carriers[i].service_codes?.domestic
                        || !request.payload.shipengine_carriers[i].service_codes?.international) {
                        request.payload.shipengine_carriers.splice(i, 1);
                    }
                }
            }

            request.payload.id = tenantId;
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
            const Tenant = await this.TenantCtrl.fetchOne({
                id: this.getTenantIdFromAuth(request)
            });

            if(!Tenant) {
                throw new Error('Tenant can not be found');
            }

            await emailContactUsFormToAdmin({
                brandName: Tenant.get('application_name'),
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


    generateToken() {
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

            const tokens = this.generateToken();

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


    /**
     * For each of the 'supported_currencies' set in the Tenant table,
     * get the respective exchange rate
     *
     * @param UUID tenantId
     * @returns {*}
     */
    async getSupportedCurrenyRates(tenantId) {
        const result = await Promise.all([
            this.ExchangeRateCtrl.fetchRate(),
            this.fetchOne({
                id: tenantId
            })
        ]);

        const ExchangeRate = result[0];
        const Tenant = result[1];
        const filteredRates = {
            base: null,
            default: null,
            rates: {}
        }

        if(ExchangeRate && Tenant) {
            filteredRates.base = ExchangeRate.get('base');
            const rates = ExchangeRate.get('rates');
            const supported_currencies = Tenant.get('supported_currencies');

            if(Array.isArray(supported_currencies)) {
                supported_currencies.forEach((countryCode) => {
                    filteredRates.rates[countryCode] = rates[countryCode]
                });
            }
            else {
                filteredRates.rates = rates;
            }

            filteredRates.default = Tenant.get('default_currency');
        }

        return filteredRates;
    }


    async exchangeRatesHandler(request, h) {
        try {
            global.logger.info('REQUEST: TenantCtrl.exchangeRatesHandler', {
                meta: {}
            });

            const rates = await this.getSupportedCurrenyRates(
                this.getTenantIdFromAuth(request)
            );

            global.logger.info(`RESPONSE: TenantCtrl.exchangeRatesHandler`, {
                meta: { rates }
            });

            return h.apiSuccess(rates);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }
}


module.exports = TenantCtrl;
