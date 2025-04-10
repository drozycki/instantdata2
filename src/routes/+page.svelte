<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, LineController, LineElement, PointElement, CategoryScale,
    LinearScale, TimeScale, Decimation, Tooltip, Title } from 'chart.js';
  import '$lib/chartjs-adapter-dayjs';

  let canvas, hideText = true, worker;
  Chart.register(LineController, LineElement, PointElement, CategoryScale,
    LinearScale, TimeScale, Decimation, Tooltip, Title);

  onMount(async () => {
    const SqliteWorker = (await import('$lib/sqliteWorker?worker')).default;
    worker = new SqliteWorker();
    worker.onmessage = async e => {
      if (e.data === 'ready') {
        worker?.postMessage('SELECT date,aqi FROM aqi WHERE countyId = 81;');
      } else {
        new Chart(canvas, {
          type: 'line',
          data: {
            datasets: [{
              data: e.data.map(([x, y]) => ({x: x * 1000, y}))
            }]
          },
          options: {
            parsing: false,
            animation: {
              duration: 0,
              onComplete: () => {
                // uncomment for Lighthouse test
                // hideText = false;
              }
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                type: 'time', // 'linear'
                time: {
                  tooltipFormat: 'MMM D',
                },
                // min: 0,
                // max: 1
              },
              y: {
                // min: 0,
                // max: 5
              }
            },
            plugins: {
              title: {
                display: true,
                text: '2022 San Francisco Daily Air Quality Index'
              },
              tooltip: {
                enabled: true,
              },
              // decimation: {
              //   enabled: true,
              //   algorithm: 'lttb'
              // }
            }
          }
        });
      }
    };
  });

  onDestroy(() => worker?.terminate());
</script>

<div style="position: relative; width: 100vw; height: 100vh;">
  <p style={hideText ? 'display: none;' : ''}>Loaded chart</p>
  <canvas bind:this={canvas} />
</div>
