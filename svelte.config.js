import { resolve } from 'path';
import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess(), mdsvex()],
  kit: {
    adapter: adapter(),
    alias: {
      $lib: resolve('./src/lib'),
      $paraglide: resolve('./src/lib/paraglide')
	  '$paraglide/runtime': resolve('./src/lib/paraglide/runtime')
    }
  },
  extensions: ['.svelte', '.svx']
};

export default config;
