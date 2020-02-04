// copied directly from lodash.isobject:
function isObject(value) {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    const type = typeof value;
    return !!value && (type === 'object' || type === 'function');
}

const defaultConfig = {
    minLength: 10,
    maxLength: 128,
    maxRepeatableCharacters: 3,
    requireLowerCaseLetter: true,
    requireUpperCaseLetter: true,
    requireSpecialCharacter: true,
    requireNumber: true
};


export default class PasswordValidator {

    constructor(customConfig) {
        const config = Object.assign({}, defaultConfig, isObject(customConfig) ? customConfig : null);

        // remove any illegal keys from config that may have been added by the user
        for(let key in config) {
            if(!defaultConfig.hasOwnProperty(key)) {
                delete config[key];
            }
        }

        this.config = config;
        this.errors = {};
    }


    getSetConfiguration() {
        const availableConfig = {};

        for(const key in this.config) {
            if(this.config[key]) {
                availableConfig[key] = this.config[key];
            }
        }

        return availableConfig;
    }


    resetErrors() {
        this.errors = {};

        // define all possible errors that can occur based on the config
        for(let key in this.config) {
            if(this.config[key]) {
                this.errors[key] = this.config[key];
            }
        }
    }


    validate(password) {
        this.resetErrors();

        if(!password) {
            delete this.errors.maxLength;
            return this.errors;
        }

        if(this.passesMinLengthTest(password)) {
            delete this.errors.minLength;
        }

        if(this.passesMaxLengthTest(password)) {
            delete this.errors.maxLength;
        }

        if(this.passesRepeatingCharactersTest(password)) {
            delete this.errors.maxRepeatableCharacters;
        }

        if(this.passesLowerCaseLetterTest(password)) {
            delete this.errors.requireLowerCaseLetter;
        }

        if(this.passesUpperCaseLetterTest(password)) {
            delete this.errors.requireUpperCaseLetter;
        }

        if(this.passesSpecialCharacterTest(password)) {
            delete this.errors.requireSpecialCharacter;
        }

        if(this.passesNumberTest(password)) {
            delete this.errors.requireNumber;
        }

        return this.errors;
    }


    passesMinLengthTest(password) {
        if (this.config.minLength && (password.length < this.config.minLength)) {
            return false;
        }
        return true;
    }


    passesMaxLengthTest(password) {
        if (this.config.maxLength && (password.length > this.config.maxLength)) {
            return false;
        }
        return true;
    }


    passesRepeatingCharactersTest(password) {
        if(this.config.maxRepeatableCharacters) {
            // plain regex: /(.)\1{3,}/
            // escaping special chars when setting as a string: `\(.\)\\1\{3,\}`
            const hasTooManyChars = new RegExp(`\(.\)\\1\{${this.config.maxRepeatableCharacters},\}`).test(password);
            if (hasTooManyChars) {
                return false;
            }
        }
        return true;
    }


    passesLowerCaseLetterTest(password) {
        if (this.config.requireLowerCaseLetter && !/[a-z]/.test(password)) {
            return false;
        }
        return true;
    }


    passesUpperCaseLetterTest(password) {
        if (this.config.requireUpperCaseLetter && !/[A-Z]/.test(password)) {
            return false;
        }
        return true;
    }


    passesSpecialCharacterTest(password) {
        if (this.config.requireSpecialCharacter && !/[^A-Za-z0-9]/.test(password)) {
            return false;
        }
        return true;
    }


    passesNumberTest(password) {
        if (this.config.requireNumber && !/[0-9]/.test(password)) {
            return false;
        }
        return true;
    }


    getNumberOfErrors() {
        return Object.keys(this.errors).length;
    }

}
