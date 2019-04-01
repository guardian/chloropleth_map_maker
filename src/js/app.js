import xr from 'xr';
import { Choropleth } from './modules/choropleth'

const app = {

	topojson: [{
		"name" : "federal",
		"url" : "https://interactive.guim.co.uk/gis/australian_federal_electorates.json",
		"key" : "boundary"
	}],

	init: () => {

		const key = app.getURLParams('key')

		if ( key != null ) {

			xr.get('https://interactive.guim.co.uk/docsdata/' + key + '.json?t=' + new Date().getTime()).then((resp) => {

				let boundary = app.topojson.find((datum) => datum.name === resp.data.sheets.settings[0].boundary)

				app.gis(resp.data.sheets, boundary.url, boundary.key)

			});

		}

	},

	getURLParams: (paramName) => {

		const params = window.location.search.substring(1).split("&")

	    for (let i = 0; i < params.length; i++) {
	    	let val = params[i].split("=");
		    if (val[0] == paramName) {
		        return val[1];
		    }
		}
		return null;

	},

	gis: (data, url, id) => {

		xr.get(url).then((resp) => {

			new Choropleth(data, resp.data, id)

		});

	}

}

app.init()




