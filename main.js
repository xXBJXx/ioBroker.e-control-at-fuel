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
			// console.log(`cityName ${cityName}`);
		}


		await this.api();
		await this.request();



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
						// console.log(fuel[i]);
						break;

					case 'DIE':
						fuel[i] = 'diesel';
						// console.log(fuel[i]);
						break;

					case 'SUP':
						fuel[i] = 'super_95';
						// console.log(fuel[i]);
						break;

					default:
				}

				apiUrl[i] = `https://api.e-control.at/sprit/1.0/search/gas-stations/by-address?latitude=${latitude}&longitude=${longitude}&fuelType=${fuelType}&includeClosed=true`;


			}
		} catch (error) {
			this.log.error(`[api construction]: ${error.message}, stack: ${error.stack}`);
		}
	}

	async request() {

		for (const i in this.config.address) {

			try {

				// Try to reach API and receive data
				apiResult[i] = await axios.get(apiUrl[i]);


			} catch (error) {
				this.log.error(`[request] Unable to contact: ${error} | ${error}`);
				continue;
			}
		}
		await this.create_States();
		await this.writeState();
		this.setState('info.connection', true, true);
		requestTimeout = setTimeout(async () => {

			this.request();
		}, timer * 60000);
	}

	async writeState() {
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

			for (const i in this.config.address) {

				let number_of_station = -1;
				for (const c in apiResult[i].data) {
					if (apiResult[i].data[c].prices[0]) {
						number_of_station = number_of_station + 1;
					}
				}
				const jsonTable = [];

				for (const c in apiResult[i].data) {
					if (apiResult[i].data[c].prices[0]) {



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

						if (result.prices[0]) {

							const stationPrices = result.prices[0].amount;
							stationFuelType[c] = result.prices[0].label;
							prices[c] = await this.cutPrice(stationPrices);

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
								'Preis': (prices[c]).priceshort + ' €',
								'Fuel_Typ': stationFuelType[c],
								'Distance': stationDistance[c] + ' km',
								'Open': open[c]
							};

							const logosName = ['aral', 'eni', 'shell', 'omv', 'avanti', 'bp', 'jet', 'turmöl', 'lagerhaus', 'avia', 'a1', 'diskont', 'iq', 'sb_tankstelle', 'land', 'thrainer',
								'inn_tank', 'fillup', 'gutmann', 'holzknecht', 'diesel', 'genol_lagerhaustankstelle', 'mosonyi', 'lagerhaus_genol', 'pfluger', 'pink'];

							this.log.debug(`logosName : ${JSON.stringify(logosName)}`);
							// console.debug(`main 1 : c: ${i} / f: ${i} / s: ${c}`);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.name`, `${stationName[c]}`, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.city`, `${stationCity[c]}`, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.open`, `${stationOpen[c]}`, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.distance`, `${stationDistance[c]}`, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.address`, `${stationAddress[c]}`, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.lastRequest`, { val: Date.now(), ack: true });
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.price`, `${(prices[c]).price}`, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.postalCode`, `${stationPostalCode[c]}`, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.fuelType`, `${stationFuelType[c]}`, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.price3rd`, `${(prices[c]).price3rd}`, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.priceshort`, `${(prices[c]).priceshort}`, true);
							if (stationOpen[c]) {

								this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.combined`, `<span class="station_open"> ${(prices[c]).priceshort}<sup style="font-size: 50%"> ${(prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
							}
							else {

								this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.combined`, `<span class="station_closed"> ${(prices[c]).priceshort}<sup style="font-size: 50%"> ${(prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
							}

							this.setState(`${cityName[i]}_${fuel[i]}.jsonTable`, `${JSON.stringify(jsonTable)}`, true);

							if (c == '0') {

								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.name`, `${stationName[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.city`, `${stationCity[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.open`, `${stationOpen[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.distance`, `${stationDistance[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.address`, `${stationAddress[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.lastRequest`, { val: Date.now(), ack: true });
								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.prices.price`, `${(prices[c]).price}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.postalCode`, `${stationPostalCode[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.prices.fuelType`, `${stationFuelType[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.prices.price3rd`, `${(prices[c]).price3rd}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.cheapest.prices.priceshort`, `${(prices[c]).priceshort}`, true);
								if (stationOpen[c]) {
									this.setState(`${cityName[i]}_${fuel[i]}.cheapest.prices.combined`, `<span class="station_open"> ${(prices[c]).priceshort}<sup style="font-size: 50%"> ${(prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
								}
								else {
									this.setState(`${cityName[i]}_${fuel[i]}.cheapest.prices.combined`, `<span class="station_closed"> ${(prices[c]).priceshort}<sup style="font-size: 50%"> ${(prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
								}
							}

							if (c == `${number_of_station}`) {

								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.name`, `${stationName[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.city`, `${stationCity[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.open`, `${stationOpen[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.distance`, `${stationDistance[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.address`, `${stationAddress[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.lastRequest`, { val: Date.now(), ack: true });
								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.prices.price`, `${(prices[c]).price}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.postalCode`, `${stationPostalCode[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.prices.fuelType`, `${stationFuelType[c]}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.prices.price3rd`, `${(prices[c]).price3rd}`, true);
								this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.prices.priceshort`, `${(prices[c]).priceshort}`, true);
								if (stationOpen[c]) {
									this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.prices.combined`, `<span class="station_open"> ${(prices[c]).priceshort}<sup style="font-size: 50%"> ${(prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
								}
								else {
									this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.prices.combined`, `<span class="station_closed"> ${(prices[c]).priceshort}<sup style="font-size: 50%"> ${(prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`, true);
								}
							}

							if (result.prices[0]) {  //Cheapest station logo review

								for (const logo in logosName) {
									if (stationLogoName[0].toLowerCase().replace(/-/gi, '_') == logosName[logo]) {

										for (const f in format) {

											this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_${format[f]}`, `/e-control-at-fuel.admin/logo/${format[f]}/${logo}.${format[f]}`, true);
											this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_Nr`, `${logo}`, true);
											this.log.debug(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_Nr: ${logo}`);
											this.log.debug(`[LOGO] /e-control-at-fuel.admin/logo/${logo}.${format[f]}`);

											if (c == '0') {

												this.setState(`${cityName[i]}_${fuel[i]}.cheapest.logo_${format[f]}`, `/e-control-at-fuel.admin/logo/${format[f]}/${logo}.${format[f]}`, true);
												this.setState(`${cityName[i]}_${fuel[i]}.cheapest.logo_Nr`, `${logo}`, true);
												this.log.debug(`${cityName[i]}_${fuel[i]}.cheapest.logo_Nr: ${logo}`);
												this.log.debug(`[LOGO] /e-control-at-fuel.admin/logo/${logo}.${format[f]}`);
											}

											if (c == `${number_of_station}`) {

												this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.logo_${format[f]}`, `/e-control-at-fuel.admin/logo/${format[f]}/${logo}.${format[f]}`, true);
												this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.logo_Nr`, `${logo}`, true);
												this.log.debug(`${cityName[i]}_${fuel[i]}.most_expensive.logo_Nr: ${logo}`);
												this.log.debug(`[LOGO] /e-control-at-fuel.admin/logo/${logo}.${format[f]}`);

											}
										}
									}
								}
							}
							else {
								for (const f in format) {

									this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_${format[f]}`, ``, true);
									this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_Nr`, ``, true);
									this.log.debug(`${cityName[i]}_${fuel[i]}.station_${[c]}.logo_Nr: 'station not found'`);

								}
							}

							for (const d in openingHours) {
								if (result.prices[0]) {

									this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.openingHours.${weekDay[d]}`, `${openingHours[d]}`, true);

									if (c == '0') {

										this.setState(`${cityName[i]}_${fuel[i]}.cheapest.openingHours.${weekDay[d]}`, `${openingHours[d]}`, true);
									}
									if (c == `${number_of_station}`) {

										this.setState(`${cityName[i]}_${fuel[i]}.most_expensive.openingHours.${weekDay[d]}`, `${openingHours[d]}`, true);
									}
								}
								else {

									this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.openingHours.${weekDay[d]}`, ``, true);
								}
							}


						}
						else { 	//Empty data points if there is no station

							this.log.debug(`${cityName[i]}_${fuel[i]}.station_${[c]} station not found`);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.name`, ``, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.city`, ``, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.open`, ``, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.distance`, ``, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.address`, ``, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.lastRequest`, { val: Date.now(), ack: true });
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.price`, ``, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.postalCode`, ``, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.fuelType`, ``, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.price3rd`, ``, true);
							this.setState(`${cityName[i]}_${fuel[i]}.station_${[c]}.prices.priceshort`, ``, true);
						}
					}
					else {
						this.log.debug(`${cityName[i]}_${fuel[i]}.station_${[c]} station has no price`);

					}
				}


			}



		} catch (error) {
			this.log.warn(`[writeState]: ${error.message}, stack: ${error.stack}`);
		}
	}

	async create_States() {

		try {

			for (const i in this.config.address) {

				for (const c in apiResult[i].data) {

					if (apiResult[i].data[c].prices[0]) {

						const folder = [`cheapest`, `most_expensive`, `station_${[c]}`];

						for (const v in folder) {

							for (const d in weekDay) {

								await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.openingHours.${weekDay[d]}`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.name`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.address`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.city`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.postalCode`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.open`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.distance`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.prices.fuelType`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.prices.price`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.prices.priceshort`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.prices.price3rd`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.prices.combined`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.lastRequest`, {
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
								await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.logo_${format[f]}`, {
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

							await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.${folder[v]}.logo_Nr`, {
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
						await this.setObjectNotExistsAsync(`${cityName[i]}_${fuel[i]}.jsonTable`, {
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


					}
				}
			}
		} catch (error) {
			this.log.error(`[create_States]: ${error.message}, stack: ${error.stack}`);
		}
	}

	// Decimal point calculation and separation function 
	async cutPrice(fuel_price) {

		fuel_price = parseFloat(fuel_price);
		let temp = fuel_price * 100;   // the price now with one decimal place
		const temp2 = fuel_price * 1000; // Price without decimal place
		temp = Math.floor(temp);  // Decimal place (.x) is cut off
		temp = temp / 100;          // there are two decimal places
		const price_short = temp.toFixed(2); // Output price with 2 decimal places (cut off)
		const price_3rd_digit = Math.ceil(temp2 - (temp * 1000)); // Determine the third decimal place individually
		return {
			priceshort: price_short, // as a string Zeros e.g. 1.10 instead of 1.1
			// @ts-ignore
			price3rd: parseInt(price_3rd_digit, 10),
			price: fuel_price
		};
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

			callback();
		} catch (e) {
			callback();
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