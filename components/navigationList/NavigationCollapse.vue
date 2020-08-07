<script>
import uuid from 'uuid';

export default {
    inject: ['menuListState'],

    props: {

        /*
        * @example ['products-'] - beginning of route name must match
        * @example ['*products-'] - any part of the route name must match
        */
        fuzzyRouteMatch: {
            type: Array,
            default: () => {
                return [];
            }
        },

        disabled: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            targetId: uuid(),
            toggleIsOpen: false
        };
    },

    watch: {
        '$route': {
            handler: function(to, from) {
                const matches = this.fuzzyRouteMatch.filter(id => {
                    const isFuzzy = id.indexOf('*') === 0;

                    // remove the "*" if it's a fuzzy search
                    const matcher = isFuzzy ? id.substring(1) : id;
                    const idx = to.name.indexOf(matcher);
                    return isFuzzy ? idx > -1 : idx === 0;
                });

                this.toggleIsOpen = matches.length ? true : false;
            },
            immediate: true
        }
    },

    methods: {
        toggle() {
            this.toggleIsOpen = !this.toggleIsOpen;
        },

        onChildMenuItemActive() {
            this.toggleIsOpen = true;
        }
    }
};
</script>


<template>
    <li class="navigation-item">
        <label
            @click="toggle"
            :class="{'not-collapsed': !toggleIsOpen, 'collapsed': toggleIsOpen}">
            <slot name="label"></slot>
            <i class="navigation-item-arrow"> > </i>
        </label>

        <b-collapse
            :visible="toggleIsOpen"
            tag="ul"
            is-nav
            class="navigation-list"
            v-on:menuItemActive.native="onChildMenuItemActive">
            <slot></slot>
        </b-collapse>
    </li>
</template>
