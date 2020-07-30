<script>
export default {
    name: 'TextCard'
}
</script>

<template>
    <div class="text-card">
        <div class="text-card-header" v-if="$slots.header || $slots.headerRight">
            <div class="text-card-header-left">
                <slot name="header"></slot>
                <div class="text-card-header-sub text-secondary" v-if="$slots.headerSub"><slot name="headerSub"></slot></div>
            </div>
            <div v-if="$slots.headerRight">
                <slot name="headerRight"></slot>
            </div>
        </div>
        <div class="text-card-content">
            <slot></slot>
        </div>
    </div>
</template>


<style lang="scss" scoped>
@import "~assets/css/components/_mixins.scss";

.text-card {
    box-shadow: 0 0 0 1px rgba(63,63,68,.05), 0 1px 3px 0 rgba(63,63,68,.15);
    background-color: #fff;

    h4 {
        font-size: 13px;
        font-weight: 500;
        padding-bottom: 10px;
    }

    .text-card-header {
        padding: 5px 10px;
        background: #f5f5f5;
        font-weight: 500;
        display: flex;

        .text-card-header-left {
            flex-grow: 1
        }

        .text-card-header-sub {
            font-size: 12px;
        }
    }
    .text-card-content {
        padding: 15px 20px;
    }
}
</style>
