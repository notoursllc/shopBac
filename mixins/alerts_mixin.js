import IconWarningOutine from '@/components/icons/IconWarningOutline';

export default {
    methods: {
        errorMessage(message, config) {
            const cfg = Object.assign(
                {},
                {
                    variant: 'danger',
                    title: this.$t('Error')
                },
                config
            );

            return this.toastMessage(
                message || this.$t('An error occurred'),
                cfg
            );
        },

        successMessage(message, config) {
            const cfg = Object.assign(
                {},
                {
                    variant: 'success',
                    title: this.$t('Success'),
                    autoHideDelay: 5000,
                    noAutoHide: false
                },
                config
            );

            return this.toastMessage(message, cfg);
        },

        toastMessage(message, config) {
            const cfg = Object.assign(
                {},
                {
                    variant: 'default',
                    toaster: 'b-toaster-top-center',
                    solid: true,
                    noAutoHide: true
                    // noCloseButton: true
                },
                config
            );

            return this.$bvToast.toast(message, cfg);
        },

        confirmModal(message, variant, config) {
            const cfg = Object.assign(
                {},
                {
                    okVariant: variant === 'warning' || variant === 'danger' ? 'danger' : 'primary',
                    okTitle: this.$t('OK'),
                    cancelTitle: this.$t('cancel'),
                    bodyClass: [`modal-body-${variant}`, 'tac'],
                    // headerCloseLabel: this.$t('Close'),
                    // title: this.$t('Please Confirm'),
                    noCloseButton: true,
                    centered: true,
                    footerClass: ['py-2', 'px-3', 'modal-button-center'],
                    size: 'sm'
                },
                config
            );

            const h = this.$createElement;
            let childNode;

            switch(variant) {
                case 'warning':
                    childNode = h(IconWarningOutine, {
                        attrs: {
                            width: '35',
                            height: '35',
                            stroke: 'none',
                            className: 'vabtm fillYellow'
                        }
                    });
                    break;

                default: {
                    childNode = null;
                }
            }

            if(childNode) {
                const messageVNode = h('div', {}, [
                    h('div', { class: ['mbm'] }, [
                        childNode
                    ]),
                    h('div', {}, [
                        message
                    ])

                    // h('div', { class: ['inlineBlock mrm'] }, [
                    //     childNode
                    // ]),
                    // h('div', { class: ['inlineBlock'] }, [
                    //     message
                    // ])
                ]);

                return this.$bvModal.msgBoxConfirm(
                    [messageVNode],
                    cfg
                );
            }

            return this.$bvModal.msgBoxConfirm(message, cfg);
        }
    }

};
