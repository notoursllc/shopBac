

<script>
export default {
    props: {
        textColor: {
            type: String,
            default: '#fff'
        },

        activeTextColor: {
            type: String,
            default: null
        },

        activeBackgroundColor: {
            type: String,
            default: null
        },

        hoverBackgroundColor: {
            type: String,
            default: null
        },

        defaultActive: {
            type: String,
            default: ''
        }
    },

    provide() {
        return {
            menuListState: this.sharedState
        };
    },

    data() {
        return {
            sharedState: {
                activeItem: this.defaultActive,
                activeTextColor: this.activeTextColor,
                hoverBackgroundColor: this.hoverBackgroundColor,
                activeBackgroundColor: this.activeBackgroundColor,
                textColor: this.textColor
            }
        };
    },

    watch: {
        defaultActive(value) {
            this.activeIndex = value;
        },

        $route(to, from) {
            this.updateActiveItem(to.name);
        }
    },

    created() {
        this.updateActiveItem(this.$route.name);
    },

    methods: {
        updateActiveItem(val) {
            this.$set(this.sharedState, 'activeItem', val);
        }
    }
};
</script>


<template>
    <ul class="navigation-list navigation-list-container" :style="{color: textColor || 'inherit'}">
        <slot></slot>
    </ul>
</template>


<style lang="scss">
.navigation-list-container > .navigation-item > label {
    font-weight: 700;
}

.navigation-list {
    border: 0;
    list-style: none;
    position: relative;
    margin: 0;
    padding: 0;
    display: block;

    .navigation-item {
        list-style: none;
        margin: 0;
        padding: 0;

        label * {
            vertical-align: middle;
        }

        label {
            height: 40px;
            line-height: 40px;
            padding: 0 20px;
            font-size: 14px;
            position: relative;
            white-space: nowrap;
            cursor: pointer;
            box-sizing: border-box;
            transition: border-color .3s, background-color .3s, color .3s;
            display: block;

            .navigation-item-arrow {
                position: absolute;
                top: 50%;
                right: 20px;
                margin-top: -7px;
                transition: transform .3s;
                font-size: 12px;
                line-height: 1;
                display: inline-block;
            }
        }

        &.not-collapsed > label .navigation-item-arrow {
            transform: rotateZ(180deg);
        }

        .is-disabled,
        .is-disabled label {
            cursor: not-allowed !important;
        }
    }

    .navigation-item > .navigation-list {
        margin-left: 10px;
    }

    label.not-collapsed .navigation-item-arrow {
        transform: rotateZ(180deg);
    }

    .not-collapsed:focus,
    .collapsed:focus {
        outline: none;
    }
}
</style>
