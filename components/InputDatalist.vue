<script>
import uuid from 'uuid';

/**
 * The HTML5 <datalist> element contains a set of <option> elements that represent
 * the permissible or recommended options available to choose from within other controls.
 * The user is also able to type their own value.  Because of this, <datalist> <option> elements
 * do allow for a "label" and separate "value" like <select> <option> elements do, because
 * it is impossible to know the "value" of the user-provided "label".
 *
 * This component takes a hybrid approach.   It takes an "options" property (array of objects with
 * 'label' and 'value' properties).  If the selected option (label) has a value within the options property,
 * then that value is returned, otherwise the label is returned.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist
 */

export default {
    inheritAttrs: false,

    props: {
        value: {
            type: String,
            default: null
        },

        options: {
            type: Array,
            required: true
        }
    },

    data: function() {
        return {
            selectedLabel: null,
            targetId: uuid()
        };
    },

    watch: {
        value: {
            handler(newVal) {
                let label;

                this.options.forEach((obj) => {
                    if(obj.value === newVal) {
                        label = obj.label;
                    }
                });

                this.selectedLabel = label || newVal;
            },
            immediate: true
        }
    },

    methods: {
        onValueChange(label) {
            let val;

            this.options.forEach((obj) => {
                if(obj.label === label) {
                    val = obj.value;
                }
            });

            this.selectedLabel = label;
            this.$emit('input', val || label);
        }
    }
};
</script>


<template>
    <div class="inlineBlock">
        <b-form-input
            :list="targetId"
            v-model="selectedLabel"
            @input="onValueChange"
            v-bind="$attrs"></b-form-input>

        <datalist :id="targetId">
            <option
                v-for="(opt, index) in options"
                :key="index">{{ opt.label }}</option>
        </datalist>
    </div>
</template>
