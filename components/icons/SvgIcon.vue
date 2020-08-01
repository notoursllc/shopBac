

<script>
export default {
    name: 'SvgIcon',

    functional: true,

    render(h, ctx) {
        const classes = ['icon', ctx.props.className];
        if(ctx.props.spin) {
            classes.push('icon-spin');
        }

        const attributes = {
            width: 20,
            height: 20,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'aria-hidden': 'true',
            role: 'presentation',
            focusable: 'false',
            fill: 'none'
        };

        Object.keys(ctx.props).forEach((prop) => {
            const val = ctx.props[prop];

            switch(prop) {
                case 'strokeWidth':
                    attributes['stroke-width'] = val;
                    break;

                case 'strokeLinecap':
                    attributes['stroke-linecap'] = val;
                    break;

                case 'strokeLinejoin':
                    attributes['stroke-linecap'] = val;
                    break;

                // everything else is free to be added as-is
                default:
                    attributes[prop] = val;
            }
        });

        if(!attributes.stroke && (!attributes.fill || attributes.fill === 'none')) {
            attributes.stroke = '#565656';
        }
        if(attributes.stroke && !attributes['stroke-width']) {
            attributes['stroke-width'] = '2px';
        }

        return h(
            'svg',
            {
                class: classes,
                on: ctx.listeners,
                attrs: attributes
            },
            [
                h(
                    'use',
                    {
                        attrs: {
                            'xlink:href': `#${ctx.props.icon}`
                        }
                    }
                )
            ]
        );
    }
};
</script>
