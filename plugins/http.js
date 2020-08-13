// import ky from 'ky-universal';
import isObject from 'lodash.isobject';

export default function ({ $http, store, redirect }) {
    // $http.onRequest(config => {
    //     console.log('Making request to ' + config.url)
    // });

    // $http.onRetry(async (request, options, errors, retryCount) => {
    //     const token = await ky('https://example.com/refresh-token')
    //     options.header.set('Authorization', `Bearer ${token}`)
    // })

    $http.onError(error => {
        // console.log("HTTP ERROR", error.response);

        if(isObject(error) && isObject(error.response)) {
            const statusCode = error.response.status;

            switch(statusCode) {
                case 401:
                    store.dispatch('ui/logout');
                    redirect('/user/login');
                    return;

                // Too many requests  (rate limit exceeded)
                case 429:
                    redirect('/error');
                    return;
            }

        }
        // if (error.statusCode === 500) {
        //     alert('Request Error!')
        // }

        // Tip: error.response will be undefined if the connection dropped to the server
        // Tip: You can use error.response.data to get response message
        // Tip: You can return an object or Promise as fallback response to avoid rejection
    });
}
