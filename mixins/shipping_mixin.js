export default {
    methods: {
        getShippingParcelDistanceUnits() {
            return [
                'cm',
                'in',
                'ft',
                'mm',
                'm',
                'yd'
            ];
        },

        getShippingParcelMassUnits() {
            return [
                'g',
                'oz',
                'lb',
                'kg'
            ];
        }
    }
};
