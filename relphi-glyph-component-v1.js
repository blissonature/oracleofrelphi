// Canonical glyph artwork and atomic bubble component.
// Approved master source: 0d56ee7ec0ea0fc3e44debcb809afde09f3271ab.
(function () {
  'use strict';
  if (window.RelphiGlyphComponent) return;

  const NS = 'http://www.w3.org/2000/svg';
  const cache = new Map();
  const svg = name => document.createElementNS(NS, name);
  const canonicalAssets = Object.freeze({
    'assets/planet-glyphs/sun.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Sun"><path d="M49.42,43.39 L46.31,44.56 L44.36,46.50 L43.58,51.17 L45.14,54.28 L46.69,55.44 L50.97,56.22 L53.69,55.06 L55.64,53.11 L56.42,48.83 L53.69,44.56 Z M46.69,15.00 L38.92,16.56 L33.47,18.89 L27.25,23.17 L23.36,27.06 L19.86,32.11 L16.36,40.67 L15.19,48.44 L15.58,55.44 L16.75,60.50 L19.86,67.50 L27.25,76.44 L32.31,79.94 L40.08,83.44 L45.92,84.61 L54.08,84.61 L62.25,82.67 L67.69,79.94 L71.58,77.22 L76.64,72.17 L82.47,62.06 L84.42,53.50 L84.42,46.50 L82.86,38.72 L80.53,33.28 L76.25,27.06 L72.36,23.17 L66.92,19.28 L59.53,16.17 L52.92,15.00 Z M45.14,19.28 L50.97,18.89 L58.36,20.06 L64.19,22.39 L68.86,25.50 L76.25,34.06 L79.36,41.44 L80.53,47.28 L80.53,52.33 L79.36,58.56 L74.31,68.67 L68.47,74.50 L61.08,78.78 L53.69,80.72 L42.42,79.94 L36.19,77.61 L30.36,73.72 L26.47,69.83 L22.97,64.78 L21.03,60.50 L19.47,54.28 L19.47,44.94 L21.81,37.17 L24.92,31.72 L33.08,23.94 L40.47,20.44 Z" fill="#111111" fill-rule="evenodd" clip-rule="evenodd"/></svg>`,
    'assets/planet-glyphs/moon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Moon"><g transform="rotate(15 50 50)" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><path d="M42 22C63 21 77 33 77 50C77 67 63 79 42 78C52 71 57 61 57 50C57 39 52 29 42 22Z"/></g></svg>`,
    'assets/planet-glyphs/mercury.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Mercury"><g fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><path d="M33 18C35.5 25 41.5 28 50 28S64.5 25 67 18"/><circle cx="50" cy="46" r="18"/><path d="M50 64V89M38 77H62"/></g></svg>`,
    'assets/planet-glyphs/venus.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Venus"><g fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="36" r="22"/><path d="M50 58V88M37 74H63"/></g></svg>`,
    'assets/planet-glyphs/mars.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Mars"><g fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="42" cy="60" r="25"/><path d="M59.5 42.5L83 18M68 18H83V33"/></g></svg>`,
    'assets/planet-glyphs/jupiter.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Jupiter"><g fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 37C16 29 18 20 27 15C36 10 47 13 51 21C56 31 51 43 44 53C39 60 33 65 27 69"/><path d="M20 69H82M66 14V88"/></g></svg>`,
    'assets/planet-glyphs/saturn.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Saturn"><g fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><path d="M39 12V68M29 21H51"/><path d="M39 47C43 39 49 34 56 34C65 34 71 41 71 50C71 57 67 63 62 71C57 79 57 84 62 87C66 89 70 87 72 84"/></g></svg>`,
    'assets/planet-glyphs/uranus.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Uranus"><g fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><path d="M50 13V66M35 37H65"/><path d="M22 13C30 18 34 28 34 39C34 49 30 57 23 60M78 13C70 18 66 28 66 39C66 49 70 57 77 60"/><circle cx="50" cy="77" r="11"/></g></svg>`,
    'assets/planet-glyphs/neptune.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Neptune"><path d="M12 17L17 11L22 17M17 11V34C17 49 29 60 44 62M78 17L83 11L88 17M83 11V34C83 49 71 60 56 62M45 17L50 11L55 17M50 11V88M37 75H63" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/planet-glyphs/pluto.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Pluto"><g fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="29" r="16"/><path d="M21 32C23 48 35 59 50 59C65 59 77 48 79 32M50 59V88M36 74H64"/></g></svg>`,
    'assets/planet-glyphs/lilith.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 320" role="img" aria-label="Lilith"><path d="M128 160V278" fill="none" stroke="#111111" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="M84 234H172" fill="none" stroke="#111111" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path fill="#111111" d="M134.766636 14.294063A78 78 0 1 0 198.138326 126.126458A65 65 0 1 1 134.766636 14.294063Z"/></svg>`,
    'assets/zodiac-glyphs/aries.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Aries"><path d="M46.28 83.05V31.19Q46.28 22.26 41.98 17.37Q37.67 12.48 29.91 12.48Q25.24 12.48 21.52 14.77Q17.8 17.05 15.67 20.93Q13.55 24.81 13.55 29.81Q13.55 34.38 15.57 37.99Q17.58 41.6 21.04 43.73Q24.49 45.86 28.74 45.86V52.23Q22.15 52.23 17 49.36Q11.85 46.49 8.92 41.44Q6 36.4 6 29.81Q6 22.69 8.98 17.37Q11.95 12.06 17.37 9.03Q22.79 6 29.91 6Q37.78 6 42.67 9.51Q47.56 13.01 50 20.67Q52.44 13.01 57.39 9.51Q62.33 6 70.09 6Q77.21 6 82.57 9.03Q87.94 12.06 90.97 17.37Q94 22.69 94 29.81Q94 36.4 91.08 41.44Q88.15 46.49 83.05 49.36Q77.95 52.23 71.26 52.23V45.86Q75.61 45.86 79.07 43.73Q82.52 41.6 84.49 37.99Q86.45 34.38 86.45 29.81Q86.45 24.81 84.33 20.88Q82.2 16.95 78.54 14.71Q74.87 12.48 70.09 12.48Q62.33 12.48 58.02 17.43Q53.72 22.37 53.72 31.19V83.05Z" fill="#111111"/></svg>`,
    'assets/zodiac-glyphs/taurus.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Taurus"><path d="M50 92.74Q43.93 92.74 38.54 90.39Q33.16 88.04 29.09 83.97Q25.02 79.91 22.67 74.52Q20.32 69.14 20.32 63.06Q20.32 55.04 24.28 48.22Q28.23 41.41 35.1 37.4Q27.31 32.24 23.53 24.79Q20.9 19.64 18.72 17.11Q16.54 14.59 13.68 13.79Q10.81 12.99 6 12.99V6Q11.16 6 15.68 6.57Q20.21 7.15 23.42 10.47Q25.02 12.07 26.4 13.96Q27.77 15.85 28.92 18.15Q31.21 22.5 34.07 26.34Q36.94 30.18 40.95 31.78Q45.19 33.39 50 33.39Q54.7 33.39 58.99 31.44Q63.29 29.49 66.16 25.82Q67.65 23.88 68.91 21.98Q70.17 20.09 71.2 18.03Q73.26 13.91 76.7 10.47Q80.14 7.03 84.72 6.57Q87.01 6.34 89.36 6.17Q91.71 6 94 6V12.99Q89.3 12.99 86.44 13.79Q83.57 14.59 81.4 17.06Q79.22 19.52 76.58 24.68Q72.69 32.12 64.78 37.4Q71.77 41.41 75.72 48.22Q79.68 55.04 79.68 63.06Q79.68 69.25 77.33 74.64Q74.98 80.02 70.91 84.09Q66.84 88.16 61.46 90.45Q56.07 92.74 50 92.74ZM50 84.26Q55.84 84.26 60.66 81.4Q65.47 78.53 68.33 73.66Q71.2 68.79 71.2 63.06Q71.2 57.22 68.33 52.41Q65.47 47.59 60.66 44.73Q55.84 41.86 50 41.86Q44.27 41.86 39.4 44.73Q34.53 47.59 31.67 52.41Q28.8 57.22 28.8 63.06Q28.8 68.79 31.67 73.66Q34.53 78.53 39.4 81.4Q44.27 84.26 50 84.26Z" fill="#111111"/></svg>`,
    'assets/zodiac-glyphs/gemini.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Gemini"><path d="M20 13C34 19 66 19 80 13M20 87C34 81 66 81 80 87M34 19V81M66 19V81" fill="none" stroke="#111111" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/zodiac-glyphs/cancer.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Cancer"><path d="M27.66 47.44Q17.72 47.44 11.86 42.31Q6 37.18 6 28.71Q6 17.3 16.57 11.76Q27.45 6 51.1 6Q58.21 6 65.96 7.15Q73.7 8.3 81.02 10.34Q88.35 12.38 94 15V22.32Q84.69 17.82 73.33 15.47Q61.98 13.12 51.1 13.12Q43.25 13.12 39.17 14.06Q43.46 14.79 46.39 18.77Q49.32 22.74 49.32 28.71Q49.32 37.18 43.46 42.31Q37.6 47.44 27.66 47.44ZM27.66 40.74Q33.83 40.74 37.55 37.5Q41.26 34.25 41.26 28.71Q41.26 23.16 37.55 19.92Q33.83 16.67 27.66 16.67Q21.28 16.67 17.67 19.92Q14.06 23.16 14.06 28.71Q14.06 34.25 17.77 37.5Q21.49 40.74 27.66 40.74ZM48.9 80.71Q41.37 80.71 33.21 79.4Q25.04 78.1 17.88 76Q10.71 73.91 6 71.71V64.39Q15.31 68.68 26.4 71.14Q37.5 73.6 48.9 73.6Q57.27 73.6 60.83 72.65Q56.64 72.13 53.66 68.1Q50.68 64.07 50.68 58Q50.68 49.63 56.59 44.45Q62.5 39.27 72.34 39.27Q82.28 39.27 88.14 44.4Q94 49.53 94 58Q94 69.1 83.54 74.85Q72.97 80.71 48.9 80.71ZM72.34 70.04Q78.72 70.04 82.33 66.74Q85.94 63.45 85.94 58Q85.94 52.56 82.39 49.27Q78.83 45.97 72.34 45.97Q65.96 45.97 62.35 49.27Q58.74 52.56 58.74 58Q58.74 63.45 62.4 66.74Q66.06 70.04 72.34 70.04Z" fill="#111111"/></svg>`,
    'assets/zodiac-glyphs/leo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Leo"><path d="M72.33 94Q66.12 94 62.5 90.05Q58.88 86.1 58.88 79.15Q58.88 74.73 60.34 69.41Q61.8 64.1 64.53 57.8Q70.07 45.02 70.07 33.17Q70.07 26.78 67.91 22.12Q65.75 17.47 62.03 14.93Q58.32 12.39 53.53 12.39Q46.47 12.39 42.2 17.09Q37.92 21.79 37.92 29.97Q37.92 34.02 38.95 37.59Q43.37 38.15 46.76 40.69Q50.14 43.23 52.12 46.94Q54.09 50.66 54.09 54.98Q54.09 59.78 51.69 63.77Q49.29 67.77 45.35 70.17Q41.4 72.56 36.51 72.56Q31.71 72.56 27.72 70.17Q23.72 67.77 21.32 63.77Q18.93 59.78 18.93 54.98Q18.93 49.15 22.5 44.41Q26.07 39.66 31.81 38.06Q30.68 34.39 30.68 30.07Q30.68 23.11 33.59 17.71Q36.51 12.3 41.77 9.15Q47.04 6 54 6Q61.05 6 66.31 9.34Q71.58 12.68 74.44 18.69Q77.31 24.71 77.31 32.89Q77.31 37.03 76.79 41.3Q76.28 45.58 74.77 50.71Q73.27 55.83 70.45 62.6Q66.22 72.75 66.22 79.05Q66.22 82.81 68.19 84.88Q70.17 86.95 73.36 86.95Q76.47 86.95 78.82 85.63L81.07 91.74Q77.12 94 72.33 94ZM36.51 65.42Q39.33 65.42 41.73 64.01Q44.12 62.6 45.53 60.2Q46.94 57.8 46.94 54.98Q46.94 52.16 45.53 49.76Q44.12 47.37 41.73 45.96Q39.33 44.55 36.51 44.55Q33.78 44.55 31.38 46Q28.99 47.46 27.53 49.81Q26.07 52.16 26.07 54.98Q26.07 57.8 27.48 60.15Q28.89 62.5 31.29 63.96Q33.69 65.42 36.51 65.42Z" fill="#111111"/></svg>`,
    'assets/zodiac-glyphs/virgo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Virgo"><path d="M67.29 94Q63.47 90.94 61.75 82.92Q54.3 86.93 47.13 88.08V81.96Q54.3 80.81 60.8 76.99Q60.51 73.93 60.51 70.59V23.39Q60.51 19.95 59.75 16.46Q58.98 12.98 57.64 10.87Q56.31 12.02 54.4 14.55Q52.48 17.08 50.62 20.14Q48.76 23.2 47.37 25.92Q45.99 28.64 45.8 30.08V74.22H39.11V24.82Q39.11 21.29 38.44 17.75Q37.77 14.22 36.24 10.87Q34.9 12.02 32.99 14.55Q31.08 17.08 29.22 20.14Q27.36 23.2 25.97 25.92Q24.58 28.64 24.39 30.08V74.22H17.7V24.06Q17.7 17.27 13.4 6H18.47Q19.81 8.1 21.19 11.4Q22.58 14.69 23.82 19.28Q24.68 17.66 26.45 15.17Q28.21 12.69 30.22 10.16Q32.23 7.62 33.95 6H39.59Q41.31 8.48 42.88 12.35Q44.46 16.22 45.03 19.28Q45.89 17.56 47.71 15.12Q49.52 12.69 51.67 10.2Q53.82 7.72 55.54 6H61.18Q64.43 10.4 65.81 14.69Q67.2 18.99 67.2 23.77V31.7Q68.44 29.22 70.73 26.45Q73.03 23.68 74.94 22.15H80.48Q83.25 25.4 84.92 31.27Q86.6 37.15 86.6 44.31Q86.6 54.73 81.82 63.71Q77.04 72.69 67.87 79.19Q68.54 83.49 70.07 87.07Q71.59 90.66 74.46 94ZM67.2 72.31Q73.31 66.96 76.61 59.75Q79.91 52.53 79.91 44.31Q79.91 33.33 76.85 27.02Q75.32 28.55 73.31 31.37Q71.31 34.19 69.64 37.1Q67.96 40.02 67.2 41.83Z" fill="#111111"/></svg>`,
    'assets/zodiac-glyphs/libra.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Libra"><path d="M6 54.74V47.37H34Q30.11 44.32 27.74 39.53Q25.37 34.74 25.37 30.11Q25.37 23.37 28.63 17.95Q31.89 12.53 37.53 9.26Q43.16 6 50 6Q56.84 6 62.42 9.26Q68 12.53 71.32 17.95Q74.63 23.37 74.63 30.11Q74.63 34.63 72.37 39.37Q70.11 44.11 66 47.37H94V54.74H54.95V46.63Q60.32 44.84 63.79 40.21Q67.26 35.58 67.26 30.11Q67.26 25.16 65 21.26Q62.74 17.37 58.84 15.11Q54.95 12.84 50 12.84Q45.05 12.84 41.16 15.16Q37.26 17.47 35 21.37Q32.74 25.26 32.74 30.11Q32.74 35.68 36.26 40.32Q39.79 44.95 45.05 46.63V54.74ZM6 79.26V71.89H93.89V79.26Z" fill="#111111"/></svg>`,
    'assets/zodiac-glyphs/scorpio.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Scorpio"><path d="M78.2 94 80.05 86.9H75.67Q68.57 86.9 64.39 83.98Q60.21 81.07 58.36 74.8Q56.51 68.52 56.51 58.31V23.7Q56.51 20.2 55.74 16.65Q54.96 13.1 53.6 10.96Q52.24 12.13 50.29 14.7Q48.35 17.28 46.45 20.39Q44.55 23.5 43.14 26.27Q41.73 29.05 41.54 30.5V75.43H34.73V25.16Q34.73 21.56 34.05 17.96Q33.37 14.36 31.82 10.96Q30.46 12.13 28.51 14.7Q26.57 17.28 24.67 20.39Q22.77 23.5 21.36 26.27Q19.95 29.05 19.76 30.5V75.43H12.95V24.38Q12.95 17.47 8.58 6H13.73Q15.09 8.14 16.5 11.49Q17.91 14.85 19.18 19.52Q20.05 17.86 21.85 15.33Q23.65 12.81 25.69 10.23Q27.73 7.65 29.48 6H35.22Q36.97 8.53 38.57 12.47Q40.18 16.4 40.76 19.52Q41.64 17.77 43.49 15.29Q45.33 12.81 47.52 10.28Q49.71 7.75 51.46 6H57.2Q60.5 10.47 61.91 14.85Q63.32 19.22 63.32 24.09V58.31Q63.32 66.97 64.54 71.88Q65.75 76.79 68.48 78.83Q71.2 80.87 75.67 80.87H80.05L78.2 73.77L91.42 83.89Z" fill="#111111"/></svg>`,
    'assets/zodiac-glyphs/sagittarius.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Sagittarius"><path d="M11.76 93.74 6 87.86 33.88 59.85 17 43.22 22.76 37.47 39.51 54.22 79.29 14.19H37.72V6H91.44L94 8.43V62.02H85.69V19.56L45.4 59.98 62.41 76.99 56.65 82.74 39.64 65.73Z" fill="#111111"/></svg>`,
    'assets/zodiac-glyphs/capricorn.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Capricorn"><path d="M34.65 94V88.66Q41.16 88.66 46.26 84.68Q51.36 80.69 55.83 71.56Q53.3 67.68 52.43 62.72Q51.55 57.77 51.55 51.94V25.13Q51.55 20.57 50.49 17.56Q49.42 14.55 46.89 10.95Q45.53 12.22 43.69 15.32Q41.84 18.43 39.7 22.61Q37.57 26.79 35.58 31.5Q33.58 36.21 31.89 40.77Q30.19 45.34 29.21 49.08Q28.24 52.82 28.24 55.15V75.35H21.44V40.09Q21.44 33.97 21.15 29.6Q20.86 25.23 20.08 22.51Q18.63 17.07 15.66 14.64Q12.7 12.22 8.04 12.22V6Q18.24 6 23.05 13.04Q27.85 20.08 27.95 35.72V36.01Q28.83 32.52 30.77 27.85Q32.71 23.19 35.14 18.63Q37.57 14.06 39.75 10.61Q41.94 7.17 43.2 6H51.75Q53.5 8.04 55 11.1Q56.51 14.16 57.43 17.36Q58.35 20.57 58.35 23.39V51.65Q58.35 61.27 60.2 65.06Q64.28 59.32 68.26 57.14Q72.24 54.95 77 54.95Q83.8 54.95 87.88 58.4Q91.96 61.85 91.96 67.87Q91.96 74.57 87.44 78.36Q82.93 82.15 75.06 82.15Q70.88 82.15 67.53 80.94Q64.18 79.72 60.3 76.52Q56.51 84.77 49.71 89.39Q42.91 94 34.65 94ZM75.06 76.13Q80.01 76.13 82.88 73.85Q85.74 71.56 85.74 67.87Q85.74 64.96 83.36 62.87Q80.98 60.78 77.1 60.78Q73.41 60.78 70.01 63.06Q66.61 65.35 63.31 70.59Q65.06 72.83 68.5 74.48Q71.95 76.13 75.06 76.13Z" fill="#111111"/></svg>`,
    'assets/zodiac-glyphs/aquarius.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Aquarius"><path d="M9.15 27.61 6 21.73 31.7 6.42 37.99 18.27 57.71 6 64.42 18.27 84.14 6 94 24.25 88.34 27.61 81.73 15.44 62.01 27.61 55.3 15.44 35.58 27.61 28.87 15.44ZM9.15 59.07 6 53.2 31.7 37.89 37.99 49.74 57.71 37.47 64.42 49.74 84.14 37.47 94 55.72 88.34 59.07 81.73 46.91 62.01 59.07 55.3 46.91 35.58 59.07 28.87 46.91Z" fill="#111111"/></svg>`,
    'assets/zodiac-glyphs/pisces.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Pisces"><path d="M12.96 94Q28.06 73.64 29.23 54.1H8.28V46.61H29.23Q27.82 26.48 12.85 6H21.51Q36.72 24.37 37.89 46.61H62.11Q63.52 23.9 78.49 6H87.15Q71.94 26.24 70.77 46.61H91.72V54.1H70.77Q72.06 73.76 87.04 94H78.49Q63.16 76.1 62.11 54.1H37.89Q36.72 76.33 21.51 94Z" fill="#111111"/></svg>`,
    'assets/element-glyphs/fire.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Fire"><path d="M50 15.359L80 67.321H20Z" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/element-glyphs/water.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Water"><path d="M20 32.679H80L50 84.641Z" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/element-glyphs/air.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Air"><path d="M50 15.359L80 67.321H20Z M20 41.34H80" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/element-glyphs/earth.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Earth"><path d="M20 32.679H80L50 84.641Z M20 58.66H80" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/aspect-glyphs/conjunction.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Conjunction"><circle cx="40" cy="60" r="11" fill="none" stroke="#111111" stroke-width="5.5"/><path d="M47.778 52.222L72 28" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round"/></svg>`,
    'assets/aspect-glyphs/opposition.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Opposition"><circle cx="30" cy="70" r="11" fill="none" stroke="#111111" stroke-width="5.5"/><circle cx="70" cy="30" r="11" fill="none" stroke="#111111" stroke-width="5.5"/><path d="M37.778 62.222L62.222 37.778" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round"/></svg>`,
    'assets/aspect-glyphs/square.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Square"><rect x="23" y="23" width="54" height="54" fill="none" stroke="#111111" stroke-width="5.5" stroke-linejoin="round"/></svg>`,
    'assets/aspect-glyphs/sextile.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Sextile"><path d="M20 50H80M35 24L65 76M65 24L35 76" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/aspect-glyphs/semi-sextile.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Semi-Sextile"><path d="M28 24L50 68L72 24M22 68H78" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/aspect-glyphs/quincunx.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Quincunx"><path d="M28 76L50 32L72 76M22 32H78" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/aspect-glyphs/octile.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Octile"><path d="M24 72H76M24 72L64 32" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/aspect-glyphs/tri-octile.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Tri-Octile"><rect x="26" y="18" width="48" height="48" fill="none" stroke="#111111" stroke-width="5.5" stroke-linejoin="round"/><path d="M38 82H78M38 82L55 52" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/aspect-glyphs/quintile.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Quintile"><path d="M50 18L80.434 40.111L68.816 75.889H31.184L19.566 40.111Z" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'assets/aspect-glyphs/bi-quintile.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Bi-Quintile"><path d="M50 13L77.581 33.041L67.047 65.459H32.953L22.419 33.041Z M22 82H78" fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  });

  function recolor(root, color) {
    root.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(node => {
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      if (fill && fill !== 'none') node.setAttribute('fill', color);
      if (stroke && stroke !== 'none') node.setAttribute('stroke', color);
      node.style.opacity = '1';
    });
  }

  function thickenToNodeWeight(root, entry, color) {
    if (
      entry.id === 'north-node' ||
      entry.id === 'south-node' ||
      entry.id === 'lilith' ||
      entry.id === 'part-of-fortune' ||
      entry.fitMode === 'letter' ||
      entry.fitMode === 'hebrew-letter' ||
      entry.fitMode === 'greek-letter' ||
      String(entry.asset || '').startsWith('assets/zodiac-glyphs/') ||
      String(entry.asset || '').startsWith('assets/element-glyphs/') ||
      String(entry.asset || '').startsWith('assets/aspect-glyphs/')
    ) return;

    root.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(node => {
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      const current = parseFloat(node.getAttribute('stroke-width')) || 0;
      if (stroke && stroke !== 'none') {
        node.setAttribute('stroke', color);
        node.setAttribute('stroke-width', String(current + 0.9));
      } else if (fill && fill !== 'none') {
        node.setAttribute('stroke', color);
        node.setAttribute('stroke-width', '1.15');
        node.setAttribute('paint-order', 'stroke fill');
      }
      node.setAttribute('stroke-linecap', 'round');
      node.setAttribute('stroke-linejoin', 'round');
    });
  }

  async function loadAsset(path) {
    if (cache.has(path)) return cache.get(path).cloneNode(true);
    let source;
    const embedded = canonicalAssets[path];
    if (embedded) {
      source = new DOMParser().parseFromString(embedded, 'image/svg+xml').documentElement;
    } else {
      const response = await fetch(path + '?v=0d56ee7');
      if (!response.ok) throw new Error('Could not load glyph asset: ' + path);
      source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
    }
    cache.set(path, source);
    return source.cloneNode(true);
  }

  function numericStrokeWidth(node) {
    const direct = parseFloat(node.getAttribute('stroke-width'));
    if (Number.isFinite(direct)) return direct;
    const computed = parseFloat(getComputedStyle(node).strokeWidth);
    return Number.isFinite(computed) ? computed : 0;
  }

  function largestStroke(root) {
    let max = numericStrokeWidth(root);
    root.querySelectorAll('*').forEach(node => { max = Math.max(max, numericStrokeWidth(node)); });
    return max;
  }

  function availableRadius(radius, padding, bubbleStrokeWidth) {
    const gap = Math.max(1, Number(padding) || 1);
    return Math.max(1, radius - Math.max(0, Number(bubbleStrokeWidth) || 0) / 2 - gap);
  }

  function fit(node, radius, padding, entry, bubbleStrokeWidth) {
    node.removeAttribute('transform');

    if (entry.fitMode === 'letter' || entry.fitMode === 'hebrew-letter' || entry.fitMode === 'greek-letter') {
      node.setAttribute('transform', `translate(${entry.dx || 0} ${entry.dy || 0})`);
      return;
    }

    if (entry.fitMode === 'lilith') {
      const referenceAvailableRadius = 16.825;
      const scale = availableRadius(radius, padding, bubbleStrokeWidth) / referenceAvailableRadius * (Number(entry.scale) || 1);
      node.setAttribute('transform', `translate(${entry.dx || 0} ${entry.dy || 0}) scale(${scale})`);
      return;
    }

    let box;
    try { box = node.getBBox(); } catch (_) { return; }
    if (!box || !box.width || !box.height) return;

    const usableRadius = availableRadius(radius, padding, bubbleStrokeWidth);
    const sourceStroke = largestStroke(node);
    const visibleWidth = box.width + sourceStroke;
    const visibleHeight = box.height + sourceStroke;
    let maximumScale;

    if (entry.fitMode === 'symbol') {
      maximumScale = Math.min((usableRadius * 2) / visibleWidth, (usableRadius * 2) / visibleHeight) * 0.9;
    } else if (entry.fitMode === 'box') {
      const innerSquareSide = usableRadius * Math.SQRT2;
      maximumScale = Math.min(innerSquareSide / visibleWidth, innerSquareSide / visibleHeight);
    } else {
      maximumScale = usableRadius / (Math.hypot(visibleWidth / 2, visibleHeight / 2) || 1);
    }

    const scale = maximumScale * Math.max(0.1, Number(entry.scale) || 1);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    node.setAttribute('transform', `translate(${entry.dx || 0} ${entry.dy || 0}) scale(${scale}) translate(${-cx} ${-cy})`);
  }

  function sun(parent, color) {
    const group = svg('g');
    const ring = svg('circle');
    ring.setAttribute('r', '10');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', color);
    ring.setAttribute('stroke-width', '1.45');
    const dot = svg('circle');
    dot.setAttribute('r', '2.15');
    dot.setAttribute('fill', color);
    group.append(ring, dot);
    parent.appendChild(group);
    return group;
  }

  function fortune(parent, color) {
    const group = svg('g');
    group.innerHTML = '<circle cx="0" cy="0" r="9" fill="none"/><path d="M-6.35-6.35L6.35 6.35M6.35-6.35L-6.35 6.35" fill="none"/>';
    group.querySelectorAll('*').forEach(node => {
      node.setAttribute('stroke', color);
      node.setAttribute('stroke-width', '1.45');
      node.setAttribute('stroke-linecap', 'round');
      node.setAttribute('stroke-linejoin', 'round');
    });
    parent.appendChild(group);
    return group;
  }

  function textGlyph(parent, entry, color) {
    const text = svg('text');
    const aspectLetter = entry.fitMode === 'aspect-letter';
    const hebrewLetter = entry.fitMode === 'hebrew-letter';
    const greekLetter = entry.fitMode === 'greek-letter';
    const lettered = entry.fitMode === 'letter' || aspectLetter || hebrewLetter || greekLetter;
    text.textContent = entry.fallback;
    text.setAttribute('x', '0');
    text.setAttribute('y', hebrewLetter ? '-2' : '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', color);
    if (hebrewLetter) {
      text.setAttribute('direction', 'rtl');
      text.style.fontFamily = 'Noto Serif Hebrew,SBL Hebrew,Ezra SIL,David Libre,Times New Roman,serif';
    } else if (greekLetter) {
      text.style.fontFamily = 'Noto Serif,Times New Roman,Georgia,serif';
    } else {
      text.style.fontFamily = lettered ? 'Arial,Helvetica,sans-serif' : 'Apple Symbols,Segoe UI Symbol,Noto Sans Symbols 2,serif';
    }
    text.style.fontWeight = entry.fontWeight || (lettered ? '700' : '600');
    text.style.fontSize = hebrewLetter ? '31px' : greekLetter ? '30px' : aspectLetter ? '24px' : lettered ? '16px' : '34px';
    if (entry.id === 'asc' || entry.id === 'dsc') text.style.letterSpacing = '-0.35px';
    parent.appendChild(text);
    return text;
  }

  async function draw(parent, identity, options) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);

    const radius = Number(options?.radius || 18);
    const padding = Number(options?.padding ?? 1);
    const color = options?.color || '#dc1f18';
    const bubbleStrokeWidth = Number(options?.bubbleStrokeWidth || 0);
    let art;

    if (entry.id === 'sun') art = sun(parent, color);
    else if (entry.asset) {
      const source = await loadAsset(entry.asset);
      art = svg('g');
      Array.from(source.children).forEach(child => art.appendChild(document.importNode(child, true)));
      parent.appendChild(art);
      recolor(art, color);
    } else if (entry.fallback === 'fortune') art = fortune(parent, color);
    else art = textGlyph(parent, entry, color);

    art.classList.add('relphi-canonical-glyph', 'relphi-glyph-' + entry.id);
    thickenToNodeWeight(art, entry, color);
    await new Promise(resolve => requestAnimationFrame(resolve));
    fit(art, radius, padding, entry, bubbleStrokeWidth);
    return art;
  }

  function createBubble(parent, identity, options) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);

    const radius = Number(options?.radius || 19);
    const color = options?.color || '#dc1f18';
    const strokeWidth = Number(options?.strokeWidth || 2.35);
    const root = svg('g');
    root.classList.add('relphi-glyph-bubble');
    root.dataset.glyphId = entry.id;
    const circle = svg('circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', options?.fill || '#fff');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(strokeWidth));
    root.appendChild(circle);
    parent.appendChild(root);
    const ready = draw(root, entry.id, {
      radius,
      padding: options?.padding ?? 1,
      color,
      bubbleStrokeWidth: strokeWidth
    });
    return { root, circle, entry, ready };
  }

  window.RelphiGlyphComponent = Object.freeze({
    draw,
    createBubble,
    fit,
    recolor,
    canonicalSource: '0d56ee7ec0ea0fc3e44debcb809afde09f3271ab'
  });
})();