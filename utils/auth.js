import Cookie from 'js-cookie';
const jwt = require('jsonwebtoken');


export const getTokenFromCookieInRequest = (req) => {
    if (!req.headers.cookie) {
        return;
    }

    const jwtCookie = req.headers.cookie.split(';').find(c => c.trim().startsWith('bv_session_token='));
    if (!jwtCookie) {
        return;
    }

    const jwt = jwtCookie.split('=')[1];
    return jwt;
};


export const getTokenFromCookie = () => {
    const jwt = Cookie.get('bv_session_token');
    return jwt;
};


export const jwtTokenIsValid = (token, secret) => {
    console.log("jwtTokenIsValid", token, secret)
    // https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    try {
        const decoded = jwt.verify(token, secret);
        return decoded;
    }
    catch(err) {
        console.log("jwtTokenIsValid ERROR", err);
        // https://www.npmjs.com/package/jsonwebtoken#errors--codes
        return false;
    }
};


export const getCookie = (cookieName) => {
    return Cookie.get(cookieName);
};


export const removeCookie = (cookieName) => {
    return Cookie.remove(cookieName);
};
