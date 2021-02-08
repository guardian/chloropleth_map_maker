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
		"key" : "SA2_MAIN16"
	},{
		"name" : "sa3",
		"url" : "https://interactive.guim.co.uk/gis/sa3.json",
		"key" : "SA3_NAME16"
	},
	{
		"name" : "nz_sa2",
		"url" : "https://interactive.guim.co.uk/gis/nz_sa2.json",
		"key" : "SA22019_V1"
	},
	{
		"name" : "act-suburbs",
		"url" : "https://interactive.guim.co.uk/gis/act-suburbs.json",
		"key" : "suburbs-ac"
	},
	{
		"name" : "lga-2020",
		"url" : "https://interactive.guim.co.uk/gis/lga-2020.json",
		"key" : "LGA_CODE20"
	}

	],

	init: () => {

		const key = app.getURLParams('key')

		if ( key != null ) {

			app.loader(key)

		} else {

			// This is for testing only
			app.loader("1ipIxJ_CCQfV3DDqEYdmrKdx3bJQJVkQA1XPtb0gyMmE")
			
		}

	},

	loader: (key) => {

        // Promise.all([
        //     d3.json('https://interactive.guim.co.uk/docsdata/' + key + '.json'),
        //     d3.json('<%= path %>/assets/places_aus.json')
        //     d3.json('<%= path %>/assets/places_nz.json')
        // ])
        // .then((results) =>  {
        //     app.processor(results[0].sheets,results[1],results[2])
        // });

        Promise.all([
            d3.json('https://interactive.guim.co.uk/docsdata/' + key + '.json')
        ])
        .then((results) =>  {
            app.processor(results[0].sheets)
        });


	},

	processor: (data) => {

		let boundary = app.topojson.find((datum) => datum.name === data.settings[0].boundary)
		let place = data.settings[0].place

		console.log(boundary)
		Promise.all([
            d3.json(`<%= path %>/assets/places_${place}.json`)
        ])
        .then((places) =>  {
            app.gis(data, boundary.url, boundary.key, places[0])
        });

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




