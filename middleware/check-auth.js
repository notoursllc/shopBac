import { getTokenFromCookieInRequest, getTokenFromCookie, jwtTokenIsValid } from '@/utils/auth';

export default function (context) {
    const token = process.server ? getTokenFromCookieInRequest(context.req) : getTokenFromCookie();

    const routeWhitelist = [
        'user-login',
        'user-register'
    ];

    if(routeWhitelist.indexOf(context.route.name) > -1) {
        return;
    }

    if(!jwtTokenIsValid(token, process.env.ADMIN_JWT_TOKEN_SECRET)) {
        context.redirect('/user/login');
    }
}
