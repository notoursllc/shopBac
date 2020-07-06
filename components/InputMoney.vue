<script>
import Vue from 'vue';
import { Money } from 'v-money';
import accounting from 'accounting';
import { isNumeric } from '@/utils/common';

// register directive v-money and component <money>
// Vue.use(money, {precision: 2})

export default{
    components: {
        Money
    },

    props: {
        value: {
            type: Number,
            default: 0
        },

        maxlength: {
            type: Number,
            default: 14
        }
    },


    data: function() {
        return {
            selectedPrice: null,
            money: {
                decimal: '.',
                thousands: ',',
                prefix: '$  ',
                suffix: '',
                precision: 2,
                masked: false
            }
        };
    },

    watch: {
        value: {
            handler(newVal) {
                const val = parseInt(newVal);
                const cleanVal = isNumeric(val) ? val : 0;
                this.selectedPrice = cleanVal > 0 ? cleanVal/100 : 0;
            },
            immediate: true
        }
    },

    methods: {
        emitInput(val) {
            let clean = val ? val.toString().replace(new RegExp(this.money.thousands, 'g'), '') : 0;
            clean = accounting.toFixed(parseFloat(clean) * 100, 0);
            this.$emit('input', parseInt(clean, 10));
        }
    }
};
</script>


<template>
    <div class="el-input">
        <money
            v-model="selectedPrice"
            v-bind="money"
            @input="emitInput"
            class="form-control"
            :maxlength="maxlength"></money>
    </div>
</template>
