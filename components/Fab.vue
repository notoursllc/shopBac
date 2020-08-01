<script>
import SvgIcon from '@/components/icons/SvgIcon';

export default {
    props: {
        icon: {
            type: String,
            required: false,
            default: 'plus'
        },
        column: {
            type: Number,
            required: false,
            default: 1
        }
    },

    computed: {
        buttonType() {
            switch(this.icon) {
                case 'edit':
                // case 'save':
                    return 'primary';

                case 'trash':
                    return 'danger';

                case 'x':
                    return null;

                default:
                    return 'success';
            }
        },

        buttonClass() {
            return this.icon === 'x' || this.column === 2 ? 'fab2' : '';
        }
    },

    methods: {
        onclick() {
            this.$emit('click');
        }
    },

    render: function(createElement) {
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
                    SvgIcon,
                    {
                        attrs: {
                            icon: this.icon,
                            height: 30,
                            width: 30,
                            stroke: '#fff'
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
