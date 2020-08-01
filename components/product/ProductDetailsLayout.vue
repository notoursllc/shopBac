<script>
export default {
    name: 'ProductDetailsLayout'
}
</script>


<template>
    <div>
        <div class="prod-container">
            <div class="is-half">
                <div class="prod-image">
                    <slot name="pics"></slot>
                </div>
            </div>

            <div class="is-half prod-info">
                <slot name="info"></slot>
            </div>
        </div>

        <div>
            <slot name="under"></slot>
        </div>
    </div>
</template>


<style lang="scss">
@import '~assets/css/components/_variables.scss';
@import "~assets/css/components/_mixins.scss";

.prod-image {
    position: relative;
}

.prod-container {
    @include flexbox();
    @include flex-wrap(wrap);
}
.is-half {
    @include flex(none);
    width: 50%;
}

.prod-info {
    padding: 0 30px;
}

@media #{$medium-and-down} {
    .prod-container {
        display: block;
    }
    .is-half {
        @include flex(1 0 auto);
        width: 100%;
    }

    .prod-info {
        padding: 0 5px;
    }
}

.social {
    margin-top: 40px;
    text-align: center;
}

@media #{$medium-and-up} {
    .social {
        margin-top: 0;
        text-align: right;
    }
}
</style>
