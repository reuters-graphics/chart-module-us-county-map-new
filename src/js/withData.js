import 'd3-transition';

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import * as utils from './utils';

import { appendSelect } from 'd3-appendselect';
// import cities from './data/cities.json';
import labelPos from './data/labelPos.json';
import merge from 'lodash/merge';
// import statePlanes from './data/statePlanes_fips.json';
import statestyle from './data/statestyle.json';
import topo from './data/us-county-topo.json';

d3.selection.prototype.appendSelect = appendSelect;

/**
 * Write your chart as a class with a single draw method that draws
 * your chart! This component inherits from a base class you can
 * see and customize in the baseClasses folder.
 */
class CountyMap {
    selection(selector) {
        if (!selector) return this._selection;
        this._selection = d3.select(selector);
        return this;
    }

    data(newData) {
        if (!newData) return this._data || this.defaultData;
        this._data = newData;
        return this;
    }

    props(newProps) {
        if (!newProps) return this._props || this.defaultProps;
        this._props = merge(this._props || this.defaultProps, newProps);
        return this;
    }

    defaultProps = {
        aspectHeight: 0.66,
        margin: {
            top: 0,
            right: 20,
            bottom: 0,
            left: 0,
        },
    };

    setData() {
        //Format the topojson as feature arrays.
        this.us = topojson.feature(topo, topo.objects.states);
        this.counties = topojson.feature(topo, topo.objects.counties);
        this.borderMesh = topojson.mesh(topo, topo.objects.states, function (a, b) {
            return a !== b;
        });

        //Create dictionaries so we can access statestyle by FIPS or Postal keys
        this.stateFips = {};
        this.statePostal = {};

        statestyle.forEach((d) => {
            let fips = utils.pad(d.fips, 2);
            this.stateFips[fips] = d;
            this.statePostal[d.postal] = d;
        });

        //Alabama, Louisiana, Miss.
        let whitelist = ['01', '22', '28'];

        let filteredData = this.counties.features.filter((d) => {
            let state = d.id.substring(0, 2);
            // console.log('state.includes(whitelist)', state.includes(whitelist))
            return whitelist.includes(state);
        });
        this.filteredData = filteredData;
    }

    setProjection() {
        //Set the projection and path function
        this.projection = d3.geoMercator(); // d3.geoAlbersUsa();
        this.path = d3.geoPath().projection(this.projection);
    }

    colorScale() {
        // const colorScaleMin = d3.min(data, function (d) { return +props.colorScaleDomain(d); })
        // const colorScaleMax = d3.max(data, function (d) { return +props.colorScaleDomain(d); })
        this.colorScale = d3
            .scaleSequential(d3.interpolateOranges)
            .domain([0, 100]);
        // console.log(this.colorScale(0), this.colorScale(25), this.colorScale(50), this.colorScale(75), this.colorScale(100))
    }

    drawBase() {
        const props = this.props(); // Props passed to your chart

        //Update our data and scales when the page redraws
        this.setData();
        this.setProjection();

        //Define our target selection
        const container = this.selection().node();

        //Define dimensions
        const { margin } = props;
        const { width: containerWidth } = container.getBoundingClientRect(); // Respect the width of your container!

        const width = containerWidth - margin.left - margin.right;
        const height =
            containerWidth * props.aspectHeight - margin.top - margin.bottom;
        const scale = 1.27;
        const offset = [-600, -800];

        //Apply dimensions to the projection and path functions
        // https://github.com/d3/d3-geo
        // this.projection.fitExtent([offset, [width * scale, height * scale]], this.us);

        this.us.features = this.filteredData;
        this.projection.fitSize([width, height], this.us);
        this.path.projection(this.projection);

        /* CREATE SVG AND PLOT SPACE */
        const svg = this.selection()
            .appendSelect('svg') // 👈 Use appendSelect instead of append for non-data-bound elements!
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        this.plot = svg
            .appendSelect('g.plot')
            .attr('transform', `translate(${margin.left},${margin.top})`);
    }

    drawStates() {
        const plot = this.plot;
        const statesGroup = plot.appendSelect('g.states-g.features-g');

        const states = statesGroup
            .selectAll('.state')
            .data(this.us.features, (d) => {
                return d.id;
            })
            .join('path')
            .attr('class', (d) => {
                return `state st-${d.id}`;
            });

        states.attr('d', this.path);
    }

    drawBorders() {
        const plot = this.plot;
        const borders = plot
            .appendSelect('path.borders')
            .attr('d', this.path(this.borderMesh));
    }

    drawLabels() {
        const plot = this.plot;

        const labelsGroup = plot.appendSelect('g.labels-g');

        let labelsArray = statestyle.filter((d) => {
            return labelPos[utils.pad(d.fips, 2)];
        });

        let filteredLabels = labelsArray.filter((d) => {
            let whitelist = ['Ala.', 'Miss.', 'La.'];
            let stateLabel = d.ap;

            if (whitelist.includes(stateLabel)) {
                return d.ap;
            }
        });

        const stateLabels = labelsGroup
            .selectAll('.state-label')
            .data(filteredLabels, (d) => {
                return d.ap;
            })
            .join('g')
            .attr('class', (d) => `state-label ${d.postal}`)
            .attr('transform', (d) => {
                let pos = labelPos[utils.pad(d.fips, 2)];
                let coord = this.projection(pos);
                let xPos = coord[0];
                let yPos = coord[1] + 5;
                return `translate(${xPos},${yPos})`;
            });

        stateLabels
            .appendSelect('text.st.bkgd')
            .text((d) => d.name) //d.ap for abbreviate state names
            .attr('y', -8);

        stateLabels
            .appendSelect('text.st.front')
            .text((d) => d.name) //d.ap for abbreviate state names
            .attr('y', -8);
    }

    // pass 'n' to padd it with 0's. width = total number of digits you want. z is optional.
    // pad(n, width, z) {
    //   z = z || '0';
    //   n = n + '';
    //   return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    // }

    drawMap() {
        const plot = this.plot;

        /* MAKE LOOKUP OBJECT AND DRAW COUNTIES */
        let lookupObj = {};
        this.dataURL = 'https://graphics.thomsonreuters.com/data/ida_power.json';
        const url = this.dataURL;

        d3.json(url).then((powerOutageData) => {
            Object.keys(powerOutageData)
                .filter((stateName) => stateName !== 'timeStamp')
                .forEach((stateName) => {
                    let stateData = powerOutageData[stateName].WebCountyRecord;

                    // let pctOutageMax =
                    stateData.forEach((d) => {
                        lookupObj[d.fips] = d;
                        lookupObj[d.fips]['State'] = stateName;
                        lookupObj[d.fips]['pctOutage'] =
                            (d.OutageCount / d.CustomerCount) * 100;
                    });
                });

            // console.log('lookupObj', lookupObj)
            // outagePctMin = d3.min(data, function (d) { return +props.colorScaleDomain(d); })

            const countiesGroup = plot.appendSelect('g.counties-g.features-g');
            const counties = countiesGroup
                .selectAll('.county')
                .data(this.filteredData, (d) => {
                    return d.id;
                })
                .join('path')
                .attr('class', 'county')
                .attr('d', this.path)
                .style('fill', (d) => {
                    /* Check if fips code exists in the data */
                    let fips = d.id; //FIPS code from base map shapefile
                    let datum = lookupObj[fips] ? lookupObj[fips] : null;
                    if (!datum) {
                        return '#f7f7f7'; // No data for this county
                    } else {
                        return this.colorScale(datum.pctOutage);
                    }
                });

            // this.drawStates()
            this.drawBorders();
            this.drawLabels();
        });
    }

    addTimeStamp() {
        const url = this.dataURL;
        d3.json(url).then((powerOutageData) => {
            let parsedTime = Date.parse(powerOutageData.timeStamp);
            const timeFormatter = d3.timeFormat('%B %d, %-I:%M %p');
            const formattedTime = timeFormatter(parsedTime);

            // Fill span tag with formatted time
            d3.select('span#update-time').text(formattedTime);
        });
    }

    draw() {
        this.colorScale();
        this.drawBase();
        this.drawMap();
        this.addTimeStamp();
        return this; // Generally, always return the chart class from draw!
    }
}

export default CountyMap;
