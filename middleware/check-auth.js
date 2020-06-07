import { getCookie } from '@/utils/auth';

export default function (context) {
    const isAuthenticated = getCookie(process.env.SESSION_TOKEN_COOKIE_NAME);
    // console.log("userIsAuthenticated", isAuthenticated);

    const routeWhitelist = [
        'user-login',
        'user-register'
    ];

    // if youre trying to access the login or register pages,
    // but already logged in, then redirect to somewhere else
    if(routeWhitelist.indexOf(context.route.name) > -1) {
        if(isAuthenticated) {
            context.redirect('/product/list');
        }
    }
    else if(!isAuthenticated) {
        context.redirect('/user/login');
    }
}
