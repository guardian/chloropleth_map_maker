
import { autocomplete, niceNumber, mustache, contains, splitArray } from '../modules/belt'
import template from '../../templates/template.html'
//import modplate from '../../templates/modal.html'
import * as d3 from "d3"
import * as topojson from "topojson"
// Comment out ractive before deploying
import Ractive from 'ractive'
//import ractiveFade from 'ractive-transitions-fade'
import ractiveTap from 'ractive-events-tap'
//import Modal from '../modules/modal'


const wait = ms => new Promise(res => setTimeout(res, ms));


export class Choropleth {
	constructor(data, boundaries, overlay, basemap, places, modal, key, codes, place) {
        //console.log(overlay, basemap)


        var self = this

        this.database = data

        this.boundaries = boundaries

        this.overlay = overlay

        this.basemap = basemap

        this.places = places

        this.place = place

        // Add CSS style for highlighted paths if it doesn't exist
        if (!document.querySelector('#choropleth-highlight-style')) {
            const style = document.createElement('style');
            style.id = 'choropleth-highlight-style';
            style.textContent = `
                .mapArea.highlighted {
                    opacity: 0.5;
                }
            `;
            document.head.appendChild(style);
        }

        if (this.database.settings[0].filter!="") {

            let filters = this.database.settings[0].filter.split(",")

            filters = filters.map(item => item.trim())

            if (filters.length == 2) {

                let features = places.features.filter(item => {

                    return item.properties[filters[0]] == filters[1]
                    
                })

                this.places.features = features

            }

        }

        if (this.database.settings[0].search!="") {

            if (this.database.settings[0].search.toLowerCase() == 'true') {

                this.database.displaySearch = true

            } else {

                this.database.displaySearch = false

            }

        } else {

            this.database.displaySearch = false
            
        }

        this.database.currentIndex = 0

        this.database.locationIndex = 0

        this.zoomLevel = 1

        this.database.showKey = true

        // Remove this when we can do a settings.json merge like in superyacht


        if ("showKey" in self.database.mapping[0]) {
            if (self.database.mapping[0]['showKey'] != "") {
                this.database.showKey = self.database.mapping[0]['showKey'] == "TRUE" ? true : false;
            }
        }

        this.database.showLabels = true

        if ("showLabels" in self.database.mapping[0]) {
            if (self.database.mapping[0]['showLabels'] != "") {
                this.database.showLabels = self.database.mapping[0]['showLabels'] == "TRUE" ? true : false;
            }
        }

        console.log("showLabels", this.database.showLabels)
        //this.toolbelt = new Toolbelt()

        /*
        Create a set of keys based on the JSON from the Googledoc data table
        */

        this.database.keys = Object.keys( this.database.data[0] )
        // console.log(this.database.keys)

        this.id = this.database.keys[0]
        // console.log(this.id)
        /*
        Remove the ID column which is going to be used to map 
        items to their corresponding 
        boundaries in the topojson
        */

        this.database.keys = this.database.keys.filter(key => key !== this.id)

        /*
        Specify if the graphic requires a dropdown menu
        based on whether the Google doc contains more
        than one column (excluding the noew delted ID column)
        */

        this.database.dropdown = (self.database.mapping.map( (item) => item.data).length > 1) ? true : false ;

        if (self.database.mapping[0].scale === 'swing') {

            this.database.dropdown = false

        }

        this.database.relocate = (self.database.locations.map( (item) => item.data).length > 1) ? true : false ;

        
        /*
        Convert all the datum that looks like a number in the data columns to intergers 
        */

        this.database.data.forEach( item => {

            for (let i = 0; i < self.database.keys.length; i++) {

                if (!isNaN(item[self.database.keys[i]])) {
                    if (item[self.database.keys[i]] === "") {
                        item[self.database.keys[i]] = null
                    }
                    else if (typeof item[self.database.keys[i]] === 'string' || item[self.database.keys[i]] instanceof String) {
                        item[self.database.keys[i]] = +item[self.database.keys[i]]
                    }
                    // item[self.database.keys[i]] = (item[self.database.keys[i]]!="") ? +item[self.database.keys[i]] : null ;
                }
                
            }

        });


        // this.hasLabels = (self.database.labels.length > 0) ? true : false ;

        /*
        Get the name of the topojson object
        */
        console.log("data",this.database.data)
        this.database.topoKey = Object.keys( this.boundaries.objects )[0]

        console.log("topokey",this.database.topoKey)
        this.boundaryID = Object.keys( this.boundaries.objects[this.database.topoKey].geometries[0].properties)[0]

        //console.log(this.database.settings[0])

        if ("boundaryID" in this.database.settings[0]) {
            if (this.database.settings[0].boundaryID!="") {

                this.boundaryID = this.database.settings[0].boundaryID
            }
        }

        

        //console.log(this.boundaryID)
        if (overlay) {
            this.overlayTopoKey = Object.keys( this.overlay.objects )[0]
            this.overlayID = Object.keys( this.overlay.objects[this.overlayTopoKey].geometries[0].properties)[0]
        }
        
        if (basemap) {
            this.basemapTopoKey = Object.keys( this.basemap.objects )[0]
        }

        /*
        Merge the row data from the Googledoc data table to its corresponding boundary
        */

        this.boundaries.objects[this.database.topoKey].geometries.forEach( item => {

            item.properties = {...item.properties, ...self.database.data.find((datum) => datum[self.id] === item.properties[self.boundaryID])}

        });

        console.log(boundaries)      
        /*
        Specify the current key
        */

        this.database.currentKey = self.database.mapping[0].data;


        // Centre Lat, Lon, Zoom

        // Defaults to center of Australia, otherwise use set values    

        this.database.centreLat = -28

        this.database.centreLon = 135

        this.database.zoomScale = 0


        try {

            if (self.database.mapping.length > 0) {

                let mapArray = Object.keys(self.database.mapping[0])

                if (contains(mapArray, 'centreLat') && contains(mapArray, 'centreLon') && contains(mapArray, 'zoomScale')) {

                    this.database.centreLat = +self.database.mapping[0].centreLat;

                    this.database.centreLon = +self.database.mapping[0].centreLon;

                    this.database.zoomScale = +self.database.mapping[0].zoomScale;

                }

            }


            if (self.database.locations.length > 0) {

                let locArray = Object.keys(self.database.locations[0])

                if (contains(locArray, 'centreLat') && contains(locArray, 'centreLon') && contains(locArray, 'zoomScale')) {

                    this.database.centreLat = +self.database.locations[0].centreLat;

                    this.database.centreLon = +self.database.locations[0].centreLon;

                    this.database.zoomScale = +self.database.locations[0].zoomScale;

                }

            }

        } catch (error) {
            
          console.log("Add location lat and lng")

          // Expected output: ReferenceError: nonExistentFunction is not defined
          // (Note: the exact output may be browser-dependent)
        }




        
        // rename this to zoomLevel later

        
        



        /*
        Check to see if user is on a mobile.
        If the user is on a mobile lock the map by default
        */

        this.database.zoomOn = true

        var ua = navigator.userAgent.toLowerCase();

        var isAndroid = ua.indexOf("android") > -1;

        var isAndroidApp = (window.location.origin === "file://" && isAndroid || window.location.origin === null && isAndroid || window.location.origin === "https://mobile.guardianapis.com" && isAndroid ) ? true : false ; 

        this.database.isAndroidApp = (isAndroid && !modal) ? true : false ;

        this.database.searchBlock = ""

        this.database.autocompleteArray = []

        this.database.key = key

        this.database.codes = codes

        this.database.displayOverlay = false

        this.database.version = "" //`${window.location.origin}`

        this.ractivate()

	}

    ractivate() {

        var self = this

        
        Ractive.DEBUG = false;
        this.ractive = new Ractive({
            events: { 
                tap: ractiveTap
            },
            el: '#choloropleth',
            data: self.database,
            template: template,
        })

        this.colourizer()
       
        this.createMap()


        if (!this.database.isAndroidApp ) {

            this.resizer()

            this.ractive.observe('currentIndex', function(index) {

                self.database.currentIndex = index

                self.database.currentKey = self.database.mapping[index].data

                self.colourizer()

                self.updateMap()

                self.keygen()

            });

            this.ractive.observe('locationIndex', function(index) {

                self.database.locationIndex = index

                self.reposMap()

            });


        }

        //this.ractive.on( 'view', ( context ) => self.showMap());

        if (!this.database.isAndroidApp ) {

        
            this.ractive.observe( 'searchBlock', ( newValue ) => {


                if (newValue && newValue.length > 2) {

                    self.database.displayOverlay = true

                    self.database.autocompleteArray = autocomplete(newValue, self.database.codes, 'meta')


                } else {

                    self.database.displayOverlay = false

                    self.database.autocompleteArray = []

                }

                self.ractive.set(self.database)

            });


            this.ractive.on( 'keydown', function ( event ) {

                if (event.original.keyCode===13) {

                    if (self.database.autocompleteArray.length > 0) {


                        self.database.autocompleteArray = []

                        self.database.searchBlock = ""

                        self.ractive.set(self.database)

                        self.ractive.set('displayOverlay', true)

                        self.relocate(self.database.autocompleteArray[0])



                        //setTimeout(self.displayMap(), 2000);

                    }

                    event.original.preventDefault()

                }
               

            });

            this.ractive.on('search', (context, data) => {

                self.database.autocompleteArray = []

                self.database.searchBlock = ""

                self.ractive.set(self.database)

                self.ractive.set('displayOverlay', true)

                self.relocate(data)

                //setTimeout(self.displayMap(), 2000);

            })

        }


    }

    displayMap() {

        var self = this

        console.log("Display map")

        self.database.displayOverlay = false

        self.database.autocompleteArray = []

        self.database.searchBlock = ""

        self.ractive.set(self.database)

    }

    async relocate(arr) {

        // https://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object

        // https://observablehq.com/@d3/zoom-to-bounding-box

        // https://www.d3indepth.com/geographic/

        //this.database.zoomOn = false

        var self = this

        d3.select("#suburb").remove()

        let bbox = await getJson(`https://interactive.guim.co.uk/embed/aus/2023/01/australian-air-quality/geojson/${arr.postcode}.geojson`)

        if (bbox) {

            let geojson = {
                "type": "FeatureCollection",
                "features": [ bbox ]
            }

            let [[x0, y0], [x1, y1]] = this.path.bounds(geojson)

            var svg = d3.select("#mapContainer svg")

            svg.transition().duration(750).call(
              self.zoom.transform,
              d3.zoomIdentity
                .translate(self.width / 2, self.height / 2)
                .scale(.7 / Math.max((x1 - x0) / self.width, (y1 - y0) / self.height))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
            );
        
            svg.append("g")
            .attr("id","suburb")
            .selectAll("path")
            .data(geojson.features)
            .join("path")
            .attr("d",self.path)
            .attr("class", "burbs")
            .attr("stroke-width", 1)
            .attr("stroke", "black")
            .attr("stroke-dasharray", "5,5")
            .attr("fill", "none")

            await wait(1500);

             self.ractive.set('displayOverlay', false)

        } else {

            console.log("Missing postcode")

            self.ractive.set('displayOverlay', false)

        }

    }

    resizer() {

        var self = this

        var to = null
        var lastWidth = document.querySelector(".interactive-container").getBoundingClientRect()
        window.addEventListener('resize', () => {
            var thisWidth = document.querySelector(".interactive-container").getBoundingClientRect()
            if (lastWidth != thisWidth) {
                window.clearTimeout(to);
                to = window.setTimeout(function() {
                    self.zoomLevel = 1
                    self.createMap()
                    self.updateMap()
                }, 500)
            }
        })
    }

    colourizer() {

        var self = this

        this.scaleType = self.database.mapping[self.database.currentIndex].scale.toLowerCase()

        this.database.election = (this.scaleType === "election") ? true : false ;

        this.database.swing = (this.scaleType === "swing") ? true : false ;

        this.database.key = (this.scaleType != "election" && this.scaleType != "swing") ? true : false ;

        this.keyColors = splitArray(self.database.mapping[self.database.currentIndex].colours);

        this.thresholds = self.database.mapping[self.database.currentIndex].values.split(","); //self.database.key.map( (item) => item.value);

        this.min = d3.min( self.database.data, (item) => item[self.database.currentKey]);

        this.max = d3.max( self.database.data, (item) => item[self.database.currentKey]);

        if (this.thresholds) {
            if (this.thresholds.length == 2) {
                this.min = this.thresholds[0]
                this.max = this.thresholds[1]
            }
        }

        this.median = d3.median( self.database.data, (item) => item[self.database.currentKey]);

        this.mean = d3.mean( self.database.data, (item) => item[self.database.currentKey]);

        this.range = self.database.data.map( (item) => item[self.database.currentKey]);

        if (this.scaleType === "threshold") {
            let thresholds2 = this.thresholds.slice(1, -1); // Remove first and last elements
            console.log("thresholds2", thresholds2)
            console.log("keyColors", self.keyColors)
            this.domain = thresholds2;
            this.color = d3.scaleThreshold().domain(thresholds2).range(self.keyColors)
        }

        else if (this.scaleType === "election") {


                var marginQuint = [6, 12, 18, 24];

                var colBlue = ['rgb(189,215,231)','rgb(107,174,214)','rgb(49,130,189)','rgb(8,81,156)'];
                var colRed = ['rgb(252,174,145)','rgb(251,106,74)','rgb(222,45,38)','rgb(165,15,21)'];
                var colPurple = ['rgb(203,201,226)','rgb(158,154,200)','rgb(117,107,177)','rgb(84,39,143)'];

                var scaleBlue = d3.scaleThreshold()
                                .domain(marginQuint)
                                .range(colBlue);

                var scaleRed = d3.scaleThreshold()
                                .domain(marginQuint)
                                .range(colRed);

                var scalePurple = d3.scaleThreshold()
                                .domain(marginQuint)
                                .range(colPurple); 
        

                this.color = function(margin,party) {
                    if (party === "NAT" | party === "LIB" | party === "LNP") {
                        return scaleBlue(margin)
                    }

                    else if (party === "ALP") {
                        return scaleRed(margin)
                    }

                    else {
                        return scalePurple(margin)
                    }
                }

        }

        //https://interactive.guim.co.uk/embed/iframeable/2019/03/choropleth_map_maker-swingtest-v2/html/index.html
        else if (this.scaleType === "swing") {

            this.colBlue = ['rgb(189,215,231)','rgb(8,81,156)'];

            this.colRed = ['rgb(252,174,145)','rgb(165,15,21)'];

            this.scaleBlue = d3.scaleLinear().domain([0, 10]).range(self.colBlue);

            this.scaleRed = d3.scaleLinear().domain([0, 10]).range(self.colRed);       

            this.color = function(swing, prediction) {

                return (swing < 0) ? self.scaleRed(Math.abs(swing)) : self.scaleBlue(swing) ;               

            }

        } else if (this.scaleType === "ordinal") {

            console.log(self.thresholds, self.keyColors)
            // this.domain = [self.min, self.max]

            this.color = d3.scaleOrdinal().domain(self.thresholds).range(self.keyColors)

        } else if (this.scaleType === "linear median") { // Median

            this.domain = [self.min, self.median, self.max]

            this.color = d3.scaleLinear().domain([self.min, self.median, self.max]).range(self.keyColors);

        } else if (this.scaleType === "linear mean") { // Mean

            this.domain = [self.min, self.mean, self.max]

            this.color = d3.scaleLinear().domain([self.min, self.mean, self.max]).range(self.keyColors);

        } else if (this.scaleType === "quantile") {

            this.domain = [self.min, self.max]

            this.color = d3.scaleQuantile().domain(this.domain).range(self.keyColors);

        } else if (this.scaleType === "quantize") {

            this.domain = [self.min, self.max]

            this.color = d3.scaleQuantize().domain(self.min, self.max).range(self.keyColors);

        } else { // Linear by default

            this.scaleType = "linear"

            this.domain = [self.min, self.max]

            this.color = d3.scaleLinear().domain([self.min, self.max]).range(self.keyColors);

        }

        var output = `Scale type: ${this.scaleType}\nColours: ${self.keyColors}\nThresholds: ${self.thresholds}\nMin: ${this.min}\nMax: ${this.max}\nMedian: ${this.median}\nMean: ${this.mean}\n\n------------------`

    }

    getFill(d) {
        var self = this
        if (self.scaleType != "election"  && self.scaleType != "swing") {

            if (self.scaleType == "threshold" ) {
                
                if (d.properties[self.database.currentKey] === 0 | d.properties[self.database.currentKey] === "0") {
                    return "#FFFFFF";
                }

                else if (d.properties[self.database.currentKey]==null) {
                    return '#dcdcdc';
                } 
                
                else if (typeof d.properties[self.database.currentKey] == 'string') {
                    return "url(#crosshatch)"
                }

                else {
                    return self.color(d.properties[self.database.currentKey])
                }
                
            }

            if (self.scaleType == "ordinal" ) {
                if (d.properties[self.database.currentKey]==null) {
                    return '#dcdcdc';
                } 
                else {
                   
                    return self.color(d.properties[self.database.currentKey])
                }      

            }    

            else {

                if (d.properties[self.database.currentKey]==null) {
                    return '#dcdcdc';
                } 

                else if (typeof d.properties[self.database.currentKey] == 'string') {
                    return "url(#crosshatch)"
                } 
                else {
                   
                    return self.color(d.properties[self.database.currentKey])
                }      
            }
            
        }

        // Special electoral maps

        else if (self.scaleType === "election" ) {
            return (d.properties.Margin!=null) ? self.color(d.properties.Margin, d.properties['Notional incumbent']) : '#dcdcdc' ;   
        }

        else if (self.scaleType === "swing" ) {
            return (d.properties["2PPSwing"]!=null) ? self.color(d.properties["2PPSwing"], d.properties['Prediction']) : '#dcdcdc' ;   
        }
    }

    keygen() {

        var self = this
        var keyLeftMargin = 10
        var keyRightMargin = 20

        // this.scaleType = self.database.mapping[self.database.currentIndex].scale.toLowerCase()
        
        var keyText = null
        if (this.database.mapping[self.database.currentIndex]['keyText']) {
            if (this.database.mapping[self.database.currentIndex]['keyText'] != "") {
                keyText = this.database.mapping[self.database.currentIndex]['keyText']
            }
        }

        if (keyText != null) {
            d3.select("#keyText").html(keyText)    
        }

        this.svgWidth = 300


        if (this.svgWidth > this.width - 10) {
            this.svgWidth = this.width - 10
        }

        this.keyWidth = this.svgWidth - keyRightMargin - keyLeftMargin

        d3.select("#keyContainer").html("");
        d3.select("#keyContainer svg").remove();
        d3.select("#keyContainer1 svg").remove();
        d3.select("#keyContainer2 svg").remove();
        d3.select("#keyContainer3 svg").remove();
        
        this.keySquare = this.keyWidth / 10;

        const barHeight = 15
        const height = 30

        if (this.scaleType === "swing") {

            var value = [0, 2, 4, 6, 8, 10];

            var label = [0, 2, 4, 6, 8, "10+"];   

            this.keyWidth = document.querySelector("#keyContainer1").getBoundingClientRect().width - 10

            this.keySquare = this.keyWidth / 6;

            this.keySvg1 = d3.select("#keyContainer1").append("svg")
                .attr("width", self.svgWidth)
                .attr("height", "40px")
                .attr("id", "keySvg1")

            this.keySvg2 = d3.select("#keyContainer2").append("svg")
                .attr("width", self.svgWidth)
                .attr("height", "40px")
                .attr("id", "keySvg2")

            value.forEach(function(d, i) {

                self.keySvg1.append("rect")
                    .attr("x", self.keySquare * i)
                    .attr("y", 0)
                    .attr("width", self.keySquare)
                    .attr("height", barHeight)
                    .attr("fill", self.scaleBlue(d))
                    .attr("stroke", "#dcdcdc")
            })

            label.forEach(function(d, i) {

                self.keySvg1.append("text")
                    .attr("x", (i) * self.keySquare)
                    .attr("text-anchor", "start")
                    .attr("y", height)
                    .attr("class", "keyLabel").text(d)
            })

            value.forEach(function(d, i) {

                self.keySvg2.append("rect")
                    .attr("x", self.keySquare * i)
                    .attr("y", 0)
                    .attr("width", self.keySquare)
                    .attr("height", barHeight)
                    .attr("fill", self.scaleRed(d))
                    .attr("stroke", "#dcdcdc")
            })

            label.forEach(function(d, i) {

                self.keySvg2.append("text")
                    .attr("x", (i) * self.keySquare)
                    .attr("text-anchor", "start")
                    .attr("y", height)
                    .attr("class", "keyLabel").text(d)
            })  

        }

        if (this.scaleType === "threshold") {

            this.keySvg = d3.select("#keyContainer").append("svg")
                .attr("width", self.svgWidth)
                .attr("height", "40px")
                .attr("id", "keySvg")

            this.keyColors.forEach(function(d, i) {

                self.keySvg.append("rect")
                    .attr("x", (self.keySquare * i) + keyLeftMargin)
                    .attr("y", 0)
                    .attr("width", self.keySquare)
                    .attr("height", barHeight)
                    .attr("fill", d)
                    .attr("stroke", "#dcdcdc")
            })

            var threshLen = this.thresholds.length

            this.thresholds.forEach(function(d, i) {

                // I keep changing this between removing the last figure and not removing it and I can't remember why

                
                    self.keySvg.append("text")
                    .attr("x", (i) * self.keySquare + keyLeftMargin)
                    .attr("text-anchor", "middle")
                    .attr("y", height)
                    .attr("class", "keyLabel").text(niceNumber(d))
                
             
            })

        }

        if (this.scaleType === "linear") {

            this.keySvg = d3.select("#keyContainer").append("svg")
                .attr("width", self.svgWidth)
                .attr("height", "40px")
                .attr("id", "keySvg")

            var legend = this.keySvg.append("defs")
              .append("svg:linearGradient")
              .attr("id", "gradient")
              .attr("x1", "0%")
              .attr("y1", "100%")
              .attr("x2", "100%")
              .attr("y2", "100%")
              .attr("spreadMethod", "pad");

            legend.append("stop")
              .attr("offset", "0%")
              .attr("stop-color", this.keyColors[0])
              .attr("stop-opacity", 1);

            legend.append("stop")
              .attr("offset", "100%")
              .attr("stop-color", this.keyColors[1])
              .attr("stop-opacity", 1);

           this.keySvg.append("rect")
                .attr("y", 0)
                .attr("x", keyLeftMargin)
              .attr("width", self.keyWidth)
              .attr("height", barHeight)
              .style("fill", "url(#gradient)")

            self.keySvg.append("text")
                .attr("x", 10)
                .attr("y", height)
                .attr("class", "keyLabel").text(niceNumber(this.min))  

            self.keySvg.append("text")
                .attr("x", self.keyWidth + keyLeftMargin)
                .attr("text-anchor", "end")
                .attr("y", height)
                .attr("class", "keyLabel").text(niceNumber(this.max))      

        }


        if (this.scaleType === "ordinal") {
            var html = '';

            this.thresholds.forEach(function(d, i) {
                    
                    html += '<div class="keyDiv"><span class="keyCircle" style="background: ' + self.keyColors[i] + '"></span>';
                    html += ' <span class="keyText">' + d  + '</span></div>';
                })

            d3.select('#keyContainer').html(html);
        }

        if (this.scaleType === "quantile") {

            this.keySvg = d3.select("#keyContainer").append("svg")
                .attr("width", self.keyWidth)
                .attr("height", "40px")
                .attr("id", "keySvg")

            this.keyColors.forEach(function(d, i) {

                self.keySvg.append("rect")
                    .attr("x", (self.keySquare * i) + keyLeftMargin) 
                    .attr("y", 0)
                    .attr("width", self.keySquare)
                    .attr("height", 15)
                    .attr("fill", d)
                    .attr("stroke", "#dcdcdc")
            })

            self.keySvg.append("text")
                .attr("x", 0)
                .attr("text-anchor", "start")
                .attr("y", 30)
                .attr("class", "keyLabel").text(this.min)
        
            self.keySvg.append("text")
                .attr("x", this.keyWidth)
                .attr("text-anchor", "end")
                .attr("y", 30)
                .attr("class", "keyLabel").text(niceNumber(this.max))    

        }

        if (this.scaleType === "election") { 

            var marginQuint = [0, 6, 12, "18+"];

            var colBlue = ['rgb(189,215,231)','rgb(107,174,214)','rgb(49,130,189)','rgb(8,81,156)'];
            var colRed = ['rgb(252,174,145)','rgb(251,106,74)','rgb(222,45,38)','rgb(165,15,21)'];
            var colPurple = ['rgb(203,201,226)','rgb(158,154,200)','rgb(117,107,177)','rgb(84,39,143)'];

            this.keyWidth = document.querySelector("#keyContainer1").getBoundingClientRect().width - 10

            this.keySquare = this.keyWidth / 6;

            this.keySvg1 = d3.select("#keyContainer1").append("svg")
                .attr("width", self.keyWidth)
                .attr("height", "40px")
                .attr("id", "keySvg1")

            this.keySvg2 = d3.select("#keyContainer2").append("svg")
                .attr("width", self.keyWidth)
                .attr("height", "40px")
                .attr("id", "keySvg2")
                
            this.keySvg3 = d3.select("#keyContainer3").append("svg")
                .attr("width", self.keyWidth)
                .attr("height", "40px")
                .attr("id", "keySvg3")        

            colBlue.forEach(function(d, i) {

                self.keySvg1.append("rect")
                    .attr("x", self.keySquare * i)
                    .attr("y", 0)
                    .attr("width", self.keySquare)
                    .attr("height", barHeight)
                    .attr("fill", d)
                    .attr("stroke", "#dcdcdc")
            })

            marginQuint.forEach(function(d, i) {

                self.keySvg1.append("text")
                    .attr("x", (i) * self.keySquare)
                    .attr("text-anchor", "start")
                    .attr("y", height)
                    .attr("class", "keyLabel").text(niceNumber(d))
            })

            colRed.forEach(function(d, i) {

                self.keySvg2.append("rect")
                    .attr("x", self.keySquare * i)
                    .attr("y", 0)
                    .attr("width", self.keySquare)
                    .attr("height", barHeight)
                    .attr("fill", d)
                    .attr("stroke", "#dcdcdc")
            })

            marginQuint.forEach(function(d, i) {

                self.keySvg2.append("text")
                    .attr("x", (i) * self.keySquare)
                    .attr("text-anchor", "start")
                    .attr("y", height)
                    .attr("class", "keyLabel").text(niceNumber(d))
            }) 

            colPurple.forEach(function(d, i) {

               
                self.keySvg3.append("rect")
                    .attr("x", self.keySquare * i)
                    .attr("y", 0)
                    .attr("width", self.keySquare)
                    .attr("height", barHeight)
                    .attr("fill", d)
                    .attr("stroke", "#dcdcdc")
            })

            marginQuint.forEach(function(d, i) {

                self.keySvg3.append("text")
                    .attr("x", (i) * self.keySquare)
                    .attr("text-anchor", "start")
                    .attr("y", height)
                    .attr("class", "keyLabel").text(niceNumber(d))
            })     

        }

    }

    placeNames() {

        var self = this

        var placeLabelThreshold = 1

        if (self.width <= 620) {
            placeLabelThreshold = 1
        }

        d3.selectAll(`.labels`)
            .style("display", (d) => { 

                return (d.properties.scalerank - placeLabelThreshold < self.zoomLevel -1) ? "block" : "none"

            })
            .style("font-size", (d) => { return 11 / self.zoomLevel + "px"})
            .attr("x", (d) => self.projection([d.properties.longitude, d.properties.latitude])[0])
            .attr("y", (d) => self.projection([d.properties.longitude, d.properties.latitude])[1])
    }



    createMap() {

        var self = this

        this.width = document.querySelector("#mapContainer").getBoundingClientRect().width

        this.height = (this.width < 500) ?  this.width * 0.8 : this.width * 0.6 ;

        var margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }

        var active = d3.select(null);

        var scaleFactor = 0.85;

        if (self.place == "world") {
            scaleFactor = 0.17
        }

        self.projection = d3.geoMercator()
            .center([self.database.centreLon, self.database.centreLat])
            .scale(self.width * scaleFactor)
            .translate([self.width / 2, self.height / 2])

        var path = d3.geoPath().projection(self.projection);

        this.path = path

        var graticule = d3.geoGraticule();

        const maxZoom = 300
        
        this.zoom = d3.zoom().scaleExtent([1, maxZoom]).on("zoom", zoomed);

        d3.select("#mapContainer svg").remove();

        var svg = d3.select("#mapContainer").append("svg")
            .attr("width", self.width)
            .attr("height", self.height)
            .attr("id", "map")
            //.attr("overflow", "hidden")
            .on("mousemove", function() {
                const event = d3.event || window.event;
                updateTooltipPosition(event);
            });

        if (self.database.zoomOn) {
            console.log("Zoom")
            svg.call(self.zoom)
        }

        svg.append("svg:defs").append("svg:marker")
            .attr("id", "triangle")
            .attr("refX", 6)
            .attr("refY", 6)
            .attr("markerWidth", 30)
            .attr("markerHeight", 30)
            .attr("markerUnits","userSpaceOnUse")
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 12 6 0 12 3 6")
            .style("fill", "black");

        var crosshatch = svg.append("defs")
            .append("pattern")
              .attr("id", "crosshatch")
              .attr("patternUnits", "userSpaceOnUse")
              .attr("width", 10)
              .attr("height", 10);
          
        // Append lines to the pattern for crosshatching

        crosshatch.append("path")
              .attr("d", "M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2")
              .attr("stroke", "black")
              .attr("stroke-width", 1)
              .attr("shape-rendering", "auto");      

        var tooltip = d3.select("#mapContainer").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("z-index", "20")
            .style("visibility", "hidden")
            .style("top", "30px")
            .style("left", "55px")
            .html("<div id='overlay'></div><div id='tooltip'></div>")
        
        var features = svg.append("g")

        features.append("path").datum(graticule)
            .attr("class", "graticule")
            .attr("d", path);


        // console.log("topoKey",self.database.topoKey)    
        
          // features.append("g").selectAll("path").data(topojson.feature(self.boundaries, self.boundaries.objects[self.database.topoKey]).features).enter().append("path")
          //   .attr("class", `_${self.database.topoKey} mapArea`)

        var geoLayers = features.append("g")
                            .attr("id", "geoLayers")

        if (this.basemap) {
            geoLayers.append("g").selectAll("path")
            .data(topojson.feature(self.basemap, self.basemap.objects[this.basemapTopoKey]).features).enter().append("path")
            .attr("class", "basemap")
            .style("fill",'#dcdcdc')
            .attr("d",path)
            .attr("stroke-width", 1)
            .attr("stroke", null)
        } 


        geoLayers.append("g").selectAll("path").data(topojson.feature(self.boundaries, self.boundaries.objects[this.database.topoKey]).features).enter().append("path")
            .attr("class", self.database.topoKey + " mapArea")
            .attr("fill", function(d) {
                return self.getFill(d)
            })
            .attr("d",path)
            .on("mouseover", tooltipIn)
            .on("mousemove", function(d) {
                const event = d3.event || window.event;
                updateTooltipPosition(event);
            })
            .on("mouseout", tooltipOut);
        
        if (self.width > 480) {
             geoLayers.append("path")
            .attr("class", "mesh")
            .attr("stroke-width", 0.5)
            .attr("d", path(topojson.mesh(self.boundaries, self.boundaries.objects[this.database.topoKey])));
        }    

        
        if (this.overlay) {
            geoLayers.append("g").selectAll("path")
            .data(topojson.feature(self.overlay, self.overlay.objects[this.overlayTopoKey]).features)
            .enter()
            .append("path")
            .attr("class", "overlay")
            .style("fill", "transparent")
            .attr("d", path)
            .attr("stroke-width", 1)
            .attr("stroke", "#000")
            .style("pointer-events", "all")
            .on("mouseover", passThru)
            .on("mousemove", passThru)
            .on("mouseout", tooltipOut);
        } 

        // geoLayers
        //     .on("mouseover", tooltipIn)
        //     .on("mouseout", tooltipOut)


        function passThru(d, i, nodes) {
            // Get the current event
            const event = d3.event || window.event;
            
            // Store the overlay data
            var overlayData = d;
            
            // Temporarily disable pointer events on this element
            var prev = this.style.pointerEvents;
            this.style.pointerEvents = 'none';
            
            // Get the element below
            var element = document.elementFromPoint(event.clientX, event.clientY);
            
            // Restore pointer events immediately to prevent mouse event issues
            this.style.pointerEvents = prev;
            
            // If we found an element and it's a map area
            if (element && element.classList.contains('mapArea')) {
                // Remove highlight from all paths
                d3.selectAll('.mapArea').classed('highlighted', false);
                // Add highlight to current path
                d3.select(element).classed('highlighted', true);
                
                // Get the data from the underlying element
                var baseData = d3.select(element).datum();
                
                // Show combined tooltip
                d3.select(".tooltip")
                    .style("visibility", "visible")
                    .select("#tooltip")
                    .html(() => {
                        // Combine data from both layers
                        let baseHtml = baseData.properties[self.database.currentKey] !== null ? 
                            mustache(self.database.mapping[self.database.currentIndex].tooltip, {...utilities, ...baseData.properties}) :
                            "No data available";
                            
                        let overlayHtml = overlayData.properties ? 
                            mustache(self.database.mapping[self.database.currentIndex].overlayTooltip, {...utilities, ...overlayData.properties}) :
                            "";
                            
                        return `${overlayHtml}<hr style="margin: 5px 0;">${baseHtml}`;
                    });

                // Update tooltip position
                updateTooltipPosition(event);
            } else {
                // If we're not over a map area, remove all highlights
                d3.selectAll('.mapArea').classed('highlighted', false);
            }
            
            // Prevent event from continuing
            event.stopPropagation();
        }

        function updateTooltipPosition(event) {
            if (!event) return;
            
            const containerRect = d3.select("#mapContainer").node().getBoundingClientRect();
            const relativeX = event.clientX - containerRect.left;
            const relativeY = event.clientY - containerRect.top;
            const half = self.width / 2;

            if (relativeX < half) {
                d3.select(".tooltip").style("left", relativeX + "px");
            } else {
                d3.select(".tooltip").style("left", (relativeX - 200) + "px");
            }

            if (relativeY < (self.height / 2)) {
                d3.select(".tooltip").style("top", (relativeY + 30) + "px");
            } else {
                d3.select(".tooltip").style("top", (relativeY - 120) + "px");
            }
        }

        function tooltipOut(d) {
            const event = d3.event || window.event;
            // Add a small delay to prevent flickering when moving between features
            setTimeout(() => {
                // Check if we're still outside both layers
                var elementAtPoint = document.elementFromPoint(event.clientX, event.clientY);
                if (!elementAtPoint?.classList.contains('mapArea') && 
                    !elementAtPoint?.classList.contains('overlay')) {
                    d3.select(".tooltip").style("visibility", "hidden");
                    // Remove highlight from all paths when truly leaving the map area
                    d3.selectAll('.mapArea').classed('highlighted', false);
                }
            }, 100);
        }

        function tooltipIn(d) {
            d3.select(".tooltip").style("visibility", "visible");
            
            // Remove highlight from all paths
            d3.selectAll('.mapArea').classed('highlighted', false);
            // Add highlight to current path
            d3.select(this).classed('highlighted', true);

            if (d.properties[self.database.currentKey] === 0) {
                d.properties[self.database.currentKey] = "0";
                d3.select("#tooltip").html(mustache(self.database.mapping[self.database.currentIndex].tooltip, {...utilities, ...d.properties}));
            } else if (d.properties[self.database.currentKey] === undefined) {
                d3.select("#tooltip").html("No data available");
            } else {
                d3.select("#tooltip").html((d.properties[self.database.currentKey] === null) ? 
                    "No data available" : 
                    mustache(self.database.mapping[self.database.currentIndex].tooltip, {...utilities, ...d.properties}));
            }
        }

        var placeLabelThreshold = 1

        if (self.width <= 620) {
            placeLabelThreshold = 1
        }

        if (self.database.showLabels) {
            features.selectAll("text")
            .data(self.places.features)
            .enter()
            .append("text")
            .text((d) => d.properties.name)
            .attr("x", (d) => self.projection([d.properties.longitude, d.properties.latitude])[0])
            .attr("y", (d) => self.projection([d.properties.longitude, d.properties.latitude])[1])
            .attr("class","labels")
            .style("display", (d) => { 

                return (d.properties.scalerank - placeLabelThreshold < self.zoomLevel - 1) ? "block" : "none"

            })
        }
       


        svg.on("click", function() {
            console.log(self.projection.invert(d3.mouse(this)), self.zoomLevel)
        })



        this.keygen()

        //145.4866862   -22.2187986 145.4866862 -22.2187986

        /*
        if (self.hasLabels) {

            for (var i = 0; i < self.database.labels.length; i++) {

                console.log("Added one label")

                features.append("line")
                    .attr("x1",  self.projection([+self.database.labels[i].lon_end, +self.database.labels[i].lat_end])[0])
                    .attr("y1", self.projection([+self.database.labels[i].lon_end, +self.database.labels[i].lat_end])[1])
                    .attr("x2", self.projection([+self.database.labels[i].lon_start, +self.database.labels[i].lat_start])[0])
                    .attr("y2", self.projection([+self.database.labels[i].lon_start, +self.database.labels[i].lat_start])[1])

                    .attr("stroke-width", 1)
                    .attr("stroke", "black")
                    .attr("marker-end", "url(#triangle)")

                features.append("text")
                    .text((d) => self.database.labels[i].text)
                    .attr("x", self.projection([+self.database.labels[i].lon_end, +self.database.labels[i].lat_end])[0] + 10)
                    .attr("y", self.projection([+self.database.labels[i].lon_end, +self.database.labels[i].lat_end])[1] + 10)
                    .attr("class","labels")


            }

        }*/
   
        var utilities = {

            commas: function(num) {
                var result = parseFloat(this[num]).toFixed();
                result = result.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
                return result
            },

            big: function(big) {

                var num = parseFloat(this[big]);

                if ( num > 0 ) {
                    if ( num > 1000000000 ) { return ( num / 1000000000 ).toFixed(1) + 'bn' }
                    if ( num > 1000000 ) { return ( num / 1000000 ).toFixed(1) + 'm' }
                    if (num % 1 != 0) { return num.toFixed(2) }
                    else { return num.toLocaleString() }
                }

                if ( num < 0 ) {
                    var posNum = num * -1;
                    if ( posNum > 1000000000 ) return [ "-" + String(( posNum / 1000000000 ).toFixed(1)) + 'bn'];
                    if ( posNum > 1000000 ) return ["-" + String(( posNum / 1000000 ).toFixed(1)) + 'm'];
                    else { return num.toLocaleString() }
                }

                return num;

            },

            decimals: function(items) {
                var nums = items.split(",")
                return parseFloat(this[nums[0]]).toFixed(nums[1]);
            }

        }

        d3.select("#zoomIn").on("click", function(d) {
            self.zoom.scaleBy(svg.transition().duration(750), 1.5);
        });

        d3.select("#zoomOut").on("click", function(d) {
            self.zoom.scaleBy(svg.transition().duration(750), 1 / 1.5);
        });

        /*

        d3.select("#zoomToggle").on("click", function(d) {
            toggleZoom();
        });

        */

        self.zoom.scaleBy(svg, self.database.zoomScale);

        /*

        function toggleZoom() {
            if (self.database.zoomOn == false) {
                d3.select("#zoomToggle").classed("zoomLocked", false)
                d3.select("#zoomToggle").classed("zoomUnlocked", true)
                svg.call(self.zoom);
                self.database.zoomOn = true
            } else if (self.database.zoomOn == true) {
                svg.on('.zoom', null);
                d3.select("#zoomToggle").classed("zoomLocked", true)
                d3.select("#zoomToggle").classed("zoomUnlocked", false)
                self.database.zoomOn = false
            } else if (self.database.zoomOn == null) {
                svg.on('.zoom', null);
                d3.select("#zoomToggle").classed("zoomLocked", true)
                d3.select("#zoomToggle").classed("zoomUnlocked", false)
                svg.call(self.zoom);
                self.database.zoomOn = false
            }
        }

        */

        function zoomed(event) {


            console.log("Zoom it")


            scaleFactor = d3.event.transform.k;
            d3.selectAll(".mesh").style("stroke-width", 0.5 / d3.event.transform.k + "px");
            d3.selectAll(".burbs").style("stroke-width", 0.5 / d3.event.transform.k + "px").attr("stroke-dasharray", `${2 / d3.event.transform.k }, ${2 / d3.event.transform.k }`)
            d3.selectAll("#suburb").attr("transform", d3.event.transform);
            features.style("stroke-width", 0.5 / d3.event.transform.k + "px");
            features.selectAll(".overlay").attr("stroke-width", 1 / d3.event.transform.k + "px");
            features.attr("transform", d3.event.transform);
            features.selectAll(".placeContainers").style("display", function(d) {
                return (d['properties']['scalerank'] - 3 < d3.event.transform.k) ? "block" : "none" ;
            })

            d3.select('#crosshatch')
                .attr('patternTransform', 'scale(' + 1 / d3.event.transform.k + ')');

            features.selectAll(".placeText")
                .style("font-size", 0.8 / d3.event.transform.k + "rem")
                .attr("dx", 5 / d3.event.transform.k)
                .attr("dy", 5 / d3.event.transform.k);

            clearTimeout(document.body.data)

            var now = d3.event.transform.k;

            //console.log(self.projection.invert([d3.event.transform.y, d3.event.transform.x]))



            document.body.data = setTimeout( function() { 

                if (now!=self.zoomLevel) {
                    self.zoomLevel = now
                    self.placeNames()
                }

            }, 200);

        }

        function reset() {
            active.classed("active", false);
            active = d3.select(null);
            svg.transition().duration(750).call(self.zoom.transform, d3.zoomIdentity);
        }

    }

    updateMap() {
        console.log("update map")
        var self = this

        d3.selectAll(`.${self.database.topoKey}`).transition("changeFill")
            .attr("fill", (d) => self.getFill(d))

    }


    reposMap() {

        var self = this

        console.log("Repo")

        var newCentreLat = +self.database.locations[self.database.locationIndex].centreLat
        var newCentreLon = +self.database.locations[self.database.locationIndex].centreLon
        var point = self.projection([newCentreLon, newCentreLat])
        var zoomScale = +self.database.locations[self.database.locationIndex].zoomScale

        if (newCentreLon) {
             console.log(newCentreLat, newCentreLon, zoomScale, self.projection(newCentreLon))

            d3.select("#mapContainer svg").transition().duration(750).call(
              self.zoom.transform,
              d3.zoomIdentity.translate(self.width / 2, self.height / 2).scale(zoomScale).translate(-point[0], -point[1])
            );
        }
       

    }

    /* // Old scool before we split into two dropdown paths... 
    updateMap() {

        var self = this

        d3.selectAll(`.${self.database.topoKey}`).transition("changeFill")
            .attr("fill", (d) => { return (d.properties[self.database.currentKey]!=null) ? self.color(d.properties[self.database.currentKey]) : 'lightgrey' })

        var newCentreLat = +self.database.mapping[self.database.currentIndex].centreLat
        var newCentreLon = +self.database.mapping[self.database.currentIndex].centreLon
        var point = self.projection([newCentreLon, newCentreLat])
        var zoomScale = +self.database.mapping[self.database.currentIndex].zoomScale

        if (newCentreLon) {
             console.log(newCentreLat, newCentreLon, zoomScale, self.projection(newCentreLon))

            d3.select("#mapContainer svg").transition().duration(750).call(
              self.zoom.transform,
              d3.zoomIdentity.translate(self.width / 2, self.height / 2).scale(zoomScale).translate(-point[0], -point[1])
            );
        }
       

    }
    */

	
}

async function getJson(url) {
  return fetch(`${url}`).then(r => r.json().catch( () => false))
}
