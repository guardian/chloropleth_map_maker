import * as d3 from "d3"
import { Choropleth } from './modules/choropleth'

const app = {

	topojson: [{
		"name": "federal",
		"url": "https://interactive.guim.co.uk/gis/australian_federal_electorates.json",
		"key": "boundary"
	}, {
		"name": "sa2",
		"url": "https://interactive.guim.co.uk/gis/sa2.json",
		"key": "SA2_MAIN16"
	}, {
		"name": "sa3",
		"url": "https://interactive.guim.co.uk/gis/sa3.json",
		"key": "SA3_NAME16"
	}, {
		"name": "sa4",
		"url": "https://interactive.guim.co.uk/gis/sa4.json",
		"key": "SA4_CODE16"
	}, {
		"name": "nz_sa2",
		"url": "https://interactive.guim.co.uk/gis/nz_sa2.json",
		"key": "SA22019_V1"
	}, {
		"name": "act-suburbs",
		"url": "https://interactive.guim.co.uk/gis/act-suburbs.json",
		"key": "suburbs-ac"
	}, {
		"name": "lga-2020",
		"url": "https://interactive.guim.co.uk/gis/lga-2020.json",
		"key": "LGA_CODE20"
	}, {
		"name": "lga-2011",
		"url": "https://interactive.guim.co.uk/gis/lga-2011.json",
		"key": "LGA_CODE11"
	}, {
		"name": "lga16",
		"url": "https://interactive.guim.co.uk/gis/lga16.json",
		"key": "LGA_CODE16"
	}, {
		"name": "gdam",
		"url": "https://interactive.guim.co.uk/gis/gdam.json",
		"key": "GID_2"
	}, {
		"name": "nsw-lhd",
		"url": "https://interactive.guim.co.uk/gis/nsw-lhd.json",
		"key": "LHN_Code"
	},
	{
		"name": "postcodes-2021",
		"url": "https://interactive.guim.co.uk/gis/POA_2021.json",
		"key": "POA_CODE21"
	}
	],

	init: () => {

		const key = app.getURLParams('key')

		if ( key != null ) {

			app.loader(key)

		} else {

			// This is for testing only
			app.loader("1AN4rZITFr7zJAxyfbuqL5GkxeJnAIoHUcpPMuIFDCdI")
			
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
		let place = data.settings[0].place

		place = (place===undefined) ? 'au' : place ;

		// console.log(place)

		// console.log(boundary)
		// Promise.all([
  //           d3.json(`<%= path %>/assets/places_${place}.json`)
  //       ])
  //       .then((places) =>  {
            
  //       });

  		app.gis(data, boundary_url, overlay_url, place)

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

	gis: (data, boundary_url, overlay_url, place) => {

		if (overlay_url) {
			Promise.all([
            	d3.json(boundary_url),
            	d3.json(overlay_url),
            	d3.json(`<%= path %>/assets/places_${place}.json`)
        		])
        .then((resp) =>  {
            new Choropleth(data, resp[0], resp[1], resp[2])
        });
		}

		else {
			Promise.all([
            	d3.json(boundary_url),
            	d3.json(`<%= path %>/assets/places_${place}.json`)
        		])
        .then((resp) =>  {
            new Choropleth(data, resp[0], null, resp[2])
        });
		}
       

	}

}

app.init()




