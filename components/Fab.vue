<script>
export default {
    components: {
        IconPlus: () => import('@/components/icons/IconPlus'),
        IconClose: () => import('@/components/icons/IconClose'),
        IconFloppy: () => import('@/components/icons/IconFloppy'),
        IconEditOutline: () => import('@/components/icons/IconEditOutline')
    },

    props: {
        type: {
            type: String,
            required: false,
            default: 'primary'
        },
        column: {
            type: Number,
            required: false,
            default: 1
        }
    },

    computed: {
        buttonType() {
            switch(this.type) {
                case 'edit':
                case 'save':
                    return 'primary';

                case 'delete':
                    return 'danger';

                case 'cancel':
                    return null;

                default:
                    return 'success';
            }
        },

        buttonClass() {
            return this.type === 'cancel' || this.column === 2 ? 'fab2' : '';
        }
    },

    methods: {
        onclick() {
            this.$emit('click');
        }
    },

    render: function(createElement) {
        let icon;

        switch(this.type) {
            case 'edit':
                icon = 'IconEditOutline';
                break;

            case 'save':
                icon = 'IconFloppy';
                break;

            case 'cancel':
                icon = 'IconClose';
                break;

            default:
                icon = 'IconPlus';
        }

        return createElement(
            'BButton',
            {
                class: ['fab', this.buttonClass],
                props: {
                    variant: this.buttonType,
                    pill: true
                },
                on: {
                    click: this.onclick
                }
            },
            [
                createElement(
                    icon,
                    {
                        attrs: {
                            height: '30',
                            width: '30',
                            stroke: '#fff',
                            'stroke-width': 2
                        }
                    }
                )
            ]
        );
    }
};
</script>


<style lang="scss" scoped>
.fab {
    z-index: 1;
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 14px;
}

.fab2 {
    right: 100px;
}
</style>
