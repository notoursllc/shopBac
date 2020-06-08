export default {
    methods: {
        setCartAndTokenStateFromResponse(response) {
            this.$store.dispatch('shoppingcart/CART_SET', response.data.data);
            this.$store.dispatch('shoppingcart/CART_TOKEN_SET', response.headers['x-cart-token']);
            return response.data.data;
        },

        getFormattedShippingName(firstName, lastName) {
            const val = [];

            if(firstName) {
                val.push(firstName);
            }

            if(lastName) {
                val.push(lastName);
            }

            return val.join(' ');
        },


        getFormattedCityStateZip(city, state, postalCode) {
            const val = [];

            if(city) {
                val.push(city);
            }

            if(state || postalCode) {
                val.push(',');

                if(state) {
                    val.push(' ' + state);
                }

                if(postalCode) {
                    val.push(' ' + postalCode);
                }
            }

            return val.join('');
        }
    }
};
