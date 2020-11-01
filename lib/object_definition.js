const object_openingHours_definitions = {
	Montag: {
		type: 'state',
		common: {
			name: 'Montag',
			type: 'string',
			role: 'dayofweek',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	Dienstag: {
		type: 'state',
		common: {
			name: 'Dienstag',
			type: 'string',
			role: 'dayofweek',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	Mittwoch: {
		type: 'state',
		common: {
			name: 'Mittwoch',
			type: 'string',
			role: 'dayofweek',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	Donnerstag: {
		type: 'state',
		common: {
			name: 'Donnerstag',
			type: 'string',
			role: 'dayofweek',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	Freitag: {
		type: 'state',
		common: {
			name: 'Freitag',
			type: 'string',
			role: 'dayofweek',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	Feiertag: {
		type: 'state',
		common: {
			name: 'Feiertag',
			type: 'string',
			role: 'dayofweek',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	Samstag: {
		type: 'state',
		common: {
			name: 'Samstag',
			type: 'string',
			role: 'dayofweek',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	Sonntag: {
		type: 'state',
		common: {
			name: 'Sonntag',
			type: 'string',
			role: 'dayofweek',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
};

const object_prices_definitions = {
	fuelType: {
		type: 'state',
		common: {
			name: `station fuelType`,
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	price: {
		type: 'state',
		common: {
			name: `station price`,
			type: 'number',
			role: 'value',
			def: '0',
			unit: '€',
			read: true,
			write: false
		},
		native: {},
	},
	priceshort: {
		type: 'state',
		common: {
			name: `station priceshort`,
			type: 'number',
			role: 'value',
			def: '0',
			unit: '€',
			read: true,
			write: false
		},
		native: {},
	},
	price3rd: {
		type: 'state',
		common: {
			name: `station price3rd`,
			type: 'number',
			role: 'value',
			def: '0',
			read: true,
			write: false
		},
		native: {},
	},
	combined: {
		type: 'state',
		common: {
			name: `station combined`,
			type: 'string',
			role: 'html',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},

};

const object_jsonTable_definitions = {
	jsonTable: {
		type: 'state',
		common: {
			name: `Json table`,
			type: 'string',
			role: 'json',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
};

const object_main_definitions = {
	name: {
		type: 'state',
		common: {
			name: `station Name`,
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	address: {
		type: 'state',
		common: {
			name: `station address`,
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	city: {
		type: 'state',
		common: {
			name: `station city`,
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	postalCode: {
		type: 'state',
		common: {
			name: `station postalCode`,
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	open: {
		type: 'state',
		common: {
			name: `station open`,
			type: 'boolean',
			role: 'state',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	distance: {
		type: 'state',
		common: {
			name: `station Distance`,
			type: 'number',
			role: 'value.distance',
			unit: 'km',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	lastRequest: {
		type: 'state',
		common: {
			name: `last request to E-Control`,
			type: 'number',
			role: 'value.time',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
};

const object_logo_definitions = {
	logo_svg: {
		type: 'state',
		common: {
			name: `station logo svg`,
			type: 'string',
			role: 'url.icon',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
	logo_png: {
		type: 'state',
		common: {
			name: `station logo png`,
			type: 'string',
			role: 'url.icon',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},

	logo_Nr: {
		type: 'state',
		common: {
			name: `station logo NR`,
			type: 'number',
			role: 'value',
			def: '',
			read: true,
			write: false
		},
		native: {},
	},
};

module.exports = {object_openingHours_definitions, object_prices_definitions, object_jsonTable_definitions, object_main_definitions, object_logo_definitions};
