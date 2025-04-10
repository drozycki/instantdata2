<script>
  import { onMount } from 'svelte';
  import labels from '$lib/test_labels.json';
  import data from '$lib/test_data.json';

  let chartContainer;
  onMount(async () => {
    const ApexCharts = (await import('apexcharts')).default;
    const chart = new ApexCharts(chartContainer, {
      chart: {
        animations: {
          enabled: false
        },
        type: "line",
        width: "100%",
        height: "auto",
      }, series: [{
        data: data
      }], xaxis: {
        categories: labels
      }
    });
    await chart.render();
  });
</script>
<div bind:this={chartContainer}></div>