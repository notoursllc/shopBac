<script>
export default {
    name: 'RegisterPage',

    components: {
    },

    data() {
        return {
            userData: {
                email: null,
                password: null,
                cors_origin: null
            }
        };
    },

    methods: {
        async onSubmit() {
            const { data } = await this.$api.tenants.register(this.userData);
            console.log('TENANT RESPONSE', data);
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
                    <el-input v-model="userData.email" />
                </div>

                <!-- password -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Password') }}</label>
                    <el-input
                        v-model="userData.password"
                        show-password />
                </div>

                <!-- password -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('CORS origin') }}</label>
                     <el-input v-model="userData.cors_origin" />
                </div>

                <el-button
                    type="primary"
                    @click="onSubmit">{{ $t('Submit') }}</el-button>
            </form>
        </div>
    </div>
</template>

<style lang="scss">

</style>
