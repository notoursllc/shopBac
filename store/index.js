const jwt = require('jsonwebtoken');


export const state = () => ({
    user: null,
    jwtToken: null,
    jwtRefreshToken: null,
    jwtTokenDecoded: null
});


export const mutations = {
    SET_USER (state, user) {
        state.user = user || null;
    },

    SET_JWT_TOKEN (state, token) {
        state.jwtToken = token || null;
        state.jwtTokenDecoded = jwt.decode(token);
    },

    SET_JWT_REFRESH_TOKEN (state, token) {
        state.jwtRefreshToken = token || null;
    }
};


export const actions = {
    SET_JWT_TOKEN: ({ commit }, token) => {
        commit('SET_JWT_TOKEN', token);
    },

    SET_JWT_REFRESH_TOKEN: ({ commit }, token) => {
        commit('SET_JWT_REFRESH_TOKEN', token);
    }
};


export const getters = {
    isAuthenticated (state) {
        return !!state.user;
    },

    loggedUser (state) {
        return state.user;
    },

    // https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    jwtTokenIsValid(state) {
        try {
            const decoded = jwt.verify(state.jwtToken, process.env.JWT_TOKEN_SECRET);
            return decoded;
        }
        catch(err) {
            // https://www.npmjs.com/package/jsonwebtoken#errors--codes
            return false;
        }
    }
};
