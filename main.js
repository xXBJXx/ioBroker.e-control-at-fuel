'use strict';

/*
 * Created with @iobroker/create-adapter v1.24.2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const { default: axios } = require('axios');
// Load your modules here, e.g.:

let timer = null;
let requestTimeout = null;
const apiUrl = [];


class EControlAtFuel extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'e-control-at-fuel',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('objectChange', this.onObjectChange.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */

	async onReady() {
		// Initialize your adapter here
		// Reset the connection indicator during startup
		this.setState('info.connection', false, true);


		// timmer control min limit.
		timer = this.config.interval;
		if (timer < 10) {
			timer = 10;
			this.log.warn(`Attention the polling interval is below the minimum limit, please set it to at least 10 min`)
		}

		await this.api();
		await this.request();

	}

	async api() {
		for (const i in this.config.address) {

			const latitude = this.config.address[i].latitude;
			const longitude = this.config.address[i].longitude;
			const fuelType = this.config.address[i].fuelType;

			apiUrl[i] = `https://api.e-control.at/sprit/1.0/search/gas-stations/by-address?latitude=${latitude}&longitude=${longitude}&fuelType=${fuelType}&includeClosed=true`;
		}


	}

	async request() {
		try {
			const apiResult = [];

			for (const i in this.config.address) {
				try {
					apiResult[i] = await axios.get(apiUrl[i]);
					console.log((apiResult));
				} catch (error) {
					this.log.warn(`[apiResult] Unable to contact: ${error} | ${error}`);
					continue;
				}
			}
			// Try to reach API and receive data

			this.setState('info.connection', true, true);
			// this.log.info(JSON.stringify(apiResult.data))
			// for (const c in apiResult.data) {
			for (const i in apiResult) {
				for (let c = 0; c <= 4; c++) {
					const result = apiResult[i].data[c];
					const stationName = result.name;
					const stationAddress = result.location.address;
					const stationCity = result.location.city;
					const stationPostalCode = result.location.postalCode;
					const stationOpen = result.open;
					const stationDistance = Math.round(result.distance * 100) / 100;
					const openingHours = result.openingHours;

					console.log(`stationName: ${stationName}`);
					console.log(`stationAddress: ${stationAddress}`);
					console.log(`stationCity: ${stationCity}`);
					console.log(`stationPostalCode: ${stationPostalCode}`);
					console.log(`stationOpen: ${stationOpen}`);
					console.log(`stationDistance: ${stationDistance}`);
				
					for (const d in await openingHours) {

						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.openingHours.${await openingHours[d].label}`, {
							type: 'state',
							common: {
								name: `${await openingHours[d].label}`,
								type: 'string',
								role: 'dayofweek',
								def: '',
								read: true,
								write: false
							},
							native: {},
						});


						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.name`, {
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
						});

						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.address`, {
							type: 'state',
							common: {
								name: `station Address`,
								type: 'string',
								role: 'text',
								def: '',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.city`, {
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
						});

						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.postalCode`, {
							type: 'state',
							common: {
								name: `station PostalCode`,
								type: 'string',
								role: 'text',
								def: '',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.open`, {
							type: 'state',
							common: {
								name: `station Open`,
								type: 'boolean',
								role: 'switch',
								def: '',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.distance`, {
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
						});



						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.prices.fuelType`, {
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
						});

						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.prices.price`, {
							type: 'state',
							common: {
								name: `station price`,
								type: 'number',
								role: 'value',
								unit: '€',
								def: '0',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.prices.priceshort`, {
							type: 'state',
							common: {
								name: `station priceshort`,
								type: 'number',
								role: 'value',
								unit: '€',
								def: '0',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.prices.price3rd`, {
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
						});

						await this.extendObjectAsync(`radius_${[i]}.station_${[c]}.lastRequest`, {
							type: 'state',
							common: {
								name: `last request to E-Control`,
								type: 'number',
								role: 'value.time',
								read: true,
								write: false
							},
							native: {},
						});

						if (result.prices[0]) {
							
							const stationPrices = result.prices[0].amount;
							const stationFuelType = result.prices[0].label;
							const prices = this.cutPrice(await stationPrices);

							console.log(`stationPrices: ${stationPrices}`);
							console.log(`stationLabel: ${stationFuelType}`);
							console.log(`prices: ${prices}`);
		
							this.log.debug(`stationPrices: ${stationPrices}`)
							this.log.debug(`stationFuelType: ${stationFuelType}`)
							this.log.debug(`prices: ${prices}`)


							this.setStateAsync(`radius_${[i]}.station_${[c]}.name`, `${await stationName}`, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.city`, `${await stationCity}`, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.open`, `${await stationOpen}`, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.distance`, `${stationDistance}`, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.address`, `${await stationAddress}`, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.lastRequest`, { val: Date.now(), ack: true });
							this.setStateAsync(`radius_${[i]}.station_${[c]}.prices.price`, `${(await prices).price}`, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.postalCode`, `${await stationPostalCode}`, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.prices.fuelType`, `${await stationFuelType}`, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.prices.price3rd`, `${(await prices).price3rd}`, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.prices.priceshort`, `${(await prices).priceshort}`, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.openingHours.${await openingHours[d].label}`, `${await result.openingHours[d].from} to ${await result.openingHours[d].to}`, true);

						}
						else {

							this.setStateAsync(`radius_${[i]}.station_${[c]}.name`, ``, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.city`, ``, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.open`, ``, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.distance`, ``, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.address`, ``, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.prices.price`, ``, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.postalCode`, ``, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.prices.fuelType`, ``, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.prices.price3rd`, ``, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.prices.priceshort`, ``, true);
							this.setStateAsync(`radius_${[i]}.station_${[c]}.lastRequest`, { val: Date.now(), ack: true });
							this.setStateAsync(`radius_${[i]}.station_${[c]}.openingHours.${await openingHours[d].label}`, ``, true);

							
						}

					}
				}
			}
			requestTimeout = setTimeout(async () => {

				this.request();
			}, timer * 60000);

		} catch (error) {
			this.log.warn(`[Request and setState] Unable to contact: ${error} | ${error}`);
		}

	}

	async cutPrice(preis) {
		try {
			preis = parseFloat(preis);
			let temp = preis * 100;   // 100facher Preis jetzt mit einer Nachkommastelle
			const temp2 = preis * 1000; // 1000facher Preis ohne Nachkommastelle
			temp = Math.floor(temp);  // Nachkommastelle (.x) wird abgeschnitten
			temp = temp / 100;          // es bleiben zwei Nachkommastellen
			const price_short = temp.toFixed(2); // Preis mit 2 Nachkommastellen ausgeben (abgeschnitten)
			const price_3rd_digit = Math.ceil(temp2 - (temp * 1000)); // Dritte Nachommastelle einzeln ermitteln
			return {
				priceshort: price_short, // als String wg. Nullen zB 1.10 statt 1.1
				// @ts-ignore
				price3rd: parseInt(price_3rd_digit, 10),
				price: preis
			};

		} catch (error) {
			this.log.warn(`[Request] Unable to contact: ${error} | ${error}`);
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {


			if (requestTimeout) clearTimeout(requestTimeout);
			this.setState('info.connection', false, true);



			this.log.info('cleaned everything up...');
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new EControlAtFuel(options);
} else {
	// otherwise start the instance directly
	new EControlAtFuel();
}