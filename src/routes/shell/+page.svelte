<svelte:window onkeydown={handleKeyDown} />
<pre class="text-sm whitespace-pre-wrap">
<code>{#each history as run}&gt; {run.query}{#each run.result as row}
{row.join('|')}{/each}
{/each}
</code>
</pre>
<form class="font-mono text-sm fixed bottom-0" bind:this={form} onsubmit={runQuery}>
  <input class="bg-white p-1 border-t-1 w-screen" bind:this={input} type="text" placeholder="Enter SQL query" />
</form>
<script>
  import { onMount, onDestroy, tick } from 'svelte';

  let worker, form, input, history = [], inputHistoryPosition = -1, savedInput = '';

  function handleKeyDown(e) {
    input.focus();
    if (history.length) {
      if (e.key === 'ArrowUp') {
        if (inputHistoryPosition === -1) {
          savedInput = input.value;
          inputHistoryPosition = history.length - 1;
          input.value = history[inputHistoryPosition]?.query;
        } else if (inputHistoryPosition > 0) {
          input.value = history[--inputHistoryPosition]?.query;
        }
      } else if (e.key === 'ArrowDown') {
        if (inputHistoryPosition === history.length - 1) {
          input.value = savedInput;
          inputHistoryPosition = -1;
        } else if (inputHistoryPosition !== -1 && inputHistoryPosition < history.length - 1) {
          input.value = history[++inputHistoryPosition]?.query;
        }
      }
    }
  }

  onMount(async () => {
    const SqliteWorker = (await import('$lib/sqliteWorker?worker')).default;
    worker = new SqliteWorker();
    worker.onmessage = async e => {
      if (e.data === 'ready') {
        input.value = 'SELECT * FROM sqlite_schema;';
        form.requestSubmit();
      } else {
        history.push({
          query: input.value,
          result: e.data
        });
        history = history;
        input.value = '';
        await tick();
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
        input.disabled = false;
      }
    };
  });

  onDestroy(() => worker?.terminate());

  async function runQuery(e) {
    input.disabled = true;
    inputHistoryPosition = -1;
    savedInput = '';
    worker?.postMessage(e?.target?.[0]?.value);
  }
</script>