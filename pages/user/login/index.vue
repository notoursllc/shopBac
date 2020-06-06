<script>
export default {
    name: 'LoginPage',

    data() {
        return {
            loading: false,
            userInfo: {
                email: null,
                password: null
            }
        };
    },

    methods: {
        async onSubmit() {
            try {
                await this.$api.tenants.login(this.userInfo);

                this.$router.push({
                    name: 'product-list'
                });
            }
            catch(e) {
                this.$errorMessage(
                    e.message,
                    { closeOthers: true }
                );
            }
        }
    }
};
</script>

<template>
    <div>
        <h1>Login</h1>

        <div v-loading="loading">
            <form @submit.prevent>
                <!-- email -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Email address') }}</label>
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
                    @click="onSubmit">{{ $t('Submit') }}</el-button>
            </form>
        </div>
    </div>
</template>


<style lang="scss" scoped>
@import "~assets/css/components/_formRow.scss";
</style>
