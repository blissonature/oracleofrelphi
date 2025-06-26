<script lang="ts">
  // Extend HTML attributes to recognize on:click in TS

  import { setLocale, availableLanguageTags } from './i18n.js';

  let selected: string;

  function choose(code: string) {
    selected = code;
    setLocale(code);
  }

  const availableLanguages = availableLanguageTags.map((tag: string) => ({
    code: tag,
    label: tag.toUpperCase(), // or use a prettier name map if needed
  }));
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
      on:click={() => choose(lang.code)}
    >
      {lang.label}
    </button>
  {/each}
</div>
