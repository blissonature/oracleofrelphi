<!-- src/lib/LanguageSelector.svelte -->

<script>
  import * as m from '$paraglide/messages'; // This gives you access to the message keys

  import { locale, locales } from '$lib/i18n';
  import { onMount } from 'svelte';

  let availableLanguages = [
    { code: 'en', label: 'English' },
    { code: 'ga', label: 'Gaeilge' },
    { code: 'el', label: 'Ελληνικά' },
    { code: 'he', label: 'עברית' },
    { code: 'ar', label: 'العربية' },
    { code: 'la', label: 'Latine' }
  ];

  let selected;

  onMount(() => {
    selected = $locale;
  });

  function choose(code) {
    locale.set(code);
    selected = code;
  }
</script>

<style>
  .selector {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 2rem;
  }

  .flame-button {
    font-family: serif;
    font-weight: bold;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    border: none;
    cursor: pointer;
    background-color: transparent;
    border: 2px solid #ccc;
    transition: all 0.2s ease-in-out;
  }

  .flame-button:hover {
    border-color: #f66;
    color: #f66;
  }

  .active {
    border-color: gold;
    color: gold;
  }
</style>

<div class="selector">
  {#each availableLanguages as lang}
    <button
      class="flame-button {selected === lang.code ? 'active' : ''}"
      on:click={() => choose(lang.code)}>
      {lang.label}
    </button>
  {/each}
</div>
