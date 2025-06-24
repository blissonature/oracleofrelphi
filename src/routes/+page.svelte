<script>
  import * as m from '$paraglide/messages';
  import LanguageSelector from '$lib/LanguageSelector.svelte';
</script>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4rem 2rem;
    text-align: center;
    font-family: 'serif';
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    border-radius: 1rem;
    background-color: #000;
    color: #fff;
    border: none;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
  }

  button:hover {
    background-color: #333;
  }
</style>

<main>
  <h1>{m.oracle_is_listening()}</h1>
  <p>{m.speak_seed()}</p>
  <button>{m.begin_communion()}</button>

  <LanguageSelector />
</main>
