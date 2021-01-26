'use strict';

/*
 * Created with @iobroker/create-adapter v1.24.2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const {default: axios} = require('axios');
const object = require('./lib/object_definition');
const logos = require('./lib/logoName');
// Load your modules here, e.g.:
const object_openingHours = object['object_openingHours_definitions'];
const object_prices = object['object_prices_definitions'];
const object_jsonTable = object['object_jsonTable_definitions'];
const object_main = object['object_main_definitions'];
const object_logo = object['object_logo_definitions'];
const logosName = logos['logosName'];


let timer = null;
let requestTimeout = null;
const apiUrl = [];
const cityName = [];
const fuel = [];
// const apiResult = [];
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

		// timer control min limit.
		timer = this.config.interval;
		if (timer < 10) {
			timer = 10;
			this.log.warn(`Attention the polling interval is below the minimum limit, please set it to at least 10 min`);
		}
		for (const i in this.config.address) {
			// @ts-ignore
			cityName[i] = await this.replaceFunction(this.config.address[i].city);
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
						break;
					case 'DIE':
						fuel[i] = 'diesel';
						break;
					case 'SUP':
						fuel[i] = 'super_95';
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
				const apiResult = await axios.get(apiUrl[i]);

				await this.create_States(apiResult, parseInt(i));
				await this.writeState(apiResult, parseInt(i));
			} catch (error) {
				this.log.error(`[request] Unable to contact: ${error} | ${error}`);
			}
		}

		this.setState('info.connection', true, true);
		requestTimeout = setTimeout(async () => {
			await this.request();
		}, timer * 60000);
	}

	/**
	 * here the values are written into the data points
	 * @param {object} apiResult	// query the object from the api
	 * @param {number} index		// number of the device
	 * @return {Promise<void>}
	 */
	async writeState(apiResult, index) {
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

			let number_of_station = -1;
			for (const c in apiResult.data) {
				if (apiResult.data[c].prices[0]) {
					number_of_station = number_of_station + 1;
				}
			}
			const jsonTable = [];

			for (const c in apiResult.data) {
				if (apiResult.data[c].prices[0]) {

					const result = apiResult.data[c];
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
					const State_id = [`station_${[c]}.name`, `station_${[c]}.city`, `station_${[c]}.open`, `station_${[c]}.distance`, `station_${[c]}.address`, `station_${[c]}.lastRequest`, `station_${[c]}.prices.price`,
						`station_${[c]}.postalCode`, `station_${[c]}.prices.fuelType`, `station_${[c]}.prices.price3rd`, `station_${[c]}.prices.priceshort`, `station_${[c]}.prices.combined`, `jsonTable`];

					const states = [];
					if (result.prices[0]) {
						let States_value;
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
						// Json table is created here
						jsonTable[c] = {
							'Station Name': stationName[c],
							'Stadt': stationCity[c],
							'Address': stationAddress[c],
							'Preis': (prices[c]).priceshort + ' €',
							'Fuel_Typ': stationFuelType[c],
							'Distance': stationDistance[c] + ' km',
							'Open': open[c]
						};
						// All values are written into an array
						if (stationOpen[c]) {
							States_value = [`${stationName[c]}`, `${stationCity[c]}`, `${stationOpen[c]}`, `${stationDistance[c]}`, `${stationAddress[c]}`, parseInt(`${Date.now()}`), `${(prices[c]).price}`,
								`${stationPostalCode[c]}`, `${stationFuelType[c]}`, `${(prices[c]).price3rd}`, `${(prices[c]).priceshort}`, `<span class="station_open"> ${(prices[c]).priceshort}<sup style="font-size: 50%"> ${(prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`,
								`${JSON.stringify(jsonTable)}`];
						}
						else {
							States_value = [`${stationName[c]}`, `${stationCity[c]}`, `${stationOpen[c]}`, `${stationDistance[c]}`, `${stationAddress[c]}`, parseInt(`${Date.now()}`), `${(prices[c]).price}`,
								`${stationPostalCode[c]}`, `${stationFuelType[c]}`, `${(prices[c]).price3rd}`, `${(prices[c]).priceshort}`, `<span class="station_closed"> ${(prices[c]).priceshort}<sup style="font-size: 50%"> ${(prices[c]).price3rd} </sup> <span class="station_combined_euro">€</span></span>`,
								`${JSON.stringify(jsonTable)}`];
						}
						// push all dp and values into an object ( id: e-control-at-fuel.0.salzburg_super_95.station_0.name , value: AVIA )
						for (const Key in State_id) {
							states.push(
								{
									'State': `${cityName[index]}_${fuel[index]}.${State_id[Key]}`,
									'State_value': States_value[Key]
								}
							);
						}
						// here the cheapest gas station is written into the data points
						if (c === '0') {
							const State_id_cheapest = ['cheapest.name', 'cheapest.city', 'cheapest.open', 'cheapest.distance', 'cheapest.address', 'cheapest.lastRequest', 'cheapest.prices.price',
								'cheapest.postalCode', 'cheapest.prices.fuelType', 'cheapest.prices.price3rd', 'cheapest.prices.priceshort', 'cheapest.prices.combined'];
							// push all dp and values for cheapest gas station into an object ( id: e-control-at-fuel.0.salzburg_super_95.cheapest.name , value: AVIA )
							for (const Key in State_id_cheapest) {
								states.push(
									{
										'State': `${cityName[index]}_${fuel[index]}.${State_id_cheapest[Key]}`,
										'State_value': States_value[Key]
									}
								);
							}
						}

						if (result.prices[0]) {
							// here are the gas stations logos written in the dp
							for (const logo in logosName) {
								this.log.debug(`logosName : ${JSON.stringify(logosName)}`);
								if (stationLogoName[0].toLowerCase().replace(/-/gi, '_') === logosName[logo]) {
									// push all Dp and values for the logos into one object
									for (const f in format) {
										if (c === '0') {
											states.push(
												{
													'State': `${cityName[index]}_${fuel[index]}.station_${[c]}.logo_${format[f]}`,
													'State_value': `/e-control-at-fuel.admin/logo/${format[f]}/${logo}.${format[f]}`
												},
												{
													'State': `${cityName[index]}_${fuel[index]}.cheapest.logo_${format[f]}`,
													'State_value': `/e-control-at-fuel.admin/logo/${format[f]}/${logo}.${format[f]}`
												},
											);
										}
										else {
											states.push(
												{
													'State': `${cityName[index]}_${fuel[index]}.station_${[c]}.logo_${format[f]}`,
													'State_value': `/e-control-at-fuel.admin/logo/${format[f]}/${logo}.${format[f]}`
												},
											);
										}
									}
									// here is written the cheapest gas station logo no.
									if (c === '0') {
										states.push(
											{
												'State': `${cityName[index]}_${fuel[index]}.station_${[c]}.logo_Nr`,
												'State_value': `${logo}`
											},
											{
												'State': `${cityName[index]}_${fuel[index]}.cheapest.logo_Nr`,
												'State_value': `${logo}`
											}
										);
									}
									else {
										states.push(
											{
												'State': `${cityName[index]}_${fuel[index]}.station_${[c]}.logo_Nr`,
												'State_value': `${logo}`
											}
										);
									}
								}
							}
						}
						else {
							// pushes all Dp for the logos where the values are to be deleted into an object
							const delete_Logo = [];
							for (const f in format) {
								delete_Logo.push(
									{
										'State': `${cityName[index]}_${fuel[index]}.station_${[c]}.logo_${format[f]}`
									},
									{
										'State': `${cityName[index]}_${fuel[index]}.station_${[c]}.logo_Nr`
									},
								);
							}
							// Deletes all values in the Dp that stick in the object
							for (const delete_LogoKey in delete_Logo) {
								await this.setStateAsync(delete_Logo[delete_LogoKey].State, '', true);
								this.log.debug(`${delete_Logo[delete_LogoKey].State}: 'station not found'`);
							}
						}
						// push all Dp and values for openingHours into one object
						for (const d in openingHours) {
							if (result.prices[0]) {
								if (c === '0') {
									states.push(
										{
											'State': `${cityName[index]}_${fuel[index]}.station_${[c]}.openingHours.${weekDay[d]}`,
											'State_value': `${openingHours[d]}`
										},
										{
											'State': `${cityName[index]}_${fuel[index]}.cheapest.openingHours.${weekDay[d]}`,
											'State_value': `${openingHours[d]}`
										}
									);
								}
								else {
									states.push(
										{
											'State': `${cityName[index]}_${fuel[index]}.station_${[c]}.openingHours.${weekDay[d]}`,
											'State_value': `${openingHours[d]}`
										},
									);
								}
							}
							else {
								this.setState(`${cityName[index]}_${fuel[index]}.station_${[c]}.openingHours.${weekDay[d]}`, ``, true);
							}
						}
					}
					else { 	//Empty data points if there is no station
						const State_id = [`station_${[c]}.name`, `station_${[c]}.city`, `station_${[c]}.open`, `station_${[c]}.distance`, `station_${[c]}.address`, `station_${[c]}.lastRequest`, `station_${[c]}.prices.price`,
							`station_${[c]}.postalCode`, `station_${[c]}.prices.fuelType`, `station_${[c]}.prices.price3rd`, `station_${[c]}.prices.priceshort`, `station_${[c]}.prices.combined`];

						// push all Dp where the value should be deleted into an object
						const delete_State_id = [];
						delete_State_id.push(
							{
								'State': `${cityName[index]}_${fuel[index]}.${State_id}`
							}
						);
						// Deletes all values in the Dp that stick in the object
						for (const delete_Key in delete_State_id) {
							await this.setStateAsync(delete_State_id[delete_Key].State, '', true);
							this.log.debug(`${cityName[index]}_${fuel[index]}.station_${[c]} station not found`);
						}
					}
					// Writes all values from the Object into the Dp
					for (const stateKey in states) {
						await this.setStateAsync(states[stateKey].State, states[stateKey].State_value, true);
						this.log.debug(`${states[stateKey].State}: ${states[stateKey].State_value}`);
					}
				}
				else {
					this.log.debug(`${cityName[index]}_${fuel[index]}.station_${[c]} station has no price`);
				}
			}
		} catch (error) {
			this.log.warn(`[writeState]: ${error.message}, stack: ${error.stack}`);
		}
	}

	/**
	 * here the data points are created (must be executed first)
	 * @param {object} apiResult	// Query the object from the API
	 * @param {number} index		// number of the device
	 * @return {Promise<void>}
	 */
	async create_States(apiResult, index) {
		try {
			for (const c in apiResult.data) {
				if (apiResult.data[c].prices[0]) {
					const folder = [`cheapest`, `station_${[c]}`];

					await this.setObjectNotExistsAsync(`${cityName[index]}_${fuel[index]}`, {
						type: 'channel',
						common: {
							name: `${cityName[index]} for ${fuel[index]}`
						},
						native: {}
					});

					for (const v in folder) {

						await this.setObjectNotExistsAsync(`${cityName[index]}_${fuel[index]}.${folder[v]}.openingHours`, {
							type: 'channel',
							common: {
								name: `openingHours`
							},
							native: {}
						});

						await this.setObjectNotExistsAsync(`${cityName[index]}_${fuel[index]}.${folder[v]}.prices`, {
							type: 'channel',
							common: {
								name: `prices`
							},
							native: {}
						});

						await this.setObjectNotExistsAsync(`${cityName[index]}_${fuel[index]}.${folder[v]}`, {
							type: 'channel',
							common: {
								name: `${folder[v]}`
							},
							native: {}
						});

						for (const obj in object_openingHours) {
							await this.setObjectNotExistsAsync(`${cityName[index]}_${fuel[index]}.${folder[v]}.openingHours.${obj}`, object_openingHours[obj]);
						}
						for (const obj in object_prices) {
							await this.setObjectNotExistsAsync(`${cityName[index]}_${fuel[index]}.${folder[v]}.prices.${obj}`, object_prices[obj]);
						}
						for (const obj in object_jsonTable) {
							await this.setObjectNotExistsAsync(`${cityName[index]}_${fuel[index]}.${obj}`, object_jsonTable[obj]);
						}
						for (const obj in object_main) {
							await this.setObjectNotExistsAsync(`${cityName[index]}_${fuel[index]}.${folder[v]}.${obj}`, object_main[obj]);
						}
						for (const obj in object_logo) {
							await this.setObjectNotExistsAsync(`${cityName[index]}_${fuel[index]}.${folder[v]}.${obj}`, object_logo[obj]);
						}
					}
				}
			}
		} catch (error) {
			this.log.error(`[create_States]: ${error.message}, stack: ${error.stack}`);
		}
	}

	// Decimal point calculation and separation function

	/**
	 *
	 * @param {number|string} fuel_price
	 * @return {Promise<{price3rd: number, price: number, priceshort: string}>}
	 */
	async cutPrice(fuel_price) {
		// @ts-ignore
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


	/**
	 * replace function for strings
	 * @param {string} str				// a string
	 * @return {Promise<string|undefined>}
	 */
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
}
else {
	// otherwise start the instance directly
	new EControlAtFuel();
}