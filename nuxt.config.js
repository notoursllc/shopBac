
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
        // { src: '@/plugins/tenantLogin.js', mode: 'server' },
        '@/plugins/api.js',
        '@/plugins/i18n.js',
        '@/plugins/element-ui',
        '@/plugins/vuelidate',
        '@/plugins/format8601',
        '@/plugins/prettyJson',
        '@/plugins/vue-select',
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
        '@nuxt/http',
        ['@nuxtjs/pwa', { oneSignal: false }],
        // Doc: https://github.com/nuxt-community/dotenv-module
        '@nuxtjs/dotenv',
        'bootstrap-vue/nuxt'
    ],

    router: {
        middleware: [
            'check-auth'
        ]
    },

    /*
    * Disabling automatic inclusion of bootstrap's compiled CSS files
    * so we can import the SCSS files ourselves in base.scss
    * https://bootstrap-vue.org/docs
    */
    bootstrapVue: {
        bootstrapCSS: false, // Or `css: false`
        bootstrapVueCSS: false, // Or `bvCSS: false`

        // importing only the stuff we are using to reduce bundle size
        components: [
            'BButton',
            'BButtonGroup',
            'BContainer',
            'BRow',
            'BCol',
            'BDropdown',
            'BDropdownForm',
            'BDropdownItem',
            'BFormCheckbox',
            'BFormFile',
            'BFormGroup',
            'BFormInput',
            'BFormRadio',
            'BFormSelect',
            'BFormSelectOption',
            'BFormTextarea',
            'BImg',
            'BInputGroup',
            'BInputGroupText',
            'BInputGroupAppend',
            'BModal',
            'BOverlay',
            'BPopover',
            'BTable',
            'BTooltip'
        ],
        directives: ['VBModal', 'VBPopover', 'VBTooltip', 'VBScrollspy']
    },

    /*
    * HTTP module config
    * https://http.nuxtjs.org/api/
    */
    http: {
        proxyHeaders: true,
        https: process.env.API_USE_HTTPS,
        retry: 1
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
