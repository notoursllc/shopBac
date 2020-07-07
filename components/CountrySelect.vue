<script>
import isObject from 'lodash.isobject';

// NOTE: this object can not be formatted as { US: "United States of America (USA)" }
// because there are some duplicate 'alpha2' values, like Puerto Rico
// Also, in order the avoid duplicate <option value> values in the select element,
// I added a space after any duplicate 'alpha2' values in order to differentiate it.
// Without that extra space the last of the duplicate values will be displayed as the
// selected value.  For example, "Puerto Rico" will always be displayed for the "US" value.
// I hope this works.
// DATA SOURCE:  http://www.fedex.com/gb/tracking/codes.html

export default {
    components: {
        VueSelect2: () => import('@/components/VueSelect2')
    },

    inheritAttrs: false,

    props: {
        value: {
            type: String,
            default: null
        }
    },

    data() {
        return {
            selectedCountry: null,
            countryList: [
                {alpha2: 'US', name: this.$t('United States of America (USA)')},
                {alpha2: 'CA', name: this.$t('Canada')},
                {alpha2: 'GB', name: this.$t('Great Britain')},
                {alpha2: 'AD', name: this.$t('Andorra')},
                {alpha2: 'AE', name: this.$t('United Arab Emirates')},
                {alpha2: 'AF', name: this.$t('Afghanistan')},
                {alpha2: 'AG', name: this.$t('Barbuda')},
                {alpha2: 'AI', name: this.$t('Anguilla')},
                {alpha2: 'AL', name: this.$t('Albania')},
                {alpha2: 'AM', name: this.$t('Armenia')},
                {alpha2: 'AO', name: this.$t('Angola')},
                {alpha2: 'AR', name: this.$t('Argentina')},
                {alpha2: 'AS', name: this.$t('American Samoa')},
                {alpha2: 'AT', name: this.$t('Austria')},
                {alpha2: 'AU', name: this.$t('Australia')},
                {alpha2: 'AW', name: this.$t('Aruba')},
                {alpha2: 'AZ', name: this.$t('Azerbaijan')},
                {alpha2: 'BA', name: this.$t('Bosnia-Herzegovina')},
                {alpha2: 'BB', name: this.$t('Barbados')},
                {alpha2: 'BD', name: this.$t('Bangladesh')},
                {alpha2: 'BE', name: this.$t('Belgium')},
                {alpha2: 'BF', name: this.$t('Burkina Faso')},
                {alpha2: 'BG', name: this.$t('Bulgaria')},
                {alpha2: 'BH', name: this.$t('Bahrain')},
                {alpha2: 'BI', name: this.$t('Burundi')},
                {alpha2: 'BJ', name: this.$t('Benin')},
                {alpha2: 'BM', name: this.$t('Bermuda')},
                {alpha2: 'BN', name: this.$t('Brunei')},
                {alpha2: 'BO', name: this.$t('Bolivia')},
                {alpha2: 'BQ', name: this.$t('St. Eustatius')},
                {alpha2: 'BR', name: this.$t('Brazil')},
                {alpha2: 'BS', name: this.$t('Bahamas')},
                {alpha2: 'BT', name: this.$t('Bhutan')},
                {alpha2: 'BW', name: this.$t('Botswana')},
                {alpha2: 'BY', name: this.$t('Belarus')},
                {alpha2: 'BZ', name: this.$t('Belize')},
                {alpha2: 'CD', name: this.$t('Congo, Dem. Rep. of')},
                {alpha2: 'CG', name: this.$t('Congo')},
                {alpha2: 'CH', name: this.$t('Switzerland')},
                {alpha2: 'CI', name: this.$t('Ivory Coast')},
                {alpha2: 'CK', name: this.$t('Cook Islands')},
                {alpha2: 'CL', name: this.$t('Chile')},
                {alpha2: 'CM', name: this.$t('Cameroon')},
                {alpha2: 'CN', name: this.$t('China')},
                {alpha2: 'CO', name: this.$t('Colombia')},
                {alpha2: 'CR', name: this.$t('Costa Rica')},
                {alpha2: 'CS', name: this.$t('Serbia and Montenegro')},
                {alpha2: 'CV', name: this.$t('Cape Verde')},
                {alpha2: 'CW', name: this.$t('Curacao')},
                {alpha2: 'CY', name: this.$t('Cyprus')},
                {alpha2: 'CZ', name: this.$t('Czech Republic')},
                {alpha2: 'DE', name: this.$t('Germany')},
                {alpha2: 'DJ', name: this.$t('Djibouti')},
                {alpha2: 'DK', name: this.$t('Denmark')},
                {alpha2: 'DM', name: this.$t('Dominica')},
                {alpha2: 'DO', name: this.$t('Dominican Republic')},
                {alpha2: 'DZ', name: this.$t('Algeria')},
                {alpha2: 'EC', name: this.$t('Ecuador')},
                {alpha2: 'EE', name: this.$t('Estonia')},
                {alpha2: 'EG', name: this.$t('Egypt')},
                {alpha2: 'ER', name: this.$t('Eritrea')},
                {alpha2: 'ES', name: this.$t('Spain')},
                {alpha2: 'ET', name: this.$t('Ethiopia')},
                {alpha2: 'FI', name: this.$t('Finland')},
                {alpha2: 'FJ', name: this.$t('Fiji')},
                {alpha2: 'FM', name: this.$t('Micronesia')},
                {alpha2: 'FO', name: this.$t('Faeroe Islands')},
                {alpha2: 'FR', name: this.$t('France')},
                {alpha2: 'GA', name: this.$t('Gabon')},
                {alpha2: 'GD', name: this.$t('Grenada')},
                {alpha2: 'GE', name: this.$t('Georgia, Republic of')},
                {alpha2: 'GF', name: this.$t('French Guiana')},
                {alpha2: 'GH', name: this.$t('Ghana')},
                {alpha2: 'GI', name: this.$t('Gibraltar')},
                {alpha2: 'GL', name: this.$t('Greenland')},
                {alpha2: 'GM', name: this.$t('Gambia')},
                {alpha2: 'GN', name: this.$t('Guinea')},
                {alpha2: 'GP', name: this.$t('St. Barthelemy')},
                {alpha2: 'GR', name: this.$t('Greece')},
                {alpha2: 'GT', name: this.$t('Guatemala')},
                {alpha2: 'GU', name: this.$t('Guam')},
                {alpha2: 'GY', name: this.$t('Guyana')},
                {alpha2: 'HK', name: this.$t('Hong Kong')},
                {alpha2: 'HN', name: this.$t('Honduras')},
                {alpha2: 'HR', name: this.$t('Croatia')},
                {alpha2: 'HT', name: this.$t('Haiti')},
                {alpha2: 'HU', name: this.$t('Hungary')},
                {alpha2: 'ID', name: this.$t('Indonesia')},
                {alpha2: 'IE', name: this.$t('Ireland, Republic of')},
                {alpha2: 'IL', name: this.$t('Israel')},
                {alpha2: 'IN', name: this.$t('India')},
                {alpha2: 'IQ', name: this.$t('Iraq')},
                {alpha2: 'IS', name: this.$t('Iceland')},
                {alpha2: 'IT', name: this.$t('Vatican')},
                {alpha2: 'JM', name: this.$t('Jamaica')},
                {alpha2: 'JO', name: this.$t('Jordan')},
                {alpha2: 'JP', name: this.$t('Japan')},
                {alpha2: 'KE', name: this.$t('Kenya')},
                {alpha2: 'KG', name: this.$t('Kyrgyzstan')},
                {alpha2: 'KH', name: this.$t('Cambodia')},
                {alpha2: 'KN', name: this.$t('St. Kitts and Nevis')},
                {alpha2: 'KR', name: this.$t('Korea, South')},
                {alpha2: 'KW', name: this.$t('Kuwait')},
                {alpha2: 'KY', name: this.$t('Cayman Islands')},
                {alpha2: 'KZ', name: this.$t('Kazakhstan')},
                {alpha2: 'LA', name: this.$t('Laos')},
                {alpha2: 'LB', name: this.$t('Lebanon')},
                {alpha2: 'LC', name: this.$t('St. Lucia')},
                {alpha2: 'LI', name: this.$t('Liechtenstein')},
                {alpha2: 'LK', name: this.$t('Sri Lanka')},
                {alpha2: 'LR', name: this.$t('Liberia')},
                {alpha2: 'LS', name: this.$t('Lesotho')},
                {alpha2: 'LT', name: this.$t('Lithuania')},
                {alpha2: 'LU', name: this.$t('Luxembourg')},
                {alpha2: 'LV', name: this.$t('Latvia')},
                {alpha2: 'LY', name: this.$t('Libya')},
                {alpha2: 'MA', name: this.$t('Morocco')},
                {alpha2: 'MC', name: this.$t('Monaco')},
                {alpha2: 'MD', name: this.$t('Moldova')},
                {alpha2: 'MF', name: this.$t('St. Martin')},
                {alpha2: 'MG', name: this.$t('Madagascar')},
                {alpha2: 'MH', name: this.$t('Marshall Islands')},
                {alpha2: 'MK', name: this.$t('Macedonia')},
                {alpha2: 'ML', name: this.$t('Mali')},
                {alpha2: 'MN', name: this.$t('Mongolia')},
                {alpha2: 'MO', name: this.$t('Macau')},
                {alpha2: 'MP', name: this.$t('Saipan')},
                {alpha2: 'MQ', name: this.$t('Martinique')},
                {alpha2: 'MR', name: this.$t('Mauritania')},
                {alpha2: 'MS', name: this.$t('Montserrat')},
                {alpha2: 'MT', name: this.$t('Malta')},
                {alpha2: 'MU', name: this.$t('Mauritius')},
                {alpha2: 'MV', name: this.$t('Maldives, Republic of')},
                {alpha2: 'MW', name: this.$t('Malawi')},
                {alpha2: 'MX', name: this.$t('Mexico')},
                {alpha2: 'MY', name: this.$t('Malaysia')},
                {alpha2: 'MZ', name: this.$t('Mozambique')},
                {alpha2: 'NA', name: this.$t('Namibia')},
                {alpha2: 'NC', name: this.$t('New Caledonia')},
                {alpha2: 'NE', name: this.$t('Niger')},
                {alpha2: 'NG', name: this.$t('Nigeria')},
                {alpha2: 'NI', name: this.$t('Nicaragua')},
                {alpha2: 'NL', name: this.$t('Netherlands')},
                {alpha2: 'NO', name: this.$t('Norway')},
                {alpha2: 'NP', name: this.$t('Nepal')},
                {alpha2: 'NZ', name: this.$t('New Zealand')},
                {alpha2: 'OM', name: this.$t('Oman')},
                {alpha2: 'PA', name: this.$t('Panama')},
                {alpha2: 'PE', name: this.$t('Peru')},
                {alpha2: 'PF', name: this.$t('French Polynesia')},
                {alpha2: 'PG', name: this.$t('Papua New Guinea')},
                {alpha2: 'PH', name: this.$t('Philippines')},
                {alpha2: 'PK', name: this.$t('Pakistan')},
                {alpha2: 'PL', name: this.$t('Poland')},
                {alpha2: 'PS', name: this.$t('Palestine')},
                {alpha2: 'PT', name: this.$t('Portugal')},
                {alpha2: 'PW', name: this.$t('Palau')},
                {alpha2: 'PY', name: this.$t('Paraguay')},
                {alpha2: 'US ', name: this.$t('Puerto Rico')}, // NOTE: extra space after 'US' is intentional.  See note above.
                {alpha2: 'QA', name: this.$t('Qatar')},
                {alpha2: 'RE', name: this.$t('Reunion')},
                {alpha2: 'RO', name: this.$t('Romania')},
                {alpha2: 'RU', name: this.$t('Russia')},
                {alpha2: 'RW', name: this.$t('Rwanda')},
                {alpha2: 'SA', name: this.$t('Saudi Arabia')},
                {alpha2: 'SC', name: this.$t('Seychelles')},
                {alpha2: 'SE', name: this.$t('Sweden')},
                {alpha2: 'SG', name: this.$t('Singapore')},
                {alpha2: 'SI', name: this.$t('Slovenia')},
                {alpha2: 'SK', name: this.$t('Slovak Republic')},
                {alpha2: 'SN', name: this.$t('Senegal')},
                {alpha2: 'SR', name: this.$t('Suriname')},
                {alpha2: 'SV', name: this.$t('El Salvador')},
                {alpha2: 'SX', name: this.$t('St. Maarten​')},
                {alpha2: 'SY', name: this.$t('Syria')},
                {alpha2: 'SZ', name: this.$t('Swaziland')},
                {alpha2: 'TC', name: this.$t('Turks and Caicos Islands')},
                {alpha2: 'TD', name: this.$t('Chad')},
                {alpha2: 'TG', name: this.$t('Togo')},
                {alpha2: 'TH', name: this.$t('Thailand')},
                {alpha2: 'TL', name: this.$t('East Timor')},
                {alpha2: 'TN', name: this.$t('Tunisia')},
                {alpha2: 'TO', name: this.$t('Tonga')},
                {alpha2: 'TR', name: this.$t('Turkey')},
                {alpha2: 'TT', name: this.$t('Trinidad and Tobago')},
                {alpha2: 'TW', name: this.$t('Taiwan')},
                {alpha2: 'TZ', name: this.$t('Tanzania')},
                {alpha2: 'UA', name: this.$t('Ukraine')},
                {alpha2: 'UG', name: this.$t('Uganda')},
                {alpha2: 'UY', name: this.$t('Uruguay')},
                {alpha2: 'UZ', name: this.$t('Uzbekistan')},
                {alpha2: 'VC', name: this.$t('St. Vincent')},
                {alpha2: 'VE', name: this.$t('Venezuela')},
                {alpha2: 'VG', name: this.$t('British Virgin Islands')},
                {alpha2: 'VI', name: this.$t('U.S. Virgin Islands')},
                {alpha2: 'VN', name: this.$t('Vietnam')},
                {alpha2: 'VU', name: this.$t('Vanuatu')},
                {alpha2: 'WF', name: this.$t('Wallis & Futuna Islands')},
                {alpha2: 'WS', name: this.$t('Samoa')},
                {alpha2: 'YE', name: this.$t('Yemen, The Republic of')},
                {alpha2: 'ZA', name: this.$t('South African Republic')},
                {alpha2: 'ZM', name: this.$t('Zambia')},
                {alpha2: 'ZW', name: this.$t('Zimbabwe')}
            ]
        };
    },

    watch: {
        value: {
            handler(newVal) {
                this.selectedCountry = this.getCountryObj(newVal);
            },
            immediate: true
        }
    },

    methods: {
        getCountryObj(alpha2) {
            return this.countryList.find((obj) => obj.alpha2 === alpha2);
        },

        onChange(obj) {
            this.$emit(
                'input',
                isObject(obj) ? obj.alpha2 : null
            );
        }
    }
};
</script>


<template>
    <vue-select2
        v-model="selectedCountry"
        :options="countryList"
        label="name"
        @input="onChange"
        v-bind="$attrs">
    </vue-select2>
</template>
