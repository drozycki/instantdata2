<script>
  import { onMount } from 'svelte';
  import labels from '$lib/test_labels.json';
  import data from '$lib/test_data.json';
  let chartContainer, hideText = true;

  onMount(async () => {
    await import('$lib/plotly-scattergl.min');
    window.Plotly.newPlot(chartContainer, [{
      x: labels,
      y: data,
      type: 'scattergl',
    }], {
      xaxis: {
        visible: false
      },
      yaxis: {
        visible: false
      },
    }, { responsive: true }).then(() => hideText = false);
  });
</script>
<p style={hideText ? 'display: none;' : ''}>Loaded chart</p>
<div style="width: 100vw; height: 100vh;" bind:this={chartContainer}></div>