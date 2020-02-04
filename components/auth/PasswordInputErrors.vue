<script>
import isString from 'lodash.isstring';
import { getPasswordValidationConfig } from '../../utils/universal';
import PasswordValidator from '../../utils/PasswordValidator';

const PwValidator = new PasswordValidator(getPasswordValidationConfig());

export default {
    name: 'PasswordInputErrors',

    props: {
        password: {
            type: String,
            required: false,
            default: null
        }
    },

    data() {
        return {
            errors: {},
            allPossibleErrors: {}
        };
    },

    computed: {
        isDirty() {
            return isString(this.password) && this.password.length;
        },

        displayedErrors() {
            const displayed = {};

            for(let key in this.allPossibleErrors) {
                if(this.isDirty
                    && (key !== 'maxLength' || (key === 'maxLength' && this.errors.maxLength))) {
                    displayed[key] = this.allPossibleErrors[key];
                }
            }

            return displayed;
        }
    },

    watch: {
        password: {
            handler(newVal) {
                this.validate(newVal);
            },
            immediate: true
        }
    },

    created() {
        this.allPossibleErrors = PwValidator.getSetConfiguration();
    },

    methods: {
        validate(password) {
            this.errors = PwValidator.validate(password);
            this.$emit('numErrors', PwValidator.getNumberOfErrors());
        },

        displayError(key) {
            // only displaying the 'maxlength' warning if the user is over the threshold
            return key !== 'maxLength' || (key === 'maxLength' && this.isDirty && this.password.length > this.errors.maxLength);
        }
    }
};
</script>

<template>
    <div>
        <div
            v-for="(val, key) in allPossibleErrors"
            :key="key"
            :class="{'colorRed': errors.hasOwnProperty(key), 'colorGreen': !errors.hasOwnProperty(key)}">
            <template v-if="displayError(key)">
                <i v-if="isDirty"
                   :class="{'el-icon-close': errors.hasOwnProperty(key), 'el-icon-check': !errors.hasOwnProperty(key)}" />
                {{ $t(`password_error_${key}`, { val: val }) }}
            </template>
        </div>
    </div>
</template>
