import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import * as utils from './utils';

import { appendSelect } from 'd3-appendselect';
// import choroplethData from './data/choroplethData.json'
import choroplethCountiesData from './data/choroplethCountiesData.json'
import fipsStateCodes from './data/fipsStateCodes.json'
import labelPos from './data/labelPos.json';
import merge from 'lodash/merge';
import statestyle from './data/statestyle.json';
import topo from './data/us-county-topo.json';

// import cities from './data/cities.json';
// import statePlanes from './data/statePlanes_fips.json';

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

  mapData(newData) {
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

    // Projection
    projection: d3.geoAlbersUsa(), //Use d3.geoMercator(); if not showing the entire U.S.,

    // State label style
    stateLabelType: d => d.ap, // Change to d.name for full state names ,d.postal for postal codes

    /* Add a list of states you want to filter for/zoom into. 
    Make sure they're fully spelled out; no abbreviations. 
    Set to 'null' if you want to show all states
    */
    showTheseStates: null, // ['Alabama', 'Louisiana', 'Mississippi'] 
    hideOtherStates: false, // set to true if you want to hide all other states

    // Add data to make a choropleth map
    /* NOTE:
    - Make sure the county FIPS code in your data is formatted correctly. It should have 5 digits. 
      Use utils.pad() if you need to add leading 0's
    - Column containing county FIPS code in your data should be named "fips"
 - Make data: null if you're not mapping any data
    */
    data: {
      // getX: (d) => d.date, props.getX(d)

      dataType: 'url', // or 'local'
      dataOrganizedBy: 'county', // OR 'state'
      ignoreColumn: 'timeStamp', // if there is a col in your data you want to ignore. Set to null if not using. Only works if dataOrganizedBy: 'state'
      nestedInThisCol: 'WebCountyRecord', // If your county data inside each state is further nested in another col. Set to null if not using. Only works if dataOrganizedBy: 'state'
      url: 'https://graphics.thomsonreuters.com/data/ida_power.json', // Leave null if pulling data from a local json file
      valueColName: 'OutageCount', // Column name of the values you want to chart
      missingDataFill: 'white',
    },

    // Colour scale
    colorScale: {
      scaleType: d3.scaleSequential,
      colorScheme: d3.interpolateOranges, // interpolateYlGn
      domain: [0, 100]
    }
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

  filterStateData() {
    const props = this.props()
    let lookupStateFips = {};
    fipsStateCodes.forEach((d) => {
      lookupStateFips[d.STATE_NAME] = utils.pad(d.STATE, 2)
    });

    let fipsList = []
    props.showTheseStates.forEach(stateName => {
      let fips = lookupStateFips[stateName]
      fipsList.push(fips)
    })

    let filteredData = this.counties.features.filter((d) => {
      let state = d.id.substring(0, 2);
      return fipsList.includes(state);
    });
    this.filteredData = filteredData;
    this.us.features = this.filteredData; // Redefines projection extent
  }

  filterCountyData() {
    const props = this.props()
    let countiesData
    if (props.showTheseStates !== null && props.hideOtherStates) {
      countiesData = this.filteredData
    } else {
      countiesData = this.counties.features
    }
    return countiesData
  }

  makeLookupObj(mapData) {
    const props = this.props()
    let lookupObj = {};

    /* Check mapData to see how it is structured and make a lookup object for mapData.
     Your data should look like chroloplethCountiesData.json if it's flat (every data point = every county).
     Your data should look like chroloplethData.json if it's organised by states.
     */

    if (props.data.dataOrganizedBy == 'county') {
      mapData.forEach((d) => {
        lookupObj[d.fips] = d
        /* If you need to make calculations and map out those values, do something like this:  */
        //  lookupObj[d.fips]['calculatedValue'] = (d.OutageCount / d.CustomerCount) * 100;
        // });
      });
    } else if (props.data.dataOrganizedBy == 'state') {
      Object.keys(mapData)
        .filter((stateName) => stateName !== props.data.ignoreColumn)
        .forEach((stateName) => {
          let stateData
          if (props.data.nestedInThisCol) {
            stateData = mapData[stateName][props.data.nestedInThisCol]
            stateData.forEach((d) => {
              lookupObj[d.fips] = d;
              lookupObj[d.fips]['state'] = stateName;
              lookupObj[d.fips][props.data.valueColName] = d[props.data.valueColName]

              /* If you need to make calculations and map out those values, do something like this:  */
              //  lookupObj[d.fips]['calculatedValue'] = (d.OutageCount / d.CustomerCount) * 100;
              // });
            });
          } else {
            stateData = mapData[stateName]
          }
        });
    } else {
      console.log('ERROR! Check your data structure. Write your own code to structure your data if necessary')
    }
    return lookupObj
    // console.log('lookupObj', lookupObj)
  }

  setProjection() {
    const props = this.props()
    //Set the projection and path function
    this.projection = props.projection
    this.path = d3.geoPath().projection(this.projection);
  }

  colorScale() {
    const props = this.props()
    this.colorScale = props.colorScale.scaleType(props.colorScale.colorScheme)
      .domain(props.colorScale.domain);
  }

  drawBase() {
    const props = this.props(); // Props passed to your chart

    //Update our data and scales when the page redraws
    this.setData();
    if (props.showTheseStates !== null) this.filterStateData()
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
    const props = this.props()

    const labelsGroup = plot.appendSelect('g.labels-g');

    let labelsArray = statestyle.filter((d) => {
      return labelPos[utils.pad(d.fips, 2)];
    });

    let filteredLabels;
    if (props.showTheseStates !== null) {
      filteredLabels = labelsArray.filter((d) => {
        let stateFullName = d.name;

        if (props.showTheseStates.includes(stateFullName)) {
          return d => { props.stateLabelType(d) }
        }
      });

      labelsArray = filteredLabels
    }

    const stateLabels = labelsGroup
      .selectAll('.state-label')
      .data(labelsArray)
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
      .text((d) => props.stateLabelType(d))
      .attr('y', -8);

    stateLabels
      .appendSelect('text.st.front')
      .text((d) => props.stateLabelType(d)).attr('y', -8);
  }

  drawBasicMap() {
    const plot = this.plot;
    const props = this.props()
    const countiesGroup = plot.appendSelect('g.counties-g.features-g');

    let countiesData
    if (props.showTheseStates !== null && props.hideOtherStates) {
      countiesData = this.filteredData
    } else {
      countiesData = this.counties.features
    }
    const counties = countiesGroup
      .selectAll('.county')
      .data(countiesData, (d) => {
        return d.id;
      })
      .join('path')
      .attr('class', 'county')
      .attr('d', this.path);

    this.drawStates()
    this.drawBorders();
    this.drawLabels();
  }

  drawMapWithLocalData() {
    const plot = this.plot;
    const props = this.props()

    let countiesData = this.filterCountyData()
    let lookupObj = this.makeLookupObj(this.mapData())

    const countiesGroup = plot.appendSelect('g.counties-g.features-g');
    const counties = countiesGroup
      .selectAll('.county')
      .data(countiesData, (d) => {
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
          return props.data.missingDataFill; // Make white if data for this county
        } else {
          return this.colorScale(datum[props.data.valueColName]);
        }
      });

    this.drawStates()
    this.drawBorders();
    this.drawLabels();
  }

  drawMapWithUrlData() {
    const plot = this.plot;
    const props = this.props()
    let countiesData = this.filterCountyData()

    /* DRAW COUNTIES USING LOOKUP OBJ */
    d3.json(props.data.url).then((mapData) => {

      let lookupObj = this.makeLookupObj(mapData)
      const countiesGroup = plot.appendSelect('g.counties-g.features-g');
      const counties = countiesGroup
        .selectAll('.county')
        .data(countiesData, (d) => {
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
            return props.data.missingDataFill; // Make white if data for this county
          } else {
            return this.colorScale(datum[props.data.valueColName]);
          }
        });

      this.drawStates()
      this.drawBorders();
      this.drawLabels();
    })
  }

  // If your data has a time stamp and you want to add it to the page
  // addTimeStamp() {
  // const url = this.dataURL;
  // d3.json(url).then((mapData) => {
  //   let parsedTime = Date.parse(mapData.timeStamp);
  //   const timeFormatter = d3.timeFormat('%B %d, %-I:%M %p');
  //   const formattedTime = timeFormatter(parsedTime);

  //   // Fill span tag with formatted time
  //   d3.select('span#update-time').text(formattedTime);
  // });
  // }

  draw() {
    const props = this.props()
    this.colorScale();
    this.drawBase();

    if (props.data == null) {
      this.drawBasicMap();
    } else if (props.data.source == 'local') {
      this.drawMapWithLocalData()
    } else if (props.data.source == 'url' && props.data.url) {
      this.drawMapWithUrlData()
    }
    // this.addTimeStamp();
    return this; // Generally, always return the chart class from draw!
  }
}

export default CountyMap;
