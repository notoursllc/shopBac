<script>
import uuid from 'uuid';

const uniqueId = uuid();

export default {
    props: {
        route: {
            type: Object,
            default: () => {
                return {
                    name: uniqueId
                };
            }
        },

        disabled: {
            type: Boolean,
            default: false
        }
    },

    inject: ['menuListState'],

    data() {
        return {
            isActive: false
        };
    },

    computed: {
        bgColor() {
            return this.isActive ? this.menuListState.activeBackgroundColor : null;
        },

        hoverBgColor() {
            return this.menuListState.hoverBackgroundColor;
        },

        styleObject() {
            const style = {};

            if(this.isActive) {
                style.backgroundColor = this.menuListState.activeBackgroundColor;
                style.color = this.menuListState.activeTextColor;
            }

            if(this.disabled) {
                style.color = this.menuListState.textColor;
            }
            else if(this.menuListState.activeTextColor && this.isActive) {
                style.color = this.menuListState.activeTextColor;
            }

            return style;
        },

        classObject() {
            return {
                'is-active': this.isActive,
                'is-disabled': this.disabled
            };
        }
    },

    watch: {
        'menuListState.activeItem': {
            handler: function(newVal) {
                this.setActive();
            }
        }
    },

    mounted() {
        this.setActive();
    },

    methods: {
        onItemClick() {
            if (!this.disabled) {
                this.menuListState.activeItem = this.route.name;

                // only use the $router if the route name is not the placeholder one we
                // created by default
                if(this.route.name !== uniqueId) {
                    this.$router.push(this.route);
                }

                this.$emit('click', this);
            }
        },

        onMouseEnter() {
            this.$el.style.backgroundColor = !this.disabled ? this.hoverBgColor : null;
        },

        onMouseLeave() {
            this.$el.style.backgroundColor = this.bgColor;
        },

        setActive() {
            if(this.route.name === this.menuListState.activeItem) {
                this.isActive = true;

                // Need to dispatch a native javascript event on the dom element ($el)
                // so it bubbles all the way up, but just bubbling to the parent component
                this.$el.dispatchEvent(
                    new CustomEvent('menuItemActive', { detail: this.route, bubbles: true, composed: true })
                );
            }
            else {
                this.isActive = false;
            }
        }
    }
};
</script>


<template>
    <li class="navigation-item"
        :class="classObject"
        :style="styleObject"
        @click="onItemClick"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
        @focus="onMouseEnter"
        @blur="onMouseLeave"
        role="menuitem"
        tabindex="-1">
        <label><slot></slot></label>
    </li>
</template>
