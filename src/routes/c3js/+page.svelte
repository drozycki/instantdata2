<script>
  import { onMount } from 'svelte';
  import data from '$lib/test_data.json';
  import labels from '$lib/test_labels.json';

  onMount(async () => {
    const c3 = (await import('c3')).default;
    c3.generate({
      bindto: '#chartContainer',
      data: {
        type: 'line',
        x: 'x',
        columns: [
          ['x', ...labels],
          ['data', ...data]
        ]
      },
      transition: {
        duration: 0
      },
    });
  });
</script>
<div id="chartContainer"></div>