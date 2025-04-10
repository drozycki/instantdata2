<script>
  import { onMount } from 'svelte';
  import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Decimation } from 'chart.js';
  import data from '$lib/test_data2.json';

  let canvas, hideText = true;
  Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Decimation);
  onMount(()=> {
    new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [{
          data: data,
        }],
      }, options: {
        parsing: false,
        animation: {
          duration: 0,
          onComplete: () => {
            hideText = false;
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            min: 0,
            max: 19999,
          },
          y: {
            min: 0,
            max: 300,
          }
        },
        plugins: {
          decimation: {
            enabled: true,
            algorithm: 'lttb',
          },
        }
      }
    });
  });
</script>
<div style="position: relative; width: 100vw; height: 100vh;">
  <p style={hideText ? 'display: none;' : ''}>Loaded chart</p>
  <canvas bind:this={canvas} />
</div>
