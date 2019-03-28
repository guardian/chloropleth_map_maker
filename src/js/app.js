import xr from 'xr';
import { Choropleth } from './modules/choropleth'

function gis(data) {

	var url = "https://gdn-cdn.s3.amazonaws.com/gis/australian_federal_electorates.json"

	xr.get(url).then((resp) => {

		new Choropleth(data, resp.data, "Elect_div")

	});

}

function getURLParams(paramName) {

	const params = window.location.search.substring(1).split("&") //window.parent.location.search.substring(1).split("&")

    for (let i = 0; i < params.length; i++) {
    	let val = params[i].split("=");
	    if (val[0] == paramName) {
	        return val[1];
	    }
	}
	return null;

}

const key = getURLParams('key')

if ( key != null ) {

	xr.get('https://interactive.guim.co.uk/docsdata/' + key + '.json?t=' + new Date().getTime()).then((resp) => {

		gis(resp.data.sheets)

	});

}