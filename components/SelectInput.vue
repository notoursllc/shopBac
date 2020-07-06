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
    components: {
        Pop: () => import('@/components/Pop')
    },

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
            uuid: uuid(),
            popoverVisible: false
        };
    },

    computed: {
        popoverTargetId() {
            return `popover-target-${this.uuid}`;
        }
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
        emitValue(val) {
            this.$emit('input', val);
        },

        onValueChange(label) {
            console.log("ON VALUE CHANGE", label);
            let val;

            this.options.forEach((obj) => {
                if(obj.label === label) {
                    val = obj.value;
                }
            });

            this.selectedLabel = label;
            this.emitValue(val || label);
        },

        selectOption(opt) {
            console.log("SELECT OPT", opt)
            this.selectedLabel = opt.label;
            this.emitValue(opt.value);
            this.popoverVisible = false;
        },

        onBlur() {
            this.popoverVisible = false;
        },

        onFocus() {
            this.popoverVisible = true;
        },

        onPopoverReady() {
            const ref = Array.isArray(this.$refs.opt0) ? this.$refs.opt0[0] : this.$refs.opt0;
            console.log("ON READY", ref);
            ref.focus();
        },

        onKeyDown() {
            this.popoverVisible = true;
        }
    }
};
</script>


<template>
    <div class="inlineBlock">
        <b-form-input
            :ref="popoverTargetId"
            :id="popoverTargetId"
            v-model="selectedLabel"
            @input="onValueChange"
            @click="popoverVisible = !popoverVisible"
            @blur="onBlur"
            @focus="onFocus"
            @keydown.down="onKeyDown"
            v-bind="$attrs"
            size="sm"
            class="width100"></b-form-input>

        <b-popover
            :target="popoverTargetId"
            :show.sync="popoverVisible"
            @shown="onPopoverReady()"
            placement="auto">
            <!-- <b-button
                variant="primary"
                size="sm"
                v-for="(opt, index) in options"
                :ref="`opt${index}`"
                :key="index"
                @click="selectOption(opt)"
                @keydown.enter="selectOption(opt)"
                class="popItem">{{ opt.label }}</b-button> -->
            <!-- <div
                v-for="(opt, index) in options"
                :ref="`opt${index}`"
                :key="index"
                @click="selectOption(opt)"
                @keydown.enter="selectOption(opt)"
                class="popItem">{{ opt.label }}</div> -->
        </b-popover>
    </div>
</template>

<style lang="scss">
.popItem {
    padding: 3px 5px;
    white-space: nowrap;
    cursor: pointer;
    display: block;
    width: 100%;
}
.popItem:focus {
    background-color: #80bdff;
    border-color: #80bdff !important;
}
</style>
