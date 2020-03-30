
module.exports = {
    mode: 'spa',

    /*
    ** Headers of the page
    */
    head: {
        title: process.env.npm_package_name || '',
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
        ],
        link: [
            { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
        ]
    },

    meta: {
        name: 'ShopBac',
        theme_color: '#e66d17'
    },

    /*
    ** Customize the progress-bar color
    */
    loading: {
        color: '#67c23a',
        height: '4px',
        duration: 5000
    },

    /*
    ** Global CSS
    */
    css: [
        'element-ui/lib/theme-chalk/index.css',
        '@/assets/css/base.scss'
    ],

    /*
    ** Plugins to load before mounting the App
    */
    plugins: [
        '@/plugins/api.js',
        '@/plugins/i18n.js',
        '@/plugins/element-ui',
        '@/plugins/vuelidate',
        '@/plugins/format8601',
        '@/plugins/prettyJson',
        { src: '@/plugins/youtube', ssr: false },
        { src: '@/plugins/bugsnag', ssr: false }
    ],

    /*
    ** Nuxt.js dev-modules
    */
    buildModules: [
        // Doc: https://github.com/nuxt-community/eslint-module
        // '@nuxtjs/eslint-module'
    ],

    /*
    ** Nuxt.js modules
    */
    modules: [
        // Doc: https://axios.nuxtjs.org/usage
        '@nuxtjs/axios',
        '@nuxtjs/auth',
        ['@nuxtjs/pwa', { oneSignal: false }],
        // Doc: https://github.com/nuxt-community/dotenv-module
        '@nuxtjs/dotenv'
    ],

    /*
    ** Auth module config (@nuxtjs/auth - https://auth.nuxtjs.org/)
    */
    auth: {
        strategies: {
            local: {
                endpoints: {
                    login: { url: '/api/v1/auth', method: 'post', propertyName: 'token' },
                    logout: { url: '/api/v1/auth', method: 'delete' },
                    user: { url: '/api/v1/auth/user', method: 'get', propertyName: 'user' }
                }
                // tokenRequired: true,
                // tokenType: 'bearer'
            }
        }
    },

    /*
    ** Axios module configuration
    ** See https://axios.nuxtjs.org/options
    */
    axios: {
        debug: false,
        https: process.env.API_USE_HTTPS,
        retry: { retries: 3 },
        progress: true
    },

    /*
    ** Build configuration
    */
    build: {
        transpile: [/^element-ui/],

        /*
        ** You can extend webpack config here
        */
        extend (config, ctx) {
        }
    },

    pageTransition: {
        name: 'fade',
        mode: 'out-in'
    }
};
