<script>
import uuid from 'uuid';

export default {
    props: {

    },

    inject: ['menuListState'],

    data() {
        return {
            targetId: uuid()
        };
    }
};
</script>


<template>
    <li class="menu-item">
        <label v-b-toggle="targetId">
            <slot name="label"></slot>
            <i class="menu-item-arrow"> > </i>
        </label>

        <b-collapse
            :id="targetId"
            tag="ul"
            is-nav
            class="menu-list">
            <slot></slot>
        </b-collapse>
    </li>
</template>
