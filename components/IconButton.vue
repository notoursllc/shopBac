<script>
export default {
    functional: true,

    render(h, ctx) {
        const children = [];

// TODO: add icon child

        // if(ctx.slots().icon) {
        //     children.push(
        //         h(
        //             'div',
        //             {},
        //             ctx.slots().icon
        //         )
        //     );
        // };

        // children.push(
        //     h(
        //         'div',
        //         {
        //             class: ['flex-grow-1', 'pl-1']
        //         },
        //         ctx.slots().default
        //     )
        // );

        return h(
            'BButton',
            {
                class: ['d-flex', 'align-items-stretch', 'pr-0', 'pl-0'],
                on: ctx.listeners,
                attrs: ctx.props
            },
            children
        );
    }
};
</script>
