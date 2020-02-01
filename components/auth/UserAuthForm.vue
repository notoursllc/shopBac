<script>
// TODO: use vuelidate for input validation

export default {
    props: {
        buttonText: {
            type: String
        },

        hasName: {
            type: Boolean,
            default: false
        },

        submitFunction: {
            type: Function,
            required: true
        }
    },

    data() {
        return {
            userInfo: {
                email: '',
                password: ''
            }
        };
    },

    methods: {
        onSubmit() {
            this.submitFunction(this.userInfo);
        }
    }
};
</script>

<template>
    <form>
        <!-- username -->
        <div class="inputGroup mrl mbm" v-if="hasName">
            <label>{{ $t('Username') }}</label>
            <el-input v-model="userInfo.name" />
        </div>

        <!-- email -->
        <div class="inputGroup mrl mbm">
            <label>{{ $t('Email') }}</label>
            <el-input v-model="userInfo.email" />
        </div>

        <!-- password -->
        <div class="inputGroup mrl mbm">
            <label>{{ $t('Password') }}</label>
            <el-input
                v-model="userInfo.password"
                show-password />
        </div>

        <el-button
            type="primary"
            @click="onSubmit">{{ buttonText || $t('Submit') }}</el-button>
    </form>
</template>

<style lang="scss" scoped>
@import "~assets/css/components/_formRow.scss";
</style>
