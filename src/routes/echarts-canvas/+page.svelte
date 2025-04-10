<script>
  import * as echarts from 'echarts/core';
  import { LineChart } from 'echarts/charts';
  import { CanvasRenderer } from 'echarts/renderers';
  import { GridComponent } from 'echarts/components';
  import { onMount } from 'svelte';
  import labels from '$lib/test_labels.json';
  import data from '$lib/test_data.json';

  let chartContainer, hideText = true;
  echarts.use([ LineChart, CanvasRenderer, GridComponent ]);
  onMount(() => {
    const chart = echarts.init(chartContainer, null, { renderer: 'canvas' });
    chart.on('finished', () => {
      hideText = false;
    });
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
<p style={hideText ? 'display: none;' : ''}>Loaded chart</p>
<div bind:this={chartContainer} style="width: 100vw; height: 100vh;"></div>