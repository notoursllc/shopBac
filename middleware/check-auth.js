export default function (context) {

    // If you're on the login page then we're gonna make sure we set your state
    // as logged out.
    // if(context.route.name === 'user-login') {
    //     context.store.dispatch('ui/logout');
    // }

    const routeWhitelist = [
        'tenantmember-login',
        'tenantmember-register'
    ];

    const isAuthenticated = context.store.state.ui.isAuthenticated;

    // If you're not authenticated, and not already on the login or logout pages,
    // then sending you to the login page
    // if(!context.store.state.ui.isAuthenticated && routeWhitelist.indexOf(context.route.name) === -1) {
    //     context.redirect('/user/login');
    // }

    // if youre trying to access the login or register pages,
    // but already logged in, then redirect to somewhere else
    if(routeWhitelist.indexOf(context.route.name) > -1) {
        if(isAuthenticated) {
            context.redirect('/product/list');
        }
    }
    else if(!isAuthenticated) {
        context.redirect('/tenantmember/login');
    }

}
