export default ($http) => ({

    async register(userData) {
        const { data } = await $http.$post('/tenant', userData);
        return data;
    },

    async login(userData) {
        const { data } = await $http.$post('/tenant/member/login', userData);
        return data;
    },

    async logout() {
        const { data } = await $http.$post('/tenant/member/logout');
        return data;
    }

});
