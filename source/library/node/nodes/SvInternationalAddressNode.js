"use strict";

/**
 * @module library.node.nodes
 * @class SvInternationalAddressNode
 * @extends SvSummaryNode
 * @classdesc A ship-to address. Shared by print jobs (books, miniatures).
 * Not an AI tool parameter — every slot is out of the JSON schema.
 */

(class SvInternationalAddressNode extends SvSummaryNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setLabel("Name");
            slot.setShouldStoreSlot(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setIsInJsonSchema(false);
        }
        {
            const slot = this.newSlot("street1", "");
            slot.setSlotType("String");
            slot.setLabel("Street");
            slot.setShouldStoreSlot(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setIsInJsonSchema(false);
        }
        {
            const slot = this.newSlot("street2", "");
            slot.setSlotType("String");
            slot.setLabel("Street 2");
            slot.setShouldStoreSlot(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setIsInJsonSchema(false);
        }
        {
            const slot = this.newSlot("city", "");
            slot.setSlotType("String");
            slot.setLabel("City");
            slot.setShouldStoreSlot(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setIsInJsonSchema(false);
        }
        {
            const slot = this.newSlot("state", "");
            slot.setSlotType("String");
            slot.setLabel("State / region");
            slot.setShouldStoreSlot(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setIsInJsonSchema(false);
        }
        {
            const slot = this.newSlot("postalCode", "");
            slot.setSlotType("String");
            slot.setLabel("Postal code");
            slot.setShouldStoreSlot(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setIsInJsonSchema(false);
        }
        {
            const slot = this.newSlot("country", "US");
            slot.setSlotType("String");
            slot.setLabel("Country");
            slot.setShouldStoreSlot(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setAllowsMultiplePicks(false);
            slot.setValidItems(this.countryItems());
            slot.setIsInJsonSchema(false);
        }
        {
            const slot = this.newSlot("phone", "");
            slot.setSlotType("String");
            slot.setLabel("Phone");
            slot.setShouldStoreSlot(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setIsInJsonSchema(false);
        }
    }

    initPrototype () {
        this.setTitle("Shipping address");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanEditTitle(false);
        this.setCanDelete(false);
    }

    summary () {
        return this.postalLines().join("\n");
    }

    subtitle () {
        const issues = this.issues();
        if (issues.length === 0) {
            return this.summary();
        }
        if (issues.length > 2) {
            return "incomplete";
        }
        return issues.join("\n");
    }

    postalLines () {
        return this.presentParts([
            this.name(),
            this.street1(),
            this.street2(),
            this.cityLine(),
            this.countryName()
        ]);
    }

    cityLine () {
        const cityState = this.presentParts([this.city(), this.state()]).join(", ");
        return this.presentParts([cityState, this.postalCode()]).join(" ");
    }

    presentParts (values) {
        return values.map(s => String(s || "").trim()).filter(s => s.length > 0);
    }

    trimmedValue (value) {
        return String(value || "").trim();
    }

    nameIssue () {
        return this.trimmedValue(this.name()) ? "" : "missing name";
    }

    street1Issue () {
        return this.trimmedValue(this.street1()) ? "" : "missing street";
    }

    street2Issue () {
        return "";
    }

    cityIssue () {
        return this.trimmedValue(this.city()) ? "" : "missing city";
    }

    stateIssue () {
        const state = this.trimmedValue(this.state());
        if (this.requiresState() && !state) {
            return "missing state";
        }
        if (this.trimmedValue(this.country()) === "US" && state && !/^[A-Za-z]{2}$/.test(state)) {
            return "invalid state";
        }
        return "";
    }

    postalCodeIssue () {
        const postal = this.trimmedValue(this.postalCode());
        if (!postal) {
            return "missing postal code";
        }
        if (!this.postalCodeMatchesCountry(postal)) {
            return "invalid postal code";
        }
        return "";
    }

    countryIssue () {
        const code = this.trimmedValue(this.country());
        if (!code) {
            return "missing country";
        }
        if (!this.countryItems().detect(item => item.value === code)) {
            return "invalid country";
        }
        return "";
    }

    phoneIssue () {
        const phone = this.trimmedValue(this.phone());
        if (!phone) {
            return "";
        }
        const digits = phone.replace(/[^\d+]/g, "");
        return /^\+?\d{7,15}$/.test(digits) ? "" : "invalid phone";
    }

    issues () {
        return [
            this.nameIssue(),
            this.street1Issue(),
            this.street2Issue(),
            this.cityIssue(),
            this.stateIssue(),
            this.postalCodeIssue(),
            this.countryIssue(),
            this.phoneIssue()
        ].filter(s => s && s.length);
    }

    issuesString () {
        return this.issues().join("\n");
    }

    isValid () {
        return this.issues().length === 0;
    }

    requiresState () {
        return ["US", "CA", "AU"].includes(this.trimmedValue(this.country()));
    }

    postalCodeMatchesCountry (postal) {
        const country = this.trimmedValue(this.country());
        if (country === "US") {
            return /^\d{5}(-\d{4})?$/.test(postal);
        }
        if (country === "CA") {
            return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(postal);
        }
        return postal.length >= 2 && postal.length <= 12;
    }

    countryName () {
        const code = this.trimmedValue(this.country());
        const item = this.countryItems().detect(entry => entry.value === code);
        return item ? item.subtitle : code;
    }

    countryItems () {
        return this.countryPairs().map(pair => {
            return { value: pair[0], label: pair[0], subtitle: pair[1] };
        });
    }

    countryPairs () {
        return [
            ["US", "United States"],
            ["AF", "Afghanistan"],
            ["AX", "Åland Islands"],
            ["AL", "Albania"],
            ["DZ", "Algeria"],
            ["AS", "American Samoa"],
            ["AD", "Andorra"],
            ["AO", "Angola"],
            ["AI", "Anguilla"],
            ["AQ", "Antarctica"],
            ["AG", "Antigua and Barbuda"],
            ["AR", "Argentina"],
            ["AM", "Armenia"],
            ["AW", "Aruba"],
            ["AU", "Australia"],
            ["AT", "Austria"],
            ["AZ", "Azerbaijan"],
            ["BS", "Bahamas"],
            ["BH", "Bahrain"],
            ["BD", "Bangladesh"],
            ["BB", "Barbados"],
            ["BY", "Belarus"],
            ["BE", "Belgium"],
            ["BZ", "Belize"],
            ["BJ", "Benin"],
            ["BM", "Bermuda"],
            ["BT", "Bhutan"],
            ["BO", "Bolivia"],
            ["BQ", "Bonaire, Sint Eustatius and Saba"],
            ["BA", "Bosnia and Herzegovina"],
            ["BW", "Botswana"],
            ["BV", "Bouvet Island"],
            ["BR", "Brazil"],
            ["IO", "British Indian Ocean Territory"],
            ["BN", "Brunei Darussalam"],
            ["BG", "Bulgaria"],
            ["BF", "Burkina Faso"],
            ["BI", "Burundi"],
            ["CV", "Cabo Verde"],
            ["KH", "Cambodia"],
            ["CM", "Cameroon"],
            ["CA", "Canada"],
            ["KY", "Cayman Islands"],
            ["CF", "Central African Republic"],
            ["TD", "Chad"],
            ["CL", "Chile"],
            ["CN", "China"],
            ["CX", "Christmas Island"],
            ["CC", "Cocos (Keeling) Islands"],
            ["CO", "Colombia"],
            ["KM", "Comoros"],
            ["CG", "Congo"],
            ["CD", "Congo, Democratic Republic of the"],
            ["CK", "Cook Islands"],
            ["CR", "Costa Rica"],
            ["CI", "Côte d'Ivoire"],
            ["HR", "Croatia"],
            ["CU", "Cuba"],
            ["CW", "Curaçao"],
            ["CY", "Cyprus"],
            ["CZ", "Czechia"],
            ["DK", "Denmark"],
            ["DJ", "Djibouti"],
            ["DM", "Dominica"],
            ["DO", "Dominican Republic"],
            ["EC", "Ecuador"],
            ["EG", "Egypt"],
            ["SV", "El Salvador"],
            ["GQ", "Equatorial Guinea"],
            ["ER", "Eritrea"],
            ["EE", "Estonia"],
            ["SZ", "Eswatini"],
            ["ET", "Ethiopia"],
            ["FK", "Falkland Islands"],
            ["FO", "Faroe Islands"],
            ["FJ", "Fiji"],
            ["FI", "Finland"],
            ["FR", "France"],
            ["GF", "French Guiana"],
            ["PF", "French Polynesia"],
            ["TF", "French Southern Territories"],
            ["GA", "Gabon"],
            ["GM", "Gambia"],
            ["GE", "Georgia"],
            ["DE", "Germany"],
            ["GH", "Ghana"],
            ["GI", "Gibraltar"],
            ["GR", "Greece"],
            ["GL", "Greenland"],
            ["GD", "Grenada"],
            ["GP", "Guadeloupe"],
            ["GU", "Guam"],
            ["GT", "Guatemala"],
            ["GG", "Guernsey"],
            ["GN", "Guinea"],
            ["GW", "Guinea-Bissau"],
            ["GY", "Guyana"],
            ["HT", "Haiti"],
            ["HM", "Heard Island and McDonald Islands"],
            ["VA", "Holy See"],
            ["HN", "Honduras"],
            ["HK", "Hong Kong"],
            ["HU", "Hungary"],
            ["IS", "Iceland"],
            ["IN", "India"],
            ["ID", "Indonesia"],
            ["IR", "Iran"],
            ["IQ", "Iraq"],
            ["IE", "Ireland"],
            ["IM", "Isle of Man"],
            ["IL", "Israel"],
            ["IT", "Italy"],
            ["JM", "Jamaica"],
            ["JP", "Japan"],
            ["JE", "Jersey"],
            ["JO", "Jordan"],
            ["KZ", "Kazakhstan"],
            ["KE", "Kenya"],
            ["KI", "Kiribati"],
            ["KP", "Korea, Democratic People's Republic of"],
            ["KR", "Korea, Republic of"],
            ["KW", "Kuwait"],
            ["KG", "Kyrgyzstan"],
            ["LA", "Lao People's Democratic Republic"],
            ["LV", "Latvia"],
            ["LB", "Lebanon"],
            ["LS", "Lesotho"],
            ["LR", "Liberia"],
            ["LY", "Libya"],
            ["LI", "Liechtenstein"],
            ["LT", "Lithuania"],
            ["LU", "Luxembourg"],
            ["MO", "Macao"],
            ["MG", "Madagascar"],
            ["MW", "Malawi"],
            ["MY", "Malaysia"],
            ["MV", "Maldives"],
            ["ML", "Mali"],
            ["MT", "Malta"],
            ["MH", "Marshall Islands"],
            ["MQ", "Martinique"],
            ["MR", "Mauritania"],
            ["MU", "Mauritius"],
            ["YT", "Mayotte"],
            ["MX", "Mexico"],
            ["FM", "Micronesia"],
            ["MD", "Moldova"],
            ["MC", "Monaco"],
            ["MN", "Mongolia"],
            ["ME", "Montenegro"],
            ["MS", "Montserrat"],
            ["MA", "Morocco"],
            ["MZ", "Mozambique"],
            ["MM", "Myanmar"],
            ["NA", "Namibia"],
            ["NR", "Nauru"],
            ["NP", "Nepal"],
            ["NL", "Netherlands"],
            ["NC", "New Caledonia"],
            ["NZ", "New Zealand"],
            ["NI", "Nicaragua"],
            ["NE", "Niger"],
            ["NG", "Nigeria"],
            ["NU", "Niue"],
            ["NF", "Norfolk Island"],
            ["MK", "North Macedonia"],
            ["MP", "Northern Mariana Islands"],
            ["NO", "Norway"],
            ["OM", "Oman"],
            ["PK", "Pakistan"],
            ["PW", "Palau"],
            ["PS", "Palestine, State of"],
            ["PA", "Panama"],
            ["PG", "Papua New Guinea"],
            ["PY", "Paraguay"],
            ["PE", "Peru"],
            ["PH", "Philippines"],
            ["PN", "Pitcairn"],
            ["PL", "Poland"],
            ["PT", "Portugal"],
            ["PR", "Puerto Rico"],
            ["QA", "Qatar"],
            ["RE", "Réunion"],
            ["RO", "Romania"],
            ["RU", "Russian Federation"],
            ["RW", "Rwanda"],
            ["BL", "Saint Barthélemy"],
            ["SH", "Saint Helena, Ascension and Tristan da Cunha"],
            ["KN", "Saint Kitts and Nevis"],
            ["LC", "Saint Lucia"],
            ["MF", "Saint Martin"],
            ["PM", "Saint Pierre and Miquelon"],
            ["VC", "Saint Vincent and the Grenadines"],
            ["WS", "Samoa"],
            ["SM", "San Marino"],
            ["ST", "Sao Tome and Principe"],
            ["SA", "Saudi Arabia"],
            ["SN", "Senegal"],
            ["RS", "Serbia"],
            ["SC", "Seychelles"],
            ["SL", "Sierra Leone"],
            ["SG", "Singapore"],
            ["SX", "Sint Maarten"],
            ["SK", "Slovakia"],
            ["SI", "Slovenia"],
            ["SB", "Solomon Islands"],
            ["SO", "Somalia"],
            ["ZA", "South Africa"],
            ["GS", "South Georgia and the South Sandwich Islands"],
            ["SS", "South Sudan"],
            ["ES", "Spain"],
            ["LK", "Sri Lanka"],
            ["SD", "Sudan"],
            ["SR", "Suriname"],
            ["SJ", "Svalbard and Jan Mayen"],
            ["SE", "Sweden"],
            ["CH", "Switzerland"],
            ["SY", "Syrian Arab Republic"],
            ["TW", "Taiwan"],
            ["TJ", "Tajikistan"],
            ["TZ", "Tanzania"],
            ["TH", "Thailand"],
            ["TL", "Timor-Leste"],
            ["TG", "Togo"],
            ["TK", "Tokelau"],
            ["TO", "Tonga"],
            ["TT", "Trinidad and Tobago"],
            ["TN", "Tunisia"],
            ["TR", "Türkiye"],
            ["TM", "Turkmenistan"],
            ["TC", "Turks and Caicos Islands"],
            ["TV", "Tuvalu"],
            ["UG", "Uganda"],
            ["UA", "Ukraine"],
            ["AE", "United Arab Emirates"],
            ["GB", "United Kingdom"],
            ["UM", "United States Minor Outlying Islands"],
            ["UY", "Uruguay"],
            ["UZ", "Uzbekistan"],
            ["VU", "Vanuatu"],
            ["VE", "Venezuela"],
            ["VN", "Viet Nam"],
            ["VG", "Virgin Islands, British"],
            ["VI", "Virgin Islands, U.S."],
            ["WF", "Wallis and Futuna"],
            ["EH", "Western Sahara"],
            ["YE", "Yemen"],
            ["ZM", "Zambia"],
            ["ZW", "Zimbabwe"]
        ];
    }

    oneLine () {
        return this.postalLines().join(", ");
    }

    copyFromAddress (other) {
        if (!other) {
            return this;
        }
        this.setName(other.name());
        this.setStreet1(other.street1());
        this.setStreet2(other.street2());
        this.setCity(other.city());
        this.setState(other.state());
        this.setPostalCode(other.postalCode());
        this.setCountry(other.country());
        this.setPhone(other.phone());
        return this;
    }

}.initThisClass());
