

<script>
export default {
    props: {
        textColor: {
            type: String,
            default: '#fff'
        },

        activeTextColor: {
            type: String,
            default: null
        },

        hoverBackgroundColor: {
            type: String,
            default: null
        },
    },

    provide() {
        return {
            menuListState: this.sharedState
        };
    },

    data() {
        return {
            sharedState: {
                activeItem: 1,
                activeTextColor: this.activeTextColor,
                hoverBackgroundColor: this.hoverBackgroundColor,
                textColor: this.textColor
            }
        };
    }
};
</script>


<template>
    <ul class="menu-list menu-list-container" :style="{color: textColor || 'inherit'}">
        <slot></slot>
    </ul>
</template>


<style lang="scss">
.menu-list-container > .menu-item > label {
    font-weight: 700;
}

.menu-list {
    border: 0;
    list-style: none;
    position: relative;
    margin: 0;
    padding: 0;
    display: block;

    .menu-item {
        list-style: none;
        margin: 0;
        padding: 0;

        label * {
            vertical-align: middle;
        }

        label {
            height: 30px;
            line-height: 30px;
            padding: 0 20px;
            font-size: 14px;
            position: relative;
            white-space: nowrap;
            cursor: pointer;
            box-sizing: border-box;
            transition: border-color .3s, background-color .3s, color .3s;
            display: block;

            .menu-item-arrow {
                position: absolute;
                top: 50%;
                right: 20px;
                margin-top: -7px;
                transition: transform .3s;
                font-size: 12px;
                line-height: 1;
                display: inline-block;
            }
        }

        &.not-collapsed > label .menu-item-arrow {
            transform: rotateZ(180deg);
        }

        .is-active {
        }
        .is-disabled,
        .is-disabled label {
            cursor: not-allowed !important;
        }
    }

    .menu-item > .menu-list {
        margin-left: 10px;
    }

    label.not-collapsed .menu-item-arrow {
        transform: rotateZ(180deg);
    }

    .not-collapsed:focus,
    .collapsed:focus {
        outline: none;
    }
}
</style>
