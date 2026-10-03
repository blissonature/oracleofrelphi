const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('tarot-app.js','utf8');
const css = fs.readFileSync('style.css','utf8');

const ingredients = js.match(/function lockedIngredientsHtml\(card\) \{[\s\S]*?\n  \}/);
assert.ok(ingredients,'lockedIngredientsHtml must exist');
assert.match(ingredients[0],/locked-ingredients--tiles/);
assert.match(ingredients[0],/locked-ingredient-grid/);
assert.match(ingredients[0],/locked-ingredient-card/);
assert.match(ingredients[0],/locked-ingredient-type/);
assert.doesNotMatch(ingredients[0],/role="tab"|data-ingredient-tab|data-ingredient-panel|hidden/);
assert.match(css,/\.locked-ingredient-grid\s*\{[\s\S]*?grid-template-columns: repeat\(auto-fit, minmax\(13rem, 1fr\)\)/);
assert.match(css,/\.locked-ingredient-type\s*\{/);

console.log('Card Ingredients render as an all-visible responsive tile grid rather than tabs.');
