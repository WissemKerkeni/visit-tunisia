# Translating part 7 of Discover Tunisia

Discover Tunisia is a travel website: a living map of Tunisia with places, weather, festivals, itineraries, a practical
"before you go" guide, food, a few Tunisian Arabic phrases, and monuments to walk in 3D.

## Input
- Languages de, it, es, ru, uk, pl, cs, nl, zh: translate every string of `references/i18n/part7.json` (a JSON array of English texts).
- Languages fr and ar: translate every string of `references/i18n/part7-t1.json` instead.

## Output
Write `references/i18n/<lang>/part7.json`: one JSON object whose keys are the English texts, exactly as given
(character for character, including curly apostrophes ’ and dashes –), and whose values are the translations.
Every input string must be a key. Valid JSON (escape double quotes inside values). Then run
`node -e "JSON.parse(require('fs').readFileSync('references/i18n/<lang>/part7.json','utf8'))"` to check it parses,
and check the key count equals the input length.

## Rules
- Keep placeholders such as {month}, {n}, {y}, {zone}, {authors}, {title}, {author}, {km}, {h} exactly, untranslated.
- Keep emoji, numbers, times (8:00–18:00), prices and units. "dinars" = the Tunisian dinar, use the normal word in the language.
- Proper names: keep place names in the form usual in that language (Tunis, Kairouan, Djerba…); festival names may be
  translated naturally (e.g. "Carthage Film Festival") but keep "JCC"-style acronyms if present. Keep dish names
  (couscous, brik, lablabi…), "Derja", "Tounsi", "louage", "TGM", "Sahel Metro", app and company names as they are.
- Natural, concise, friendly travel-guide style; the same register as the existing site translations. For de, it, es,
  ru, uk, pl, cs, nl, zh look at `src/locales/<lang>.json` for the site's existing terms (e.g. how "My trip",
  "Hotels nearby", "Show on map" were translated) and stay consistent. For fr and ar, the existing French and Arabic
  are beside the English in `src/i18n.ts`.
- Arabic: Modern Standard Arabic, readable by Tunisians; Tunisian month names are fine (جانفي، فيفري…) as used in src/i18n.ts.
- Chinese: Simplified Chinese.
- Facts must stay exactly as in English (numbers, dates, who advises what). Do not add or drop information.
- Do not edit any other file.
