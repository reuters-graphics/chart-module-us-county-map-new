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
      source: 'url', // 'local' or 'url'
      dataOrganizedBy: 'state', // 'county' OR 'state'
      ignoreColumn: 'timeStamp', // if there is a col in your data you want to ignore. Set to null if not using. Only works if dataOrganizedBy: 'state'
      nestedInThisCol: 'WebCountyRecord', // If your county data inside each state is further nested in another col. Set to null if not using. Only works if dataOrganizedBy: 'state'
      url: 'https://graphics.thomsonreuters.com/data/ida_power.json',
      valueColName: 'OutageCount', // Column name of the values you want to chart
      missingDataFill: missingDataFill,
    },
  };

  // let chartData = getRandomData();

  afterUpdate(() => {
    // 💪 Create a new chart instance of your module.
    chart = new CountyMap();
    // ⚡ And let's use your chart!
    chart.selection(chartContainer).props({ data: null }).draw(); // 🚀 DRAW IT!

    partialChart
      .selection('#partial-map')
      .mapData(choroplethCountiesData) //  choroplethCountiesData choroplethData
      .props(partialMapProps)
      .draw();
  });
</script>

<div class="important pb-5">
  <h2>Important links</h2>
  <p>
    <a href="" target="_blank">Chart module repo</a>
  </p>
  <p>
    <a href="" target="_blank">Readme for props</a>
  </p>
  <p>
    Note: Styles, such as fill and stroke colour, are set in the _chart.scss
    compoenet. If you want to customise, use ejector.
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

<div class="chart-options pb-4">
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
        colorScale: {
          colorScheme: colorScheme,
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
    href=""
    target="_blank">README for all props</a
  >
  </code>
  </pre>

<h2 class="pt-4">Accessing your data</h2>
<p>
  There are two ways for accessing your data: via a local json file and via a
  URL containing a json file.
</p>

<p>
  Note: You can pull json data from a URL using props too. See the <a
    href=""
    target="_blank">README for all props</a
  >
</p>

<!-- ⚙️ These components will automatically create interactive documentation for you chart! -->
<Docs />
<Explorer title="Data" data={chart.data()} />
<Explorer title="Props" data={chart.props()} />

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
</style>
