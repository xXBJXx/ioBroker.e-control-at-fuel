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
const cityName = [];
const fuel = [];
const apiResult = [];
const weekDay = [`Montag`, `Dienstag`, `Mittwoch`, `Donnerstag`, `Feiertag`, `Samstag`, `Sonntag`, `Freitag`];
const format = [`svg`, `png`];
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
			this.log.warn(`Attention the polling interval is below the minimum limit, please set it to at least 10 min`);
		}
		for (const i in this.config.address) {
			// @ts-ignore
			cityName[i] = await this.replaceFunction(this.config.address[i].city);
			console.log(`cityName ${cityName}`);
		}


		await this.api();
		await this.request();
		await this.create_States();
		await this.statesWrite();

	}

	async api() {
		try {

			for (const i in this.config.address) {

				// @ts-ignore
				const latitude = this.config.address[i].latitude;
				// @ts-ignore
				const longitude = this.config.address[i].longitude;
				// @ts-ignore
				const fuelType = this.config.address[i].fuelType;

				switch (fuelType) {

					case 'GAS':
						fuel[i] = 'CNG';
						console.log(fuel[i]);
						break;

					case 'DIE':
						fuel[i] = 'diesel';
						console.log(fuel[i]);
						break;

					case 'SUP':
						fuel[i] = 'super_95';
						console.log(fuel[i]);
						break;

					default:
				}
				apiUrl[i] = `https://api.e-control.at/sprit/1.0/search/gas-stations/by-address?latitude=${latitude}&longitude=${longitude}&fuelType=${fuelType}&includeClosed=true`;
			}
		} catch (error) {
			this.log.error(`[api()]: ${error.message}, stack: ${error.stack}`);
		}
	}

	async create_States() {
		try {
			const folder = [`cheapest`, `most_expensive`];
			for (const v in folder) {
				for (const i in this.config.address) {
					for (const c in apiResult[i].data) {
						if (apiResult[i].data[c].prices[0]) {

							for (const d in weekDay) {

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.openingHours.${weekDay[d]}`, {
									type: 'state',
									common: {
										name: `${weekDay[d]}`,
										type: 'string',
										role: 'dayofweek',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.name`, {
									type: 'state',
									common: {
										name: `station Name`,
										type: 'string',
										role: 'text',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.address`, {
									type: 'state',
									common: {
										name: `station Address`,
										type: 'string',
										role: 'text',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.city`, {
									type: 'state',
									common: {
										name: `station city`,
										type: 'string',
										role: 'text',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.postalCode`, {
									type: 'state',
									common: {
										name: `station PostalCode`,
										type: 'string',
										role: 'text',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.open`, {
									type: 'state',
									common: {
										name: `station Open`,
										type: 'boolean',
										role: 'state',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.distance`, {
									type: 'state',
									common: {
										name: `station Distance`,
										type: 'number',
										role: 'value.distance',
										unit: 'km',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.fuelType`, {
									type: 'state',
									common: {
										name: `station fuelType`,
										type: 'string',
										role: 'text',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.price`, {
									type: 'state',
									common: {
										name: `station price`,
										type: 'number',
										role: 'value',
										unit: '€',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.priceshort`, {
									type: 'state',
									common: {
										name: `station priceshort`,
										type: 'number',
										role: 'value',
										unit: '€',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.price3rd`, {
									type: 'state',
									common: {
										name: `station price3rd`,
										type: 'number',
										role: 'value',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.combined`, {
									type: 'state',
									common: {
										name: `station combined`,
										type: 'string',
										role: 'html',
										read: true,
										write: false
									},
									native: {},
								});

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.lastRequest`, {
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

								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.jsonTable`, {
									type: 'state',
									common: {
										name: `Json table`,
										type: 'string',
										role: 'json',
										read: true,
										write: false
									},
									native: {},
								});

								for (const f in format) {
									await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_${format[f]}`, {
										type: 'state',
										common: {
											name: `station logo ${format[f]}`,
											type: 'string',
											role: 'url.icon',
											read: true,
											write: false
										},
										native: {},
									});
								}
								await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_Nr`, {
									type: 'state',
									common: {
										name: `station logo NR`,
										type: 'number',
										role: 'value',
										read: true,
										write: false
									},
									native: {},
								});

							}
						}
						for (const d in weekDay) {
							await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.openingHours.${weekDay[d]}`, {
								type: 'state',
								common: {
									name: `${weekDay[d]}`,
									type: 'string',
									role: 'dayofweek',
									read: true,
									write: false
								},
								native: {},
							});
						}
						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.name`, {
							type: 'state',
							common: {
								name: `station Name`,
								type: 'string',
								role: 'text',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.address`, {
							type: 'state',
							common: {
								name: `station Address`,
								type: 'string',
								role: 'text',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.city`, {
							type: 'state',
							common: {
								name: `station city`,
								type: 'string',
								role: 'text',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.postalCode`, {
							type: 'state',
							common: {
								name: `station PostalCode`,
								type: 'string',
								role: 'text',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.open`, {
							type: 'state',
							common: {
								name: `station Open`,
								type: 'boolean',
								role: 'state',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.distance`, {
							type: 'state',
							common: {
								name: `station Distance`,
								type: 'number',
								role: 'value.distance',
								unit: 'km',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.prices.fuelType`, {
							type: 'state',
							common: {
								name: `station fuelType`,
								type: 'string',
								role: 'text',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.prices.price`, {
							type: 'state',
							common: {
								name: `station price`,
								type: 'number',
								role: 'value',
								unit: '€',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.prices.priceshort`, {
							type: 'state',
							common: {
								name: `station priceshort`,
								type: 'number',
								role: 'value',
								unit: '€',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.prices.price3rd`, {
							type: 'state',
							common: {
								name: `station price3rd`,
								type: 'number',
								role: 'value',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.prices.combined`, {
							type: 'state',
							common: {
								name: `station combined`,
								type: 'string',
								role: 'html',
								read: true,
								write: false
							},
							native: {},
						});

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.lastRequest`, {
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

						for (const f in format) {
							await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.logo_${format[f]}`, {
								type: 'state',
								common: {
									name: `station logo ${format[f]}`,
									type: 'string',
									role: 'url.icon',
									read: true,
									write: false
								},
								native: {},
							});
						}

						await this.extendObjectAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.logo_Nr`, {
							type: 'state',
							common: {
								name: `station logo NR`,
								type: 'number',
								role: 'value',
								read: true,
								write: false
							},
							native: {},
						});


					}
				}
			}
		} catch (error) {
			this.log.error(`[create_States]: ${error.message}, stack: ${error.stack}`);
		}
	}

	async request() {
		try {

			for (const i in this.config.address) {
				try {
					// Try to reach API and receive data
					apiResult[i] = await axios.get(apiUrl[i]);
					console.log(`stationCity: ${apiResult[i]}`);
				} catch (error) {
					this.log.warn(`[apiResult] Unable to contact: ${error} | ${error}`);
					continue;
				}
			}

			this.setState('info.connection', true, true);

			await this.statesWrite();
			requestTimeout = setTimeout(async () => {

				this.request();
			}, timer * 60000);

		} catch (error) {
			this.log.warn(`[Request and setState] Unable to contact: ${error} | ${error}`);
		}
	}

	async statesWrite() {
		try {
			const openingHours = [];
			const stationAddress = [];
			const stationCity = [];
			const stationPostalCode = [];
			const stationOpen = [];
			const stationDistance = [];
			const stationName = [];
			const prices = [];
			const stationFuelType = [];
			const open = [];

			for (const i in apiResult) {
				const jsonTable = [];
				for (const c in apiResult[i].data) {
					const result = apiResult[i].data[c];
					stationName[c] = result.name.replace(/,/gi, ' ');
					const stationLogoName = stationName[c].split(' ');
					stationAddress[c] = result.location.address;
					stationCity[c] = result.location.city;
					stationPostalCode[c] = result.location.postalCode;
					stationOpen[c] = result.open;
					stationDistance[c] = Math.round(result.distance * 100) / 100;

					for (const u in result.openingHours) {
						openingHours[u] = result.openingHours[u].from + ' to ' + result.openingHours[u].to;
					}

					console.log(`stationName: ${stationName[c]} short: ${stationLogoName[0].toLowerCase().replace(/-/gi, '_')}`);
					console.log(`stationAddress: ${stationAddress[c]}`);
					console.log(`stationCity: ${stationCity[c]}`);
					console.log(`stationPostalCode: ${stationPostalCode[c]}`);
					console.log(`stationOpen: ${stationOpen[c]}`);
					console.log(`stationDistance: ${stationDistance[c]}`);

					if (result.prices[0]) {

						const stationPrices = result.prices[0].amount;
						stationFuelType[c] = result.prices[0].label;
						prices[c] = this.cutPrice(await stationPrices);

						console.log(`stationPrices: ${stationPrices}`);
						console.log(`stationLabel: ${stationFuelType}`);
						console.log(`prices: ${JSON.stringify(prices[c])}`);

						this.log.debug(`stationPrices: ${stationPrices}`);
						this.log.debug(`stationFuelType: ${stationFuelType}`);
						this.log.debug(`prices: ${JSON.stringify(prices[c])}`);

						if (stationOpen[c]) {
							open[c] = 'open';
						}
						else {
							open[c] = 'closed';
						}

						jsonTable[c] = {
							'Station Name': stationName[c],
							'Stadt': stationCity[c],
							'Addresse': stationAddress[c],
							// @ts-ignore
							'Preis': (await prices[c]).priceshort + ' €',
							'Fuel_Typ': stationFuelType[c],
							'Distance': stationDistance[c] + ' km',
							'Open': open[c]
						};

						const logosName = ['aral', 'eni', 'shell', 'omv', 'avanti', 'bp', 'jet', 'turmöl', 'lagerhaus', 'avia', 'a1', 'diskont', 'iq', 'sb_tankstelle', 'land', 'thrainer',
							'inn_tank', 'fillup', 'gutmann', 'holzknecht', 'diesel', 'genol_lagerhaustankstelle', 'mosonyi', 'lagerhaus_genol', 'pfluger'];

						console.log(`prices: ${JSON.stringify(logosName)}`);
						this.log.debug(`logosName : ${JSON.stringify(logosName)}`);


						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.name`, `${await stationName[c]}`, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.city`, `${await stationCity[c]}`, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.open`, `${await stationOpen[c]}`, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.distance`, `${stationDistance[c]}`, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.address`, `${await stationAddress[c]}`, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.lastRequest`, { val: Date.now(), ack: true });
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.price`, `${(await prices[c]).price}`, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.postalCode`, `${await stationPostalCode[c]}`, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.fuelType`, `${await stationFuelType[c]}`, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.price3rd`, `${(await prices[c]).price3rd}`, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.priceshort`, `${(await prices[c]).priceshort}`, true);
						if (stationOpen[c]) {
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.combined`, `<span class="station_open"> ${(await prices[c]).priceshort}<sup style="font-size: 50%"> ${(await prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
						}
						else {
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.combined`, `<span class="station_closed"> ${(await prices[c]).priceshort}<sup style="font-size: 50%"> ${(await prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
						}
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.jsonTable`, `${JSON.stringify(jsonTable)}`, true);


						if (c == '0') {
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.name`, `${await stationName[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.city`, `${await stationCity[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.open`, `${await stationOpen[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.distance`, `${stationDistance[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.address`, `${await stationAddress[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.lastRequest`, { val: Date.now(), ack: true });
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.prices.price`, `${(await prices[c]).price}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.postalCode`, `${await stationPostalCode[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.prices.fuelType`, `${await stationFuelType[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.prices.price3rd`, `${(await prices[c]).price3rd}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.prices.priceshort`, `${(await prices[c]).priceshort}`, true);
							if (stationOpen[c]) {
								this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.prices.combined`, `<span class="station_open"> ${(await prices[c]).priceshort}<sup style="font-size: 50%"> ${(await prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
							}
							else {
								this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.prices.combined`, `<span class="station_closed"> ${(await prices[c]).priceshort}<sup style="font-size: 50%"> ${(await prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
							}
						}

						if (c == '4') {
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.name`, `${await stationName[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.city`, `${await stationCity[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.open`, `${await stationOpen[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.distance`, `${stationDistance[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.address`, `${await stationAddress[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.lastRequest`, { val: Date.now(), ack: true });
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.prices.price`, `${(await prices[c]).price}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.postalCode`, `${await stationPostalCode[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.prices.fuelType`, `${await stationFuelType[c]}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.prices.price3rd`, `${(await prices[c]).price3rd}`, true);
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.prices.priceshort`, `${(await prices[c]).priceshort}`, true);
							if (stationOpen[c]) {
								this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.prices.combined`, `<span class="station_open"> ${(await prices[c]).priceshort}<sup style="font-size: 50%"> ${(await prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
							}
							else {
								this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.prices.combined`, `<span class="station_closed"> ${(await prices[c]).priceshort}<sup style="font-size: 50%"> ${(await prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
							}
						}
						if (result.prices[0]) {

							for (const logo in logosName) {
								if (stationLogoName[0].toLowerCase().replace(/-/gi, '_') == logosName[logo]) {
									console.log(`${logosName[logo]} Nr: ${logo} `);
									for (const f in format) {
										this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_${format[f]}`, `/e-control-at-fuel.admin/logo/${format[f]}/${logo}.${format[f]}`, true);
										this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_Nr`, `${logo}`, true);
										this.log.debug(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_Nr: ${logo}`);
										this.log.debug(`[LOGO] /e-control-at-fuel.admin/logo/${logo}.${format[f]}`);
										console.log(`${logosName[logo]} [LOGO] /e-control-at-fuel.admin/logo/${logo}.${format[f]}`);
										if (c == '0') {

											this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.logo_${format[f]}`, `/e-control-at-fuel.admin/logo/${format[f]}/${logo}.${format[f]}`, true);
											this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.logo_Nr`, `${logo}`, true);
											this.log.debug(`${cityName[i]}_${fuel[i]}.cheapest.logo_Nr: ${logo}`);
											this.log.debug(`[LOGO] /e-control-at-fuel.admin/logo/${logo}.${format[f]}`);
										}

										if (c == '4') {

											this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.logo_${format[f]}`, `/e-control-at-fuel.admin/logo/${format[f]}/${logo}.${format[f]}`, true);
											this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.logo_Nr`, `${logo}`, true);
											this.log.debug(`${cityName[i]}_${fuel[i]}.most_expensive.logo_Nr: ${logo}`);
											this.log.debug(`[LOGO] /e-control-at-fuel.admin/logo/${logo}.${format[f]}`);
										}
									}
									break;
								}
							}
						}
						else {
							for (const f in format) {
								this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_${format[f]}`, ``, true);
								this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_Nr`, ``, true);
								this.log.debug(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_Nr: 'station not found'`);
							}
						}
					}
					else {
						this.log.debug(`${cityName[i]}_${fuel[i]}.station_${[c]} 'station not found'`);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.name`, ``, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.city`, ``, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.open`, ``, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.distance`, ``, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.address`, ``, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.lastRequest`, { val: Date.now(), ack: true });
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.price`, ``, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.postalCode`, `$`, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.fuelType`, ``, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.price3rd`, ``, true);
						this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.priceshort`, ``, true);
					}



					for (const d in openingHours) {
						if (result.prices[0]) {

							this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.openingHours.${weekDay[d]}`, `${openingHours[d]}`, true);

							if (c == '0') {
								this.setStateAsync(`${cityName[i]}_${fuel[i]}.cheapest.openingHours.${weekDay[d]}`, `${openingHours[d]}`, true);
							}
							if (c == '4') {
								this.setStateAsync(`${cityName[i]}_${fuel[i]}.most_expensive.openingHours.${weekDay[d]}`, `${openingHours[d]}`, true);
							}
						}
						else {
							this.setStateAsync(`${cityName[i]}_${fuel[i]}.station_${[c]}.openingHours.${weekDay[d]}`, ``, true);

						}
					}

				}
			}
		} catch (error) {
			this.log.error(`[statesWrite]: ${error.message}, stack: ${error.stack}`);
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
			this.log.warn(`[cutPrice]: ${error.message}, stack: ${error.stack}`);
		}
	}

	async replaceFunction(str) {
		if (str) {
			str = str.replace(/ü/g, 'ue');
			str = str.replace(/Ü/g, 'Ue');
			str = str.replace(/ö/g, 'oe');
			str = str.replace(/Ö/g, 'Oe');
			str = str.replace(/Ä/g, 'Ae');
			str = str.replace(/ä/g, 'ae');
			str = str.replace(/\.*\./gi, '_');
			str = str.replace(/ /gi, '_');
			str = str.toLowerCase();
			return str;
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