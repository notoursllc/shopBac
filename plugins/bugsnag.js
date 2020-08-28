import Vue from 'vue';
import bugsnag from '@bugsnag/js';
import bugsnagVue from '@bugsnag/plugin-vue';

export default (context) => {

    const bugsnagClient = bugsnag({
        apiKey: context.env.BUG_SNAG_API_KEY,
        notifyReleaseStages: [ 'production' ]
    });

    bugsnagClient.use(bugsnagVue, Vue);

    Vue.prototype.$bugsnag = bugsnagClient;

};
