<script>
import Vue from 'vue'

export default{
    props: {
        value: {
            type: String,
            default: ''
        }
    },

    data: function() {
        return {
            test: 'test data',
        }
    }
}
</script>


<template>
    <div>GTEST component: {{ test }} </div>
</template>
