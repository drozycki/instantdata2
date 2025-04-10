<script>
  import * as echarts from 'echarts/core';
  import { LineChart } from 'echarts/charts';
  import { SVGRenderer } from 'echarts/renderers';
  import { GridComponent } from 'echarts/components';
  import { onMount } from 'svelte';
  import labels from '$lib/test_labels.json';
  import data from '$lib/test_data.json';

  let chartContainer;
  echarts.use([ LineChart, SVGRenderer, GridComponent ]);
  onMount(() => {
    const chart = echarts.init(chartContainer, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      xAxis: {
        data: labels
      }, yAxis: {},
      series: [{
        type: 'line',
        data: data
      }]
    });
  });
</script>
<div bind:this={chartContainer} style="width: 100vw; height: 100vh;"></div>