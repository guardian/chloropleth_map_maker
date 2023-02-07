import * as d3 from "d3"
import { Choropleth } from './modules/choropleth'
import template from '../templates/template.json'

const app = {

	topojson: [
	{
		"name": "federal",
		"url": "https://interactive.guim.co.uk/gis/australian_federal_electorates.json",
		"key": "boundary"
	}, 
	{
		"name": "sa2",
		"url": "https://interactive.guim.co.uk/gis/sa2.json",
		"key": "SA2_MAIN16"
	},
	{
		"name": "sa3",
		"url": "https://interactive.guim.co.uk/gis/sa3.json",
		"key": "SA3_NAME16"
	},
	{
		"name": "sa4",
		"url": "https://interactive.guim.co.uk/gis/sa4.json",
		"key": "SA4_CODE16"
	},
	{
		"name": "nz_sa2",
		"url": "https://interactive.guim.co.uk/gis/nz_sa2.json",
		"key": "SA22019_V1"
	},
	{
		"name": "act-suburbs",
		"url": "https://interactive.guim.co.uk/gis/act-suburbs.json",
		"key": "suburbs-ac"
	},
	{
		"name": "lga-2020",
		"url": "https://interactive.guim.co.uk/gis/lga-2020.json",
		"key": "LGA_CODE20"
	},
	{
		"name": "lga-2011",
		"url": "https://interactive.guim.co.uk/gis/lga-2011.json",
		"key": "LGA_CODE11"
	},
	{
		"name": "lga16",
		"url": "https://interactive.guim.co.uk/gis/lga16.json",
		"key": "LGA_CODE16"
	},
	{
		"name": "gdam",
		"url": "https://interactive.guim.co.uk/gis/gdam.json",
		"key": "GID_2"
	},
	{
		"name": "nsw-lhd",
		"url": "https://interactive.guim.co.uk/gis/nsw-lhd.json",
		"key": "LHN_Code"
	},
	{
		"name": "postcodes-2021",
		"url": "https://interactive.guim.co.uk/gis/POA_2021.json",
		"key": "POA_CODE21"
	},
	{
		"name": "frankenstein-renamed",
		"url": 'https://interactive.guim.co.uk/gis/frankenstein.json',
		"key": "id"
	},
	{
		"name": "melb-suburbs",
		"url": 'https://interactive.guim.co.uk/gis/melb_suburbs.json',
		"key": "Suburb"
	},
	{
		"name": "2021_federal_boundaries",
		"url": 'https://interactive.guim.co.uk/gis/2021_federal_boundaries.json',
		"key": "Electorate"
	}],

	init: () => {

		const key = app.getURLParams('key')
		var location = app.getURLParams('location')
		
		if (!location) {
			location = "docsdata"
		}

		if ( key != null ) {

			app.loader(key, location)

		} else {

			// This is for testing only
			app.loader("1nvejFO-_jbIH4o6NoQj-xmTOyPvCHYcu-BsG2go_gqQ")

			
			
		}

	},

	loader: (key, location) => {

        Promise.all([
            d3.json(`https://interactive.guim.co.uk/${location}/${key}.json`)
        ])
        .then((results) =>  {

        	var merged = app.combine(template, results[0])

            app.processor(merged.sheets)
        });


	},

	combine: (to, from) => {

	    for (const n in from) {
	        if (typeof to[n] != 'object') {
	            to[n] = from[n];
	        } else if (typeof from[n] == 'object') {
	            to[n] = app.combine(to[n], from[n]);
	        }
	    }
	    return to;
	},

	processor: (data) => {

		let boundary_url = data.settings[0].boundary
		let overlay_url = null
		if (data.settings[0].overlay) {
			if (data.settings[0].overlay != "") {
				overlay_url = data.settings[0].overlay
			}
			else {
				overlay_url = null
			}
		}

		let basemap_url = null
		if (data.settings[0].basemap) {
			if (data.settings[0].basemap != "") {
				basemap_url = data.settings[0].basemap
			}
			else {
				basemap_url = null
			}
		}



		// let boundary = app.topojson.find((datum) => datum.name === data.settings[0].boundary)
		
		let place = data.settings[0].place

		place = (place===undefined) ? 'au' : place ;


		// console.log(place)

		// console.log(boundary)
		// Promise.all([
  //           d3.json(`<%= path %>/assets/places_${place}.json`)
  //       ])
  //       .then((places) =>  {
            
  //       });

  		app.gis(data, boundary_url, overlay_url, basemap_url, place)

		// Promise.all([
  //           d3.json(`<%= path %>/assets/places_${place}.json`)
  //       ])
  //       .then((places) =>  {
  //           app.gis(data, boundary.url, boundary.key, places[0])
  //       });


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

	gis: (data, boundary_url, overlay_url, basemap_url, place) => {

	
		Promise.all([
			d3.json(boundary_url),
			d3.json(`<%= path %>/assets/places_${place}.json`)
			])
		.then((resp) =>  {
			let boundary = resp[0]
			let places = resp[1]
			let overlay = null
			let basemap = null


			new Choropleth(data, resp[0], resp[1], resp[2], resp[3])
		});


		// if (overlay_url) {
		// 	Promise.all([
        //     	d3.json(boundary_url),
        //     	d3.json(overlay_url),
		// 		d3.json(basemap_url),
        //     	d3.json(`<%= path %>/assets/places_${place}.json`)
        // 		])
        // .then((resp) =>  {
        //     new Choropleth(data, resp[0], resp[1], resp[2], resp[3])
        // });
		// }

		// else {
		// 	Promise.all([
        //     	d3.json(boundary_url),
        //     	d3.json(`<%= path %>/assets/places_${place}.json`)
        // 		])
        // .then((resp) =>  {
        //     new Choropleth(data, resp[0], null, resp[1])
        // });
		// }
       

	}

}

app.init()




