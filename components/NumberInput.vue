<script>
import isFinite from 'lodash.isfinite';
import { isString, isNumber } from '@/utils/common';

export default {
    name: 'NumberInput',

    props: {
        value: {
            type: [Number, String],
            default: null
        },

        max: {
            type: Number,
            default: null
        },

        min: {
            type: Number,
            default: null
        },

        step: {
            type: Number,
            default: 1
        },

        size: {
            type: String,
            required: false,
            default: 'md'
        }
    },

    data() {
        return {
            selectedVal: this.min
        };
    },

    computed: {
        plusDisabled() {
            return isFinite(this.max) && parseFloat(this.selectedVal) >= this.max;
        },
        minusDisabled() {
            return isFinite(this.min) && parseFloat(this.selectedVal) <= this.min;
        },
        styleMinWidth() {
            const stringVal = this.selectedVal + '';
            return stringVal.length > 3 ? '65px' : '55px';
        }
    },

    watch: {
        value: {
            handler(newVal) {
                if(newVal != null) {
                    const isFirstCall = this.selectedVal === null;
                    this.setValue(newVal, false);

                    if(!isFirstCall) {
                        this.emitVal();
                    }
                }
            },
            immediate: true
        }
    },

    methods: {

        /*
        * fixes an issue when adding floating point numbers: .01 + .05 = 0.060000000000000005
        * https://stackoverflow.com/questions/588004/is-floating-point-math-broken/51723472#51723472
        */
        floatify(number) {
            if(number) {
                if(!isNumber(number)) {
                    number = parseFloat(number);
                }
                return parseFloat(number).toFixed(10);
            }
        },

        emitVal() {
            if(this.selectedVal !== this.value) {
                this.$emit('input', parseFloat(this.selectedVal));
            }
        },

        up() {
            this.setValue(
                this.floatify(this.selectedVal + this.step)
            );
        },

        down() {
            this.setValue(
                this.floatify(this.selectedVal - this.step)
            );
        },

        setValue(newVal, emit) {
            const val = isNaN(newVal) ? this.min : newVal;

            if(this.max && (val > this.max)) {
                this.selectedVal = this.max;
            }
            else if(this.min && (val < this.min)) {
                this.selectedVal = this.min;
            }
            else {
                this.selectedVal = val;
            }

            if(emit !== false) {
                this.emitVal();
            }
        }
    }
};
</script>


<template>
    <b-input-group class="num-input-wrapper">
        <template v-slot:prepend>
            <b-button
                variant="outline-secondary"
                :size="size"
                @click="down"
                :disabled="minusDisabled"
                tabindex="-1">
                <svg-icon icon="minus" width="16" height="16" />
            </b-button>
        </template>

        <b-form-input
            v-model="selectedVal"
            @change="setValue"
            type="number"
            :min="min"
            :max="max"
            :step="step"
            :size="size"
            class="num-input"
            :style="{minWidth: styleMinWidth}"></b-form-input>

        <template v-slot:append>
            <b-button
                variant="outline-secondary"
                :size="size"
                :disabled="plusDisabled"
                @click="up"
                tabindex="-1">
                <svg-icon icon="plus" width="16" height="16" />
            </b-button>
        </template>

    </b-input-group>
</template>


<style lang="scss">
.num-input-wrapper {
    flex-wrap: nowrap;

    .num-input {
        text-align: center;
        padding: 0.375rem 0.175rem;
    }
}
</style>

