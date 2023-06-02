import * as d3 from "d3"
import { Choropleth } from './modules/choropleth'
import template from '../templates/template.json'
import { getURLParams, merge } from './modules/belt'

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

		const key = getURLParams('key')

		var location = getURLParams('location')
		
		if (!location) {

			location = "docsdata"

		}

		if ( key != null ) {

			app.loader(key, location)

		} else {

			app.loader("oz-230515-suburb-population-densification-map", location)

		}

	},

	loader: (key, location) => {

		console.log(`https://interactive.guim.co.uk/${location}/${key}.json`)

		app.key = key

        Promise.all([
            d3.json(`https://interactive.guim.co.uk/${location}/${key}.json`)
        ])
        .then((results) =>  {

        	var merged = merge(template, results[0])

            app.processor(merged.sheets)
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

		let basemap_url = null
		if (data.settings[0].basemap) {
			if (data.settings[0].basemap != "") {
				basemap_url = data.settings[0].basemap
			}
			else {
				basemap_url = null
			}
		}
		
		let place = data.settings[0].place

		place = (place===undefined) ? 'au' : place ;

  		app.gis(data, boundary_url, overlay_url, basemap_url, place)

	},

	gis: (data, boundary_url, overlay_url, basemap_url, place) => {

		const modal = (getURLParams('modal') != null ) ? true : false

		async function doStuff() {

			let boundaries, overlay, basemap, places = null

			boundaries = await d3.json(boundary_url)

			places = await d3.json(`<%= path %>/assets/places_${place}.json`)

			let codes = await d3.json(`https://interactive.guim.co.uk/docsdata/1bClr8buuWUaKj01NolwaJy2JR_SR5hKEAjQoJPaGKcw.json`)

			for (const item of codes.sheets.postcodes) {

			  item.meta = `${item.postcode} ${item.place_name}`

			}

			if (overlay_url) {

				overlay = await d3.json(overlay_url)

			}

			if (basemap_url) {

				basemap = await d3.json(basemap_url)

			}

			new Choropleth(data, boundaries, overlay, basemap, places, modal, app.key, codes.sheets.postcodes)
		}
		
		doStuff()

	}

}

app.init()




