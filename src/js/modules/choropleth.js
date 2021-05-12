import { Toolbelt } from '../modules/toolbelt'
import template from '../../templates/template.html'
import * as d3 from "d3"
import * as topojson from "topojson"
// Comment out ractive before deploying
import Ractive from 'ractive'

export class Choropleth {

	constructor(data, boundaries, id, places) {
        console.log(places)
        var self = this

        this.database = data

        this.boundaries = boundaries

        this.boundaryID = id

        this.places = places

        this.database.currentIndex = 0

        this.zoomLevel = 1

        this.toolbelt = new Toolbelt()

        /*
        Create a set of keys based on the JSON from the Googledoc data table
        */

        this.database.keys = Object.keys( this.database.data[0] )

        /*
        Remove the ID column which is going to be used to map 
        items to their corresponding 
        boundaries in the topojson
        */

        this.database.keys = this.database.keys.filter(key => key !== 'id')

        /*
        Specify if the graphic requires a dropdown menu
        based on whether the Google doc contains more
        than one column (excluding the noew delted ID column)
        */

        this.database.dropdown = (self.database.mapping.map( (item) => item.data).length > 1) ? true : false ;

        if (self.database.mapping[0].scale === 'swing') {

            this.database.dropdown = false

        }
        
        /*
        Convert all the datum that looks like a number in the data columns to intergers 
        */

        this.database.data.forEach( item => {

            for (let i = 0; i < self.database.keys.length; i++) {

                if (!isNaN(item[self.database.keys[i]])) {
                    item[self.database.keys[i]] = (item[self.database.keys[i]]!="") ? +item[self.database.keys[i]] : null ;
                }
                
            }

        });

        console.log

        // this.hasLabels = (self.database.labels.length > 0) ? true : false ;

        /*
        Get the name of the topojson object
        */

        this.database.topoKey = Object.keys( this.boundaries.objects )[0]

        /*
        Merge the row data from the Googledoc data table to its corresponding boundary
        */

        this.boundaries.objects[this.database.topoKey].geometries.forEach( item => {

            item.properties = {...item.properties, ...self.database.data.find((datum) => datum.id === item.properties[self.boundaryID])}

        });

        /*
        Specify the current key
        */

        this.database.currentKey = self.database.mapping[0].data;


        // Centre Lat, Lon, Zoom

        this.database.centreLat = +self.database.mapping[0].centreLat;
        this.database.centreLon = +self.database.mapping[0].centreLon;
        this.database.zoomScale = +self.database.mapping[0].zoomScale;

        /*
        Check to see if user is on a mobile.
        If the user is on a mobile lock the map by default
        */

        this.isMobile = self.toolbelt.mobileCheck()

        this.database.zoomOn = (self.isMobile) ? false : true ;

        this.isAndroidApp = (window.location.origin === "file://" && /(android)/i.test(navigator.userAgent) ) ? true : false ;  

        this.ractivate()

	}

    ractivate() {

        var self = this

        this.colourizer()
        Ractive.DEBUG = /unminified/.test(function(){/*unminified*/});
        this.ractive = new Ractive({
            el: '#choloropleth',
            data: self.database,
            template: template,
        })

        this.ractive.observe('currentIndex', function(index) {

            self.database.currentIndex = index

            self.database.currentKey = self.database.mapping[index].data

            self.colourizer()

            self.updateMap()

            self.keygen()

        });

        this.createMap()

        this.resizer()

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

        this.keyColors = self.database.mapping[self.database.currentIndex].colours.split(",");

        this.thresholds = self.database.mapping[self.database.currentIndex].values.split(","); //self.database.key.map( (item) => item.value);

        this.min = d3.min( self.database.data, (item) => item[self.database.currentKey]);

        this.max = d3.max( self.database.data, (item) => item[self.database.currentKey]);

        this.median = d3.median( self.database.data, (item) => item[self.database.currentKey]);

        this.mean = d3.mean( self.database.data, (item) => item[self.database.currentKey]);

        this.range = self.database.data.map( (item) => item[self.database.currentKey]);

        if (this.scaleType === "threshold") {

            this.domain = self.thresholds

            this.color = d3.scaleThreshold().domain(self.thresholds).range(self.keyColors)

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
        console.log(output)
    }

    keygen() {

        var self = this
        var keyLeftMargin = 10
        var keyRightMargin = 20
        this.svgWidth = 300


        console.log(this.keyWidth)
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

                if (i != threshLen -1) {
                    self.keySvg.append("text")
                    .attr("x", (i + 1 ) * self.keySquare + keyLeftMargin)
                    .attr("text-anchor", "middle")
                    .attr("y", height)
                    .attr("class", "keyLabel").text(self.toolbelt.niceNumber(d))
                }
             
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
                .attr("text-anchor", "middle")
                .attr("y", height)
                .attr("class", "keyLabel").text(self.toolbelt.niceNumber(this.min))  

            self.keySvg.append("text")
                .attr("x", self.keyWidth + keyLeftMargin)
                .attr("text-anchor", "middle")
                .attr("y", height)
                .attr("class", "keyLabel").text(self.toolbelt.niceNumber(this.max))      

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
                .attr("class", "keyLabel").text(self.toolbelt.niceNumber(this.max))    

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
                    .attr("class", "keyLabel").text(self.toolbelt.niceNumber(d))
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
                    .attr("class", "keyLabel").text(self.toolbelt.niceNumber(d))
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
                    .attr("class", "keyLabel").text(self.toolbelt.niceNumber(d))
            })     

        }

    }

    placeNames() {

        var self = this

        var placeLabelThreshold = 2

        if (self.width <= 620) {
            placeLabelThreshold = 1
        }

        console.log("zoom", self.zoomLevel)

        d3.selectAll(`.labels`)
            .style("display", (d) => { 

                return (d.properties.scalerank - placeLabelThreshold < self.zoomLevel) ? "block" : "none"

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

        var scaleFactor = 1;

        self.projection = d3.geoMercator()
            .center([135, -28.0])
            .scale(self.width * 0.85)
            .translate([self.width / 2, self.height / 2])

        var path = d3.geoPath().projection(self.projection);

        var graticule = d3.geoGraticule();

        this.zoom = d3.zoom().scaleExtent([1, 100]).on("zoom", zoomed);

        d3.select("#mapContainer svg").remove();

        var svg = d3.select("#mapContainer").append("svg")
            .attr("width", self.width)
            .attr("height", self.height)
            .attr("id", "map")
            .attr("overflow", "hidden")
            .on("mousemove", tooltipMove)
            .on('onTouchStart', function(currentSwiper, e) {
                if (self.isAndroidApp && window.GuardianJSInterface.registerRelatedCardsTouch) {
                    window.GuardianJSInterface.registerRelatedCardsTouch(true);
                }
            }).on('onTouchEnd', function(currentSwiper, e) {
                if (self.isAndroidApp && window.GuardianJSInterface.registerRelatedCardsTouch) {
                    window.GuardianJSInterface.registerRelatedCardsTouch(false);
                }
            });

        if (self.database.zoomOn) {

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

        var tooltip = d3.select("#mapContainer").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("z-index", "20")
            .style("visibility", "hidden")
            .style("top", "30px")
            .style("left", "55px");
        
        var features = svg.append("g")

        features.append("path").datum(graticule)
            .attr("class", "graticule")
            .attr("d", path);

        console.log("topoKey",self.database.topoKey)    
        
        features.append("g").selectAll("path").data(topojson.feature(self.boundaries, self.boundaries.objects[self.database.topoKey]).features).enter().append("path")
            .attr("class", self.database.topoKey + " mapArea")
            .attr("fill", function(d) {

                if (self.scaleType != "election"  && self.scaleType != "swing") {

                    if (self.scaleType == "threshold" ) {
                        if (d.properties[self.database.currentKey] === 0 | d.properties[self.database.currentKey] === "0") {
                            return "#FFFFFF";
                        }

                        else {
                            return (d.properties[self.database.currentKey]!=null) ? self.color(d.properties[self.database.currentKey]) : 'lightgrey' ;    
                        }
                        
                    }

                    else {
                        return (d.properties[self.database.currentKey]!=null) ? self.color(d.properties[self.database.currentKey]) : 'lightgrey' ;    
                    }
                    
                }

                else if (self.scaleType === "election" ) {
                    return (d.properties.Margin!=null) ? self.color(d.properties.Margin, d.properties['Notional incumbent']) : 'lightgrey' ;   
                }

                else if (self.scaleType === "swing" ) {
                    return (d.properties["2PPSwing"]!=null) ? self.color(d.properties["2PPSwing"], d.properties['Prediction']) : 'lightgrey' ;   
                }

            })
            .attr("d",path)
            .on("mouseover", tooltipIn)
            .on("mouseout", tooltipOut)
        
        if (self.width > 480) {
            features.append("path")
            .attr("class", "mesh")
            .attr("stroke-width", 0.5)
            .attr("d", path(topojson.mesh(self.boundaries, self.boundaries.objects[self.database.topoKey])));
        }

        var placeLabelThreshold = 3

        if (self.width <= 620) {
            placeLabelThreshold = 1
        }

        features.selectAll("text")
            .data(self.places.features)
            .enter()
            .append("text")
            .text((d) => d.properties.name)
            .attr("x", (d) => self.projection([d.properties.longitude, d.properties.latitude])[0])
            .attr("y", (d) => self.projection([d.properties.longitude, d.properties.latitude])[1])
            .attr("class","labels")
            .style("display", (d) => { 

                return (d.properties.scalerank - placeLabelThreshold < self.zoomLevel) ? "block" : "none"

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
   
        function tooltipMove(d) {
            var leftOffset = 0
            var rightOffset = 0
            var mouseX = d3.mouse(this)[0]
            var mouseY = d3.mouse(this)[1]
            var half = self.width / 2;
            if (mouseX < half) {
                d3.select(".tooltip").style("left", d3.mouse(this)[0] + "px");
            } else if (mouseX >= half) {
                d3.select(".tooltip").style("left", (d3.mouse(this)[0] - 200) + "px");
            }

            if (mouseY < (self.height / 2)) {
                d3.select(".tooltip").style("top", (d3.mouse(this)[1] + 30) + "px");
            } else if (mouseY >= (self.height / 2)) {
                d3.select(".tooltip").style("top", (d3.mouse(this)[1] - 120) + "px");
            }
            
        }

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

        function tooltipIn(d) {

            console.log(d.properties[self.database.currentKey])

            if (d.properties[self.database.currentKey]===0) {
                d.properties[self.database.currentKey] = "0";
                d3.select(".tooltip").html(self.toolbelt.mustache(self.database.mapping[self.database.currentIndex].tooltip, {...utilities, ...d.properties})).style("visibility", "visible");
            }

            else if (d.properties[self.database.currentKey]===undefined) {


                d3.select(".tooltip").html("No data available").style("visibility", "visible");
            }

            else {
                d3.select(".tooltip").html((d.properties[self.database.currentKey]===null) ? "No data available" : self.toolbelt.mustache(self.database.mapping[self.database.currentIndex].tooltip, {...utilities, ...d.properties})).style("visibility", "visible");       
            }
            
        
        }

        function tooltipOut(d) {
            d3.select(".tooltip").style("visibility", "hidden");
        }

        d3.select("#zoomIn").on("click", function(d) {
            self.zoom.scaleBy(svg.transition().duration(750), 1.5);
        });

        d3.select("#zoomOut").on("click", function(d) {
            self.zoom.scaleBy(svg.transition().duration(750), 1 / 1.5);
        });

        d3.select("#zoomToggle").on("click", function(d) {
            toggleZoom();
        });

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

        function zoomed() {

            scaleFactor = d3.event.transform.k;
            d3.selectAll(".mesh").style("stroke-width", 0.5 / d3.event.transform.k + "px");
            features.style("stroke-width", 0.5 / d3.event.transform.k + "px");
            features.attr("transform", d3.event.transform);
            features.selectAll(".placeContainers").style("display", function(d) {
                return (d['properties']['scalerank'] - 3 < d3.event.transform.k) ? "block" : "none" ;
            })

            features.selectAll(".placeText")
                .style("font-size", 0.8 / d3.event.transform.k + "rem")
                .attr("dx", 5 / d3.event.transform.k)
                .attr("dy", 5 / d3.event.transform.k);

            clearTimeout(document.body.data)

            var now = d3.event.transform.k;

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

        var self = this

        d3.selectAll(`.${self.database.topoKey}`).transition("changeFill")
            .attr("fill", (d) => { return (d.properties[self.database.currentKey]!=null) ? self.color(d.properties[self.database.currentKey]) : 'lightgrey' })

    }
	
}
