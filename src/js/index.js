// import 'd3-transition';

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
  }

  setProjection() {
    //Set the projection and path function
    this.projection = d3.geoAlbersUsa(); //d3.geoMercator();
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

    //Apply dimensions to the projection and path functions
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

    const stateLabels = labelsGroup
      .selectAll('.state-label')
      .data(
        labelsArray
        // filteredLabels
        , (d) => {
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

  drawMap() {
    const plot = this.plot;
    const countiesGroup = plot.appendSelect('g.counties-g.features-g');
    const counties = countiesGroup
      .selectAll('.county')
      .data(this.counties.features, (d) => {
        return d.id;
      })
      .join('path')
      .attr('class', 'county')
      .attr('d', this.path);

    this.drawStates()
    this.drawBorders();
    this.drawLabels();
  }

  addTimeStamp() {
    // const url = this.dataURL;
    // d3.json(url).then((powerOutageData) => {
    //   let parsedTime = Date.parse(powerOutageData.timeStamp);
    //   const timeFormatter = d3.timeFormat('%B %d, %-I:%M %p');
    //   const formattedTime = timeFormatter(parsedTime);

    //   // Fill span tag with formatted time
    //   d3.select('span#update-time').text(formattedTime);
    // });
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
