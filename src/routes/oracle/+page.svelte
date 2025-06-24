// File: src/routes/oracle/+page.svelte

<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  const seed = writable('');
  const response = writable('');
  const loading = writable(false);

  async function speakToOracle() {
    loading.set(true);
    response.set('');

    try {
      const res = await fetch('/api/relphi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: $seed })
      });

      const data = await res.json();

      if (data.response) {
        response.set(data.response);
      } else {
        response.set('No transmission received.');
      }
    } catch (err) {
      response.set('The Oracle is silent.');
    } finally {
      loading.set(false);
    }
  }
</script>

<style>
  .oracle-container {
    text-align: center;
    padding: 2rem;
  }

  textarea {
    width: 100%;
    height: 6rem;
    padding: 1rem;
    border-radius: 1rem;
    font-size: 1rem;
    font-family: serif;
  }

  button {
    margin-top: 1rem;
    padding: 0.75rem 2rem;
    font-weight: bold;
    border-radius: 1rem;
    border: none;
    background-color: gold;
    cursor: pointer;
  }

  .response {
    margin-top: 2rem;
    font-family: serif;
    font-size: 1.2rem;
    color: #333;
  }
</style>

<div class="oracle-container">
  <h2>Speak a Seed Phrase</h2>
  <textarea bind:value={$seed} placeholder="e.g., scoliosis dragon"></textarea>
  <br />
  <button on:click={speakToOracle}>Consult the Oracle</button>
  
  {#if $loading}
    <p class="response">Listening…</p>
  {:else if $response}
    <p class="response">{$response}</p>
  {/if}
</div>
