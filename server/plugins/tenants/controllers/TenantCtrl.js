const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const owasp = require('owasp-password-strength-test');
const BaseController = require('../../core/BaseController');

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
    }


    getSchema() {
        return {
            email: Joi.string().max(100).required(),
            password: Joi.string().max(100).required(),
            cors_origin: Joi.string().required(),
            api_key: Joi.string().max(500),
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


    async createHandler(request, h) {
        const tenant = await this.getByEmail(request.payload.email);
        if(tenant) {
            throw Boom.badData('A user with this email address already exists');
        }

        const passwordValidation = owasp.test(request.payload.password);
        console.log("PWD VALIDATION", request.payload.password, passwordValidation);
        //TODO: throw error if errors



        request.payload.api_key = crypto.randomBytes(32).toString('hex');
        request.payload.password = this.cryptPassword(request.payload.password);
        return super.upsertHandler(request, h);
    }


    upsertHandler(request, h) {
        // todo: check if email already exists if creating new tenant

        const passwordValidation = owasp.test(request.payload.password);
        console.log("PWD VALIDATION", request.payload.password, passwordValidation)



        request.payload.api_key = crypto.randomBytes(32).toString('hex');
        request.payload.password = this.cryptPassword(request.payload.password);
        return super.upsertHandler(request, h);
    }


    cryptPassword(password) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        return hash;
    }


    passwordIsMatch(plainText, hash) {
        return bcrypt.compareSync(plainText, hash);
    }
}

module.exports = TenantCtrl;
