<script lang="ts">
	import '../app.css';
	import { setLocale, availableLanguageTags } from '$lib/i18n.js';

	let { children } = $props();

	// Set language based on browser preference
	const browserLang = navigator.language.split('-')[0];
	const lang = availableLanguageTags.includes(browserLang) ? browserLang : 'en';

	setLocale(lang);
</script>

{@render children()}
