<script>
import { mapState } from 'vuex';

export default {
    components: {
        NavigationList: () => import('@/components/navigationList/NavigationList'),
        NavigationItem: () => import('@/components/navigationList/NavigationItem'),
        NavigationCollapse: () => import('@/components/navigationList/NavigationCollapse'),
        SvgSprite: () => import('@/components/icons/SvgSprite')
    },

    computed: {
        ...mapState({
            sidebarOpened: (state) => {
                return state.ui.sidebarOpened;
            }
        }),

        isLoggedIn() {
            return this.$store.state.ui.isAuthenticated;
        }
    },

    watch: {
        $route() {
            this.$store.dispatch('ui/CLOSE_MESSAGE_INSTANCES');
        }
    },

    mounted() {
        if (process.browser) {
            window.addEventListener('resize', this.handleResize);
        }
    },

    destroyed () {
        if (process.browser) {
            window.removeEventListener('resize', this.handleResize);
        }
    },

    methods: {
        handleResize() {
            this.$store.dispatch('ui/windowResize');
        },

        menuItemClick() {
            if(this.$store.state.ui.isMobile) {
                this.$store.dispatch('ui/closeSidebar');
            }
        },

        async logout() {
            try {
                await this.$api.tenantMembers.logout();

                this.$store.dispatch('ui/logout');

                this.$router.push({
                    name: 'tenantmember-login'
                });
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        }
    }
};
</script>

<template>
    <div class="layoutContainer">
        <svg-sprite />

        <div class="sidenav-container">
            <aside class="sidenav" :class="{'sidenav-fixed': $store.state.ui.sidebarOpened}">
                <div class="sidenav-header ptm">
                    <svg-icon icon="bv-logo" :width="60" class-name="fillWhite" />
                </div>

                <navigation-list
                    text-color="#fff"
                    active-text-color="#eec708"
                    hover-background-color="rgba(255,255,255,.1)">

                    <navigation-collapse
                        :fuzzy-route-match="['product-']">
                        <template slot="label">{{ $t('Products') }}</template>

                        <navigation-item
                            :route="{ name: 'product-list' }"
                            @click="menuItemClick">{{ $t('All products') }}</navigation-item>

                        <navigation-item
                            :route="{ name: 'product-types' }"
                            @click="menuItemClick">{{ $t('Types') }}</navigation-item>

                        <navigation-item
                            :route="{ name: 'product-sub-types' }"
                            @click="menuItemClick">{{ $t('Sub-Types') }}</navigation-item>

                        <navigation-item
                            :route="{ name: 'product-fit-types' }"
                            @click="menuItemClick">{{ $t('Fit Types') }}</navigation-item>

                        <navigation-item
                            :route="{ name: 'product-sales-channel-types' }"
                            @click="menuItemClick">{{ $t('Sales Channels') }}</navigation-item>

                        <navigation-item
                            :route="{ name: 'product-vendors' }"
                            @click="menuItemClick">{{ $t('Vendors') }}</navigation-item>

                        <navigation-item
                            :route="{ name: 'product-collections' }"
                            @click="menuItemClick">{{ $t('Collections') }}</navigation-item>

                        <navigation-item
                            :route="{ name: 'product-sku-variant-types-list' }"
                            @click="menuItemClick">{{ $t('Variant properties') }}</navigation-item>

                        <navigation-item
                            :route="{ name: 'product-datatables-list' }"
                            @click="menuItemClick">{{ $t('Data Tables') }}</navigation-item>
                    </navigation-collapse>

                    <navigation-item
                        :route="{ name: 'order-list' }"
                        @click="menuItemClick">{{ $t('Payments') }}</navigation-item>

                    <navigation-item
                        :route="{ name: 'reports' }"
                        @click="menuItemClick">{{ $t('Reports') }}</navigation-item>
                </navigation-list>
            </aside>

            <div
                class="sidenav-overlay"
                v-if="$store.state.ui.sidebarOpened"
                @click="$store.dispatch('ui/closeSidebar')"></div>
        </div>

        <header role="banner" class="header" :class="{'sidenav-opened': $store.state.ui.sidebarOpened}">
            <div class="header-container">
                <i class="colorGrayLighter fs20 cursorPointer"
                   aria-hidden="true"
                   @click="$store.dispatch('ui/toggleSidebar')">toggle sidebar</i>

                <nav class="navigation">
                    <ul class="navigation-list">
                        <li v-if="!isLoggedIn">
                            <!-- <template v-if="$auth.loggedIn">
                                {{ $auth.user.email }}
                                <el-button
                                    type="text"
                                    @click="logout"
                                    class="colorBlack">{{ $t('LOGOUT') }}</el-button>
                            </template> -->
                            <!-- <template v-else> -->
                                <nuxt-link
                                    :to="{ name: 'tenantmember-login' }"
                                    tag="a">{{ $t('Login') }}</nuxt-link>
                            <!-- </template> -->
                        </li>
                        <li v-else>
                            <a @click="logout">Logout</a>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>

        <main :class="{'sidenav-opened': $store.state.ui.sidebarOpened}">
            <div class="mainContent">
                <nuxt />
            </div>
        </main>
    </div>
</template>

<style lang="scss">
$sidenav-width: 225px;
$header-height: 50px;

@import "~assets/css/components/_variables.scss";
@import "~assets/css/components/_mixins.scss";
@import "~assets/css/components/_sidenav.scss";

// some overrides
.sidenav {
    .el-navigation-item,
    .el-submenu__title {
        height: 30px;
        line-height: 30px;
    }
}

.layoutContainer {
    header, main {
        transition: .5s;
    }

    .mainContent {
        padding: 20px 20px 100px 20px; // need some bottom padding to accommodate FAB buttons
    }

    .header {
        background-color: #fff;
        position: relative;
        color: #333;
        line-height: $header-height;
    }

    .header-container {
        @include flexbox();
        @include flex-wrap(nowrap);
        @include flex-direction(row);
        padding: 0 20px;
    }

    .navigation {
        background-color: white;
        padding: 0;
        color: #010101;
        width: auto;
        @include order(2);
        @include flex-grow(2);
        @include align-items(center);
        @include justify-content(flex-end);
        @include flexbox();
    }
}


.nav-menu-bar-container {
    > .nav-navigation-item > label {
        font-weight: 700;
    }
}

.nav-menu-bar {
    border: 0;
    list-style: none;
    position: relative;
    margin: 0;
    padding: 0;
    display: block;

    .nav-navigation-item {
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

            .nav-navigation-item-arrow {
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

        &.not-collapsed > label .nav-navigation-item-arrow {
            transform: rotateZ(180deg);
        }
    }

    .nav-navigation-item > .nav-menu-bar {
        margin-left: 10px;
    }

    label.not-collapsed .nav-navigation-item-arrow {
        transform: rotateZ(180deg);
    }

    .not-collapsed:focus,
    .collapsed:focus {
        outline: none;
    }
}
</style>
