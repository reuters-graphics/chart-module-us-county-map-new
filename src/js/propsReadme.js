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
  stateLabelType: (d) => d.ap, // Change to d.name for full state names ,d.postal for postal codes

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
  - If not mapping any data, make {data: null} or {data: {source: null}} 
  */
  data: {
    source: 'url', // or 'local' or null if not mapping any data
    nestedByState: true, // Set to false if your data is flat
    getCountyData: (d) => d.WebCountyRecord.values, // Only necessary if your data is nested. Specify the column in your data that countains the county-level data values you want to map
    getValue: (d) => d.OutageCount, //Column name of the values you want to chart for each county
    getFipsCode: (d) => d.fips, // Col in your data that contains the county fips code
    url: 'https://graphics.thomsonreuters.com/data/ida_power.json', // Leave null if pulling data from a local json file
    missingDataFill: 'white',
  },

  // Colour scale
  colorScale: {
    scaleType: d3.scaleSequential,
    colorScheme: d3.interpolateOranges, // interpolateYlGn
    domain: [0, 100],
  },
};
