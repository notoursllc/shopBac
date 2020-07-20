<script>
import uuid from 'uuid';

export default {
    inject: ['menuListState'],

    data() {
        return {
            targetId: uuid(),
            toggleIsOpen: false
        };
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
