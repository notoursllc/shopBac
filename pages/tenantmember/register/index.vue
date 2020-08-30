<script>
import { required, email } from 'vuelidate/lib/validators';
import PasswordValidator from '../../../utils/PasswordValidator';
import { getPasswordValidationConfig } from '../../../utils/universal';

const Validator = new PasswordValidator(getPasswordValidationConfig());
const touchMap = new WeakMap();


export default {
    name: 'RegisterPage',

    components: {
        PasswordInputErrors: () => import('@/components/auth/PasswordInputErrors')
    },

    data() {
        return {
            userData: {
                email: null,
                password: null
            },
            numPasswordErrors: 0
        };
    },

    validations: {
        userData: {
            email: {
                required,
                email
            },
            password: {
                required
            }
        }
    },

    methods: {
        async onSubmit() {
            const response = await this.$api.tenantMembers.add(this.userData);
            console.log('TENANT RESPONSE', response);
        },

        delayTouch($v) {
            $v.$reset();
            if (touchMap.has($v)) {
                clearTimeout(touchMap.get($v));
            }
            touchMap.set($v, setTimeout($v.$touch, 1000));
        }
    }
};
</script>

<template>
    <div>
        <h1>Register</h1>

        <div>
            <form>
                <!-- email -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Email') }}</label>
                    <b-form-input
                        v-model="userData.email"
                        @input="delayTouch($v.userData.email)" />

                    <div v-if="$v.userData.email.$invalid" class="form-validation-error">
                        <div v-if="!$v.userData.email.required">{{ $t('required') }}</div>
                        <div v-if="$v.userData.email.$dirty && !$v.userData.email.email">{{ $t('invalid email address format') }}</div>
                    </div>
                </div>

                <!-- password -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Password') }}</label>
                    <div>
                        <b-form-input
                            v-model="userData.password"
                            type="password" />

                        <div class="form-validation-error">
                            <password-input-errors
                                :password="userData.password"
                                @numErrors="(num) => { numPasswordErrors = num }" />
                        </div>
                    </div>
                </div>

                <div class="ptl">
                    <b-button
                        variant="primary"
                        @click="onSubmit"
                        :disabled="$v.userData.$invalid || numPasswordErrors > 0">{{ $t('Submit') }}</b-button>
                </div>
            </form>
        </div>
    </div>
</template>

<style lang="scss">

</style>
