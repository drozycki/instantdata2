<script>
  import { onMount } from 'svelte';
  import data from '$lib/test_arrays.json';

  let hideText = true;
  onMount(async () => {
    const Dygraph = (await import('dygraphs')).default;
    new Dygraph("chartContainer", data, {
      animateBackgroundFade: false,
      drawAxis: false,
      drawCallback: () => hideText = false,
    });
  });
</script>
<p style={hideText ? 'display: none;' : ''}>Loaded chart</p>
<div id="chartContainer" style="width: 100vw; height: 100vh;"></div>