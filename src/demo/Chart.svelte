<!-- ⭐ Write an interactive DEMO of your chart in this component.
Follow the notes below! -->
<script>
  export let responsive; // eslint-disable-line
  import { afterUpdate } from 'svelte';
  import Docs from './App/Docs.svelte';
  import Explorer from './App/Explorer.svelte';
  import CountyMap from '../js/index';
  import choroplethData from '../js/data/choroplethData.json';
  import choroplethCountiesData from '../js/data/choroplethCountiesData.json';
  import * as d3 from 'd3';

  let propsReadmeURL =
    'https://github.com/reuters-graphics/chart-module-us-county-map-new/blob/master/src/js/propsReadme.js';

  let chartContainer;

  let chart = new CountyMap();
  let partialChart = new CountyMap();

  let hideOtherStates = true;
  let missingDataFill = 'lightgrey';
  let showTheseStates = ['Alabama', 'Louisiana', 'Mississippi'];
  let projection = d3.geoAlbersUsa();
  let stateLabelType = (d) => d.name;

  // 🎈 Tie your custom props back together into one chartProps object.
  $: partialMapProps = {
    stateLabelType: stateLabelType,
    showTheseStates: showTheseStates,
    hideOtherStates: hideOtherStates,
    projection: projection,

    data: {
      source: 'local', // 'local' or 'url'
      nestedByState: true,
      getCountyData: (d) => d.WebCountyRecord.values, // Only necessary if your data is nested. Specify the column in your data that countains the county-level data values you want to map
      getFipsCode: (d) => d.fips, // Col in your data that contains the county fips code
      url: 'https://graphics.thomsonreuters.com/data/ida_power.json',
      valueColName: 'OutageCount', // Column name of the values you want to chart
      missingDataFill: missingDataFill,
    },
  };

  let source = 'local';
  let nestedByState = true;
  let getCountyData = (d) => d.WebCountyRecord.values;
  let url = 'https://graphics.thomsonreuters.com/data/ida_power.json';

  let flatProps = {
    data: {
      source: 'local', // 'local' or 'url'
      nestedByState: false,
      // getCountyData: getCountyData, // Only necessary if your data is nested. Specify the column in your data that countains the county-level data values you want to map
      // getFipsCode: (d) => d.fips, // Col in your data that contains the county fips code
      // url: url,
    },
  };

  let nestedProps = {
    source: 'local', // 'local' or 'url'
    nestedByState: true,
    getCountyData: getCountyData,
    // getFipsCode: (d) => d.fips,
  };

  let pullFromUrl = {
    source: 'url', // 'local' or 'url'
    nestedByState: true,
    getCountyData: (d) => d.WebCountyRecord,
    // getFipsCode: (d) => d.fips,
    url: url,
  };

  afterUpdate(() => {
    chart.selection(chartContainer).props({ data: null }).draw(); // 🚀 DRAW IT!

    partialChart
      .selection('#partial-map')
      .mapData(choroplethData) //  choroplethCountiesData (not nested) choroplethData (nested by state)
      .props(partialMapProps)
      .draw();
  });
</script>

<div class="important pb-5">
  <h2>Important links</h2>
  <p>
    <a
      href="https://github.com/reuters-graphics/chart-module-us-county-map"
      target="_blank">Chart module repo</a
    >
  </p>
  <p>
    <a href={propsReadmeURL} target="_blank">Readme for props</a>
  </p>
</div>

<div class="full-map">
  <h3>U.S. county map</h3>
  <div
    id="full-map"
    class="us-county-map-container"
    bind:this={chartContainer}
  />
  <p>
    You can draw a complete map with counties right out of the box with the
    following code.
  </p>
  <pre>
  <code>
    let chart = new CountyMap();
chart
    .selection(yourChartContainer)
    .props(&#123;data:null&#125;) 
    .draw()

IMPORTANT! Don't forget to add the &#123;data:null&#125; prop
if you want to draw just a base map with no data
  </code>
  </pre>
</div>

<div class="partial-map pt-5">
  <h3>Partial U.S. county map</h3>
  <p>You can filter for just the states you're interested in.</p>

  <div id="partial-map" class="us-county-map-container pb-3" />
</div>

<div class="chart-options basic pb-4">
  <!-- ✏️ Create buttons that update your data/props variables when they're clicked! -->
  <button
    on:click={() => {
      console.log('clicked, change colour scale');

      let colorScheme;
      if (
        partialChart.props().colorScale.colorScheme == d3.interpolateOranges
      ) {
        colorScheme = d3.interpolateYlGn;
      } else {
        colorScheme = d3.interpolateOranges;
      }

      let changeColorScale = {
        showTheseStates: ['Alabama', 'Louisiana', 'Mississippi'],
        projection: d3.geoAlbersUsa(),
        hideOtherStates: true,

        colorScale: {
          colorScheme: colorScheme,
        },

        data: {
          source: 'local', // 'local' or 'url'
          nestedByState: true,
          getCountyData: (d) => d.WebCountyRecord.values, // Only necessary if your data is nested. Specify the column in your data that countains the county-level data values you want to map
          getFipsCode: (d) => d.fips, // Col in your data that contains the county fips code
          url: 'https://graphics.thomsonreuters.com/data/ida_power.json',
          valueColName: 'OutageCount', // Column name of the values you want to chart
          missingDataFill: 'light',
        },
      };

      partialChart = new CountyMap(); // For some reason, d3 colour scale kicks in only if I call a new instance of CountyMap()

      partialChart
        .selection('#partial-map')
        .mapData(choroplethCountiesData) //  choroplethCountiesData choroplethData
        .props(changeColorScale)
        .draw();
    }}>Change colour scale</button
  >

  <button
    on:click={() => {
      console.log('clicked, change fill for missing data');
      missingDataFill = missingDataFill === 'yellow' ? 'blue' : 'yellow';
    }}>Change fill for missing data</button
  >

  <button
    on:click={() => {
      console.log('clicked, show/hide other states');
      hideOtherStates = hideOtherStates === true ? false : true;
      showTheseStates = ['Alabama', 'Louisiana', 'Mississippi'];
    }}
    >Show/hide surrounding states
  </button>

  <button
    on:click={() => {
      console.log('clicked, zoom into other states');
      if (showTheseStates.includes('Alabama')) {
        showTheseStates = ['New York', 'Connecticut', 'New Jersey'];
      } else {
        showTheseStates = ['Alabama', 'Louisiana', 'Mississippi'];
      }
    }}
    >Zoom into other states
  </button>

  <button
    on:click={() => {
      console.log('clicked, show entire map');
      if (showTheseStates == null) {
        showTheseStates = ['Alabama', 'Louisiana', 'Mississippi'];
      } else {
        showTheseStates = null;
      }
      projection = d3.geoAlbersUsa();
    }}
    >Show entire map
  </button>

  <button
    on:click={() => {
      console.log('clicked, change projection', projection);
      if (projection == d3.geoMercator()) {
        projection = d3.geoAlbersUsa();
      } else {
        projection = d3.geoMercator();
      }
    }}
    >Change projection
  </button>

  <button
    on:click={() => {
      console.log('clicked, change label style');
      if (String(stateLabelType).includes('name')) {
        stateLabelType = (d) => d.ap;
      } else if (String(stateLabelType).includes('ap')) {
        stateLabelType = (d) => d.postal;
      } else {
        stateLabelType = (d) => d.name;
      }
    }}
    >Change state label style
  </button>
</div>

<pre>
  <code>
    let chart = new CountyMap();
chart
    .selection(yourChartContainer)
    .mapData(Add your local choropleth data if using)
    .props(Add props)
    .draw()

See the <a
    href={propsReadmeURL}
    target="_blank">README for all props</a
  >
  </code>
  </pre>

<h2 class="">Accessing your data</h2>
<p>
  There are two ways for accessing your data: via a local json file and via a
  URL containing a json file. The props in this module also let you deal with
  nested data.
</p>
<p>
  Note: the map below won't change because it's showing the same data that's
  structured differently or is pulled from different sources.
</p>

<p class="pt-2 pb-3">
  See the <a href={propsReadmeURL} target="_blank">README for all props</a>
</p>

<div class="flat-local-data">
  <h4>Local data with flat structure</h4>

  <Explorer title="Props you need to change" data={flatProps} />

  <h5>Notes on data</h5>
  <p>Attach your local data to your map using .mapData()</p>
  <pre>
  <code>
chart
    .selection(yourChartContainer)
    .mapData(yourLocalData)
    .props(yourProps)
    .draw()
  </code>
</pre>
  <Explorer title="" data={choroplethCountiesData} />
</div>

<div class="nested-local-data pt-5">
  <h4>Nested local data</h4>

  <Explorer title="Props you need to change" data={nestedProps} />

  <!-- 
  <h5>Notes on data</h5>
  <p>Attach your local data to your map using .mapData()</p>
  <pre>
  <code>
chart
    .selection(yourChartContainer)
    .mapData(yourLocalData)
    .props(yourProps)
    .draw()
  </code>
</pre> -->
  <Explorer title="Nested data" data={choroplethData} />
</div>

<div class="nested-url-data pt-5 pb-4">
  <h4>Nested data from URL</h4>

  <Explorer title="Props you need to change" data={pullFromUrl} />

  <h5>Notes on data</h5>
  <p>
    If pulling data from URL, do not add .mapData(). Instead, we are specifying
    the data source (URL) in the props. So, when you draw the map, it should
    look like this:
  </p>
  <pre>
  <code>
chart
    .selection(yourChartContainer)
    .props(yourProps)
    .draw()
  </code>
</pre>

  <p>
    Click <a
      href="https://graphics.thomsonreuters.com/data/ida_power.json"
      target="_blank">here</a
    > to see the data
  </p>
</div>

<!-- ⚙️ These components will automatically create interactive documentation for you chart! -->
<Docs />
<Explorer title="Choropleth data" data={partialChart.mapData()} />
<Explorer title="Default props" data={chart.props()} />

<!-- 🖌️ Style your demo page here -->
<style lang="scss">
  .important {
    p {
      margin: 0;
      font-size: 1.4rem;
      // color: red;
    }
  }
  .chart-options {
    button {
      padding: 5px 15px;
    }
  }

  // .row {
  //   margin-left: -300px;
  //   width: 1300px;
  // }
</style>
