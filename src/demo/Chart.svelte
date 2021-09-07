<!-- ⭐ Write an interactive DEMO of your chart in this component.
Follow the notes below! -->
<script>
  export let responsive; // eslint-disable-line
  import { afterUpdate } from 'svelte';
  import Docs from './App/Docs.svelte';
  import Explorer from './App/Explorer.svelte';
  import CountyMap from '../js/index';
  import choroplethData from '../js/data/choroplethData.json';

  let chartContainer;

  let chart = new CountyMap();
  let partialChart = new CountyMap();

  let partialMapProps = {
    stateLabelType: (d) => d.name,
    showTheseStates: ['Alabama', 'Louisiana', 'Mississippi'],
    hideOtherStates: true,
    data: {
      url: 'https://graphics.thomsonreuters.com/data/ida_power.json', // leave null if pulling data from a local json file
      valueColName: 'OutageCount', // Column name of the values you want to chart
      missingDataFill: 'white',
    },
  };

  // let chartData = getRandomData();

  // 🎈 Tie your custom props back together into one chartProps object.
  // $: chartProps = { fill: circleFill };

  afterUpdate(() => {
    // 💪 Create a new chart instance of your module.
    chart = new CountyMap();
    // ⚡ And let's use your chart!
    chart.selection(chartContainer).props({ data: null }).draw(); // 🚀 DRAW IT!

    partialChart
      .selection('#partial-map')
      .mapData(choroplethData)
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
  <div id="partial-map" class="us-county-map-container" />
  <p>You can filter for just the states you're interested in.</p>
  <pre>
  <code>
    let chart = new CountyMap();
chart
    .selection(yourChartContainer)
    .props(ADD PROPS)
    .draw()
  </code>
  </pre>
</div>

<div class="chart-options">
  <!-- ✏️ Create buttons that update your data/props variables when they're clicked! -->
</div>

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
  // .chart-options {
  //   button {
  //     padding: 5px 15px;
  //   }
  // }
</style>
