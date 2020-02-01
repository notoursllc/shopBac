<script>
export default {
    name: 'LoginPage',

    components: {
        UserAuthForm: () => import('@/components/auth/UserAuthForm')
    },

    data() {
        return {

        };
    },

    methods: {
        onAuthFormSubmit(data) {
            console.log('onAuthFormSubmit', data);
            this.$auth.loginWith(
                'local',
                { data }
            );
        }
    }
};
</script>

<template>
    <div>
        <h1>Login</h1>

        <div>
            <user-auth-form :submit-function="onAuthFormSubmit" />
        </div>
    </div>
</template>

<style lang="scss">

</style>
