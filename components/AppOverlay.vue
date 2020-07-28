<script>
import Vue, { VNode } from 'vue';

export default {
    functional: true,

    render(h, ctx) {
        const attributes = Object.assign(
            {},
            {
                opacity: '0.6',
                'spinner-variant': 'primary'
            },
            ctx.props
        );

        return h(
            'BOverlay',
            {
                on: ctx.listeners,
                attrs: attributes
            },
            ctx.slots().default
        );
    }
};
</script>
