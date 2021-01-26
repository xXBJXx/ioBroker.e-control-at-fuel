![Logo](admin/e-control-at-fuel.png)

# ioBroker.e-control-at-fuel

[![NPM version](http://img.shields.io/npm/v/iobroker.e-control-at-fuel.svg?logo=npm)](https://www.npmjs.com/package/iobroker.e-control-at-fuel) 
[![Downloads](https://img.shields.io/npm/dm/iobroker.e-control-at-fuel.svg?logo=npm)](https://www.npmjs.com/package/iobroker.e-control-at-fuel)

![Installations](http://iobroker.live/badges/e-control-at-fuel-installed.svg)
[![Dependency Status](https://img.shields.io/david/xXBJXx/iobroker.e-control-at-fuel.svg)](https://david-dm.org/xXBJXx/iobroker.e-control-at-fuel)

[![NPM](https://nodei.co/npm/iobroker.e-control-at-fuel.png?downloads=true)](https://nodei.co/npm/iobroker.e-control-at-fuel/)

**Tests:** ![Test and Release](https://github.com/xXBJXx/ioBroker.e-control-at-fuel/workflows/Test%20and%20Release/badge.svg)

## E-Control-at-fuel

### Fuel prices for Austria

[Forum Post](https://forum.iobroker.net/topic/33033/e-control-at-fuel-kraftstoffpreise-f%C3%BCr-%C3%B6sterreich)

This adapter uses the service Sentry.io to automatically report exceptions and code errors and new device schemas to me as the developer. 
More details see below!

## The adapter reads the fuel prices from E-Control.at:

Auf der config Seite muss man nur den Intervall **(die kleinste einstellbare Zeit ist 10 min)** setzen und die Latitude und Longitude eintragen diese könnt ihr hier nach schauen
**https://www.latlong.net/** dann wählt man nur noch aus welchem Sprit man will und fertig.
![config](admin/config.png)

On the config page you only have to set the interval **(the smallest adjustable time is 10 min)** and enter the latitude and longitude which you can look up here
**https://www.latlong.net/** then you only have to choose which fuel you want, and you are done.

As soon as the adapter starts, for each city name and the fuel type that was specified on the config page,
a folder is created e.g. **rosenheim_diesel** and in this folder the gas station folders are created the number
depends on the gas stations, which transmit their prices it is created still 1 folder the most favorable gas stations,
and a JSON table for all gas stations, which were created in the folder.

A detailed description can be found [Adapter Documentation](https://xxbjxx.github.io/language/en/e-control-at-fuel/description.html)

## What is Sentry.io and what is reported to the servers of that company?

Sentry.io is a service for developers to get an overview about errors from their applications. And exactly this is implemented in this adapter.

When the adapter crashes, or another Code error happens, this error message that also appears in the ioBroker log is submitted to Sentry. When you 
allowed iobroker GmbH to collect diagnostic data then also your installation ID (this is just a unique ID without any additional infos about you, email name or such) 
is included. This allows Sentry to group errors and show how many unique users are affected by such an error. All of this helps me to provide error free adapters that basically never crashs.


## Changelog
<!--
 Placeholder for the next version (at the beginning of the line):
 ### __WORK IN PROGRESS__ ( - falls nicht benötigt löschen sonst klammern entfernen und nach dem - dein text schreiben )
-->

### 0.1.6-beta.0 (2021-01-26)
* (xXBJXx) config page style customized
* (xXBJXx) Most expensive dp removed
* (xXBJXx) Code Optimization
* (xXBJXx) Dependency updates
* (xXBJXx) README revised and added Documentation link and LICENSE updated
* (xXBJXx) test-and-release.yml updated
* (xXBJXx) removed travis

### 0.1.5-0 (2020-11-01)
* (xXBJXx) add GitHub Actions (test and release) and dependabot auto merge
* (xXBJXx) Dependency updates performed
* (xXBJXx) change State create 

### 0.1.4
* (xXBJXx) Dependency updates performed

### 0.1.3
* (xXBJXx) Adjusted the code and fixed some bugs
* (xXBJXx) Dependency updates performed

### 0.1.2
* (xXBJXx) code adjustment carried out

### 0.1.1
* (xXBJXx) Code optimization carried out and README adapted

### 0.1.0
* (xXBJXx) Latest Release

### 0.0.8
* (xXBJXx) added new stations + logos
* (xXBJXx) new state prices.combined

### 0.0.7
* (xXBJXx) fixed name bug and added new stations + logos

### 0.0.6
* (xXBJXx) added Gas station logos in svg and png format

### 0.0.5
* (xXBJXx) Json table adjusted and all stations in one Dp

### 0.0.4
* (xXBJXx) cheapest / most expensive gas station
* (xXBJXx) Added DP output as JSON
* (xXBJXx) added Gas station logos

### 0.0.3
* (xXBJXx) City and fuel type added as a designation

### 0.0.2
* (xXBJXx) beta release

### 0.0.1
* (xXBJXx) initial release

## License

MIT License

Copyright (c) 2021 xXBJXx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
