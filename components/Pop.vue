<script>
import uuid from 'uuid';

export default {
    inheritAttrs: false,

    data() {
        return {
            uuid: uuid(),
            popoverVisible: false
        };
    },

    computed: {
        popoverTargetId() {
            return `popover-target-${this.uuid}`;
        }
    },

    methods: {
        hide() {
            this.popoverVisible = false;
        },

        show() {
            this.popoverVisible = true;
        }
    }
};
</script>


<template>
    <div class="inlineBlock">
        <b-popover
            :target="popoverTargetId"
            :show.sync="popoverVisible"
            v-bind="$attrs"
            v-on="$listeners">
            <slot></slot>
        </b-popover>

        <div
            :id="popoverTargetId"
            @click="popoverVisible = !popoverVisible">
            <slot name="reference"></slot>
        </div>
    </div>
</template>
