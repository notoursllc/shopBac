export default ($http) => ({

    async add(userData) {
        const { data } = await $http.$post('/tenant/member', userData);
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
