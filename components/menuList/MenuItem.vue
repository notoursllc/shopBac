

<script>
export default {
    props: {
        route: {
            type: Object,
            default: () => {
                return {};
            }
        },

        index: {
            type: String,
            required: true
        },

        disabled: {
            type: Boolean,
            default: false
        }
    },

    inject: ['menuListState'],

    // data() {
    //     return {
    //     };
    // }

    computed: {
        active() {
            return this.index === this.menuListState.activeItem;
        },
        textColor() {
            if(this.disabled) {
                return this.menuListState.textColor;
            }

            if(this.menuListState.activeTextColor && this.menuListState.activeItem === this.index) {
                return this.menuListState.activeTextColor;
            }
            return this.menuListState.textColor || 'inherit';
        },
        hoverBackground() {
            return this.menuListState.hoverBackgroundColor;
        }
    },

    methods: {
        onItemClick() {
            if (!this.disabled) {
                this.menuListState.activeItem = this.index;

                if(Object.keys(this.route).length && !this.disabled) {
                    this.$router.push(this.route);
                }

                this.$emit('click', this);
            }
        },
        onMouseEnter() {
            this.$el.style.backgroundColor = this.disabled ? 'inherit' : this.hoverBackground;
        },
        onMouseLeave() {
            this.$el.style.backgroundColor = 'inherit';
        }
    }
};
</script>


<template>
    <li class="menu-item"
        :class="{
            'is-active': active,
            'is-disabled': disabled
        }"
        :style="{
            color: textColor
        }"
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
