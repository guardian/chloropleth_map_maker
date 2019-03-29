import { Toolbelt } from '../modules/toolbelt'
import template from '../../templates/template.html'
import { $, $$, round, numberWithCommas, wait, getDimensions } from '../modules/util'
import * as d3 from "d3"
import * as topojson from "topojson"
import Ractive from 'ractive'
//import ractiveTap from 'ractive-events-tap'
//https://interactive.guim.co.uk/embed/iframeable/2019/03/choropleth_map_maker/html/index.html?key=1CuIBiaGMSaEPQRj248c9fEMG9T7FIlGUwqW57DG6DOw

export class Choropleth {

	constructor(data, boundaries, id) {

        var self = this

        this.database = data

        this.boundaries = boundaries

        this.boundaryID = id

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
        than one column (excluding the ID column)
        */

        this.database.dropdown = (this.database.keys.length > 1) ? true : false ;

        /*
        Convert all the data to intergers
        */

        this.database.data.forEach( item => {

            for (let i = 0; i < self.database.keys.length; i++) {

                item[self.database.keys[i]] = +item[self.database.keys[i]]

            }

        });

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
        Check if the default column has been specified in the Googledoc 
        and if it has been specified check that it actually exists. 
        If not use the first column after the ID column
        */

        this.database.currentKey = (self.database.keys.indexOf(self.database.settings[0].colourBy) > -1) ? self.database.settings[0].colourBy : self.database.keys[0] ;

        this.isAndroidApp = (window.location.origin === "file://" && /(android)/i.test(navigator.userAgent) ) ? true : false ;  

        this.ractivate()

	}

    ractivate() {

        var self = this

        this.colourizer()

        this.ractive = new Ractive({
            el: '#choloropleth',
            data: self.database,
            template: template,
        })

        this.ractive.observe('currentKey', function(key, old) {

            self.database.currentKey = key

            self.updateMap()

        });

        this.createMap()

    }

    colourizer() {

        var self = this

        this.scaleType = self.database.settings[0].scaleType.toLowerCase()

        this.keyColors = self.database.key.map( (item) => item.colour);

        this.thresholds = self.database.key.map( (item) => item.value);

        this.min = d3.min( self.database.data, (item) => item[self.database.currentKey]);

        if (this.min > 0) {

            this.min = 0

        }

        this.max = d3.max( self.database.data, (item) => item[self.database.currentKey]);

        this.median = d3.median( self.database.data, (item) => item[self.database.currentKey]);

        this.mean = d3.mean( self.database.data, (item) => item[self.database.currentKey]);

        this.range = self.database.data.map( (item) => item[self.database.currentKey]);

        if (this.scaleType === "threshold") {

            this.color = d3.scaleThreshold().domain(self.thresholds).range(self.keyColors)

        } else if (this.scaleType === "ordinal") {

            this.color = d3.scaleOrdinal().range(self.keyColors)

        } else if (this.scaleType === "linear median") { // Median

            this.color = d3.scaleLinear().domain([self.min, self.median, self.max]).range(self.keyColors);

        } else if (this.scaleType === "linear mean") { // Mean

            this.color = d3.scaleLinear().domain([self.min, self.mean, self.max]).range(self.keyColors);

        } else if (this.scaleType === "quantile") {

            this.color = d3.scaleQuantile().domain(self.range).range(self.keyColors);

        } else if (this.scaleType === "quantize") {

            this.color = d3.scaleQuantize().domain(self.min, self.max).range(self.keyColors);

        } else { // Linear by default

            this.scaleType = "linear"

            this.color = d3.scaleLinear().domain([self.min, self.max]).range(self.keyColors);

        }

        var output = `Scale type: ${this.scaleType}\nMin: ${this.min}\nMax: ${this.max}\nMedian: ${this.median}\nMean: ${this.mean}\n\n------------------`

        console.log(output)

    }

    keygen() {

        var self = this

        this.keyWidth = 290;

        if (this.keyWidth > this.width - 10) {
            this.keyWidth = this.width - 10
        }

        d3.select("#keyContainer svg").remove();

        this.keySvg = d3.select("#keyContainer").append("svg")
            .attr("width", self.keyWidth)
            .attr("height", "40px")
            .attr("id", "keySvg")
        
        this.keySquare = this.keyWidth / 10;

        if (this.scaleType === "threshold") {

            this.keyColors.forEach(function(d, i) {

                self.keySvg.append("rect")
                    .attr("x", self.keySquare * i)
                    .attr("y", 0)
                    .attr("width", self.keySquare)
                    .attr("height", 15)
                    .attr("fill", d)
                    .attr("stroke", "#dcdcdc")
            })

            this.thresholds.forEach(function(d, i) {

                self.keySvg.append("text")
                    .attr("x", (i + 1) * self.keySquare)
                    .attr("text-anchor", "middle")
                    .attr("y", 30)
                    .attr("class", "keyLabel").text(d)
            })

        }

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

        var projection = d3.geoMercator()
            .center([135, -28.0])
            .scale(self.width * 0.85)
            .translate([self.width / 2, self.height / 2])

        var path = d3.geoPath().projection(projection);

        var graticule = d3.geoGraticule();

        var zoom = d3.zoom().scaleExtent([1, 100]).on("zoom", zoomed);

        var zoomOn = false

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

        if (zoomOn == true | zoomOn == null) {

            svg.call(zoom)

        }

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
        
        features.append("g").selectAll("path").data(topojson.feature(self.boundaries, self.boundaries.objects[self.database.topoKey]).features).enter().append("path")
            .attr("class", self.database.topoKey)
            .attr("fill", function(d) {
                return self.color(d.properties[self.database.currentKey])
            })
            .attr("d", path)
            .on("mouseover", tooltipIn)
            .on("mouseout", tooltipOut)
        
        if (self.width > 480) {
            features.append("path")
            .attr("class", "mesh")
            .attr("stroke-width", 0.5)
            .attr("d", path(topojson.mesh(self.boundaries, self.boundaries.objects[self.database.topoKey], function(a, b) {
                return a !== b;
            })));
        }

        this.keygen()
   
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
            d3.select(".tooltip").style("top", (d3.mouse(this)[1] + 30) + "px");
        }

        function tooltipIn(d) {
            d3.select(".tooltip").html(self.toolbelt.mustache(self.database.settings[0].tooltip, d.properties)).style("visibility", "visible");
        }

        function tooltipOut(d) {
            d3.select(".tooltip").style("visibility", "hidden");
        }

        d3.select("#zoomIn").on("click", function(d) {
            zoom.scaleBy(svg.transition().duration(750), 1.5);
        });

        d3.select("#zoomOut").on("click", function(d) {
            zoom.scaleBy(svg.transition().duration(750), 1 / 1.5);
        });

        d3.select("#zoomToggle").on("click", function(d) {
            toggleZoom();
        });

        function toggleZoom() {
            console.log(zoomOn)
            if (zoomOn == false) {
                d3.select("#zoomToggle").classed("zoomLocked", false)
                d3.select("#zoomToggle").classed("zoomUnlocked", true)
                svg.call(zoom);
                zoomOn = true
            } else if (zoomOn == true) {
                svg.on('.zoom', null);
                d3.select("#zoomToggle").classed("zoomLocked", true)
                d3.select("#zoomToggle").classed("zoomUnlocked", false)
                zoomOn = false
            } else if (zoomOn == null) {
                svg.on('.zoom', null);
                d3.select("#zoomToggle").classed("zoomLocked", true)
                d3.select("#zoomToggle").classed("zoomUnlocked", false)
                svg.call(zoom);
                zoomOn = false
            }
        }

        if (self.width < 500) {
            if (zoomOn == null) {
                toggleZoom()
            }
        }

        function zoomed() {

            scaleFactor = d3.event.transform.k;
            d3.selectAll(".mesh").style("stroke-width", 0.5 / d3.event.transform.k + "px");
            features.style("stroke-width", 0.5 / d3.event.transform.k + "px");
            features.attr("transform", d3.event.transform);
            features.selectAll(".placeContainers").style("display", function(d) {
                return (d['properties']['scalerank'] < d3.event.transform.k) ? "block" : "none" ;
            })

            features.selectAll(".placeText")
                .style("font-size", 0.8 / d3.event.transform.k + "rem")
                .attr("dx", 5 / d3.event.transform.k)
                .attr("dy", 5 / d3.event.transform.k);
        }

        function reset() {
            active.classed("active", false);
            active = d3.select(null);
            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        }

    }

    updateMap() {

        var self = this

        d3.selectAll(`.${self.database.topoKey}`).transition("changeFill")
            .attr("fill", (d) => self.color(d.properties[self.database.currentKey]))

    }
	
}
