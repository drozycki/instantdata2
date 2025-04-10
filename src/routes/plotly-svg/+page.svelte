<script>
  import { onMount } from 'svelte';
  import labels from '$lib/test_labels.json';
  import data from '$lib/test_data.json';
  let chartContainer;

  onMount(async () => {
    await import('$lib/plotly-scatter.min');
    window.Plotly.newPlot(chartContainer, [{
      x: labels,
      y: data,
    }], {}, { responsive: true });
  });
</script>
<div style="width: 100vw; height: 100vh;" bind:this={chartContainer}></div>