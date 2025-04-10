<script>
  import { LineChart } from 'chartist';
  import { onMount } from 'svelte';
  import labels from '$lib/test_labels.json';
  import data from '$lib/test_data.json';

  onMount(() => {
    new LineChart('#chartContainer', {
      labels: labels,
      series: [data],
    });
  });
</script>
<div id="chartContainer"></div>