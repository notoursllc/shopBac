

<script>
export default {
    props: {
        viewBox: {
            type: String,
            default: '0 0 16 16'
        },
        width: {
            type: String,
            default: '12'
        },
        height: {
            type: String,
            default: '12'
        },
        stroke: {
            type: String,
            default: '#5d6674'
        },
        strokeWidth: {
            type: String,
            default: '2'
        },
        fill: {
            type: String,
            default: 'none'
        },
        className: {
            type: String,
            default: ''
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
        :stroke-width="strokeWidth"
        :fill="fill"
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
    margin-bottom: -1px;
    stroke-miterlimit: 10;
    fill: none;
}
</style>
