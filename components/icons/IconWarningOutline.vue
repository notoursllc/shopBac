<script>
import IconBase from '@/components/icons/IconBase';

export default {
    components: {
        IconBase
    },

    inheritAttrs: false
};
</script>

<template>
    <icon-base v-bind="$attrs">
        <g :fill="$attrs.fill" :class="$attrs.className || 'fillYellow'" stroke="none" stroke-width="0">
            <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,16a1,1,0,1,1,1-1A1,1,0,0,1,12,18Zm1-5a1,1,0,0,1-2,0V6a1,1,0,0,1,2,0Z" />
        </g>
    </icon-base>
</template>



