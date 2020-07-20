

<script>
export default {
    props: {
        viewBox: {
            type: String,
            default: '0 0 16 16'
        },
        width: {
            type: Number,
            default: 20
        },
        height: {
            type: Number,
            default: 20
        },
        stroke: {
            type: String,
            default: '#5d6674'
        },
        strokeWidth: {
            type: Number,
            default: 1
        },
        fill: {
            type: String,
            default: 'none'
        },
        standardFill: {
            type: Boolean,
            default: false
        },
        className: {
            type: String,
            default: ''
        }
    },

    computed: {
        iconStrokeWidth() {
            return this.standardFill ? null : this.strokeWidth;
        },

        iconFill() {
            return this.standardFill ? '#5d6674' : this.fill;
        }
    }
};
</script>

<template>
    <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        class="icon-bv"
        :class="className"
        viewBox="0 0 24 24"
        :width="width"
        :height="height"
        :stroke="stroke"
        :stroke-width="iconStrokeWidth"
        :fill="iconFill"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        role="presentation">
        <slot></slot>
    </svg>
</template>

<style>
.icon-bv {
    display: inline-block;
    stroke-miterlimit: 10;
    fill: none;
}
</style>
