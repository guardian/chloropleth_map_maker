import * as d3 from "d3"
import { Choropleth } from './modules/choropleth'

const app = {

	topojson: [{
		"name" : "federal",
		"url" : "https://interactive.guim.co.uk/gis/australian_federal_electorates.json",
		"key" : "boundary"
	},{
		"name" : "sa2",
		"url" : "https://interactive.guim.co.uk/gis/sa2.json",
		"key" : "SA2_NAME16"
	}], //

	init: () => {

		const key = app.getURLParams('key')

		if ( key != null ) {

			app.loader(key)

		} else {

			// This is for testing only
			app.loader("1to_mCAULU5VxjkgEIRRGvVapcjDu0trb77xNnOVXCN4")
			
		}

	},

	loader: (key) => {

        Promise.all([
            d3.json('https://interactive.guim.co.uk/docsdata/' + key + '.json'),
            d3.json('<%= path %>/assets/places.json')
        ])
        .then((results) =>  {
            app.processor(results[0].sheets,results[1])
        });

	},

	processor: (data, places) => {

		let boundary = app.topojson.find((datum) => datum.name === data.settings[0].boundary)

		app.gis(data, boundary.url, boundary.key, places)

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

	gis: (data, url, id, places) => {

        Promise.all([
            d3.json(url),
        ])
        .then((resp) =>  {
            new Choropleth(data, resp[0], id, places)
        });

	}

}

app.init()




