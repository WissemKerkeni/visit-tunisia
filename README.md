# Visit Tunisia

A living map of Tunisia in the browser: beaches, oases, Roman cities, wildlife and transport, with a trip planner, and twelve monuments you can walk through in 3D. The first monument built was the **Amphitheatre of El Jem**, in code, to its real dimensions (148 × 122 m, 36 m high, arena 64 × 39 m). The site was called "Walk Tunisia" until the map grew beyond the monuments.

See [PLAN.md](PLAN.md) for the full plan.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. `npm run build` makes a static site in `dist/` that you can host anywhere (Netlify, Cloudflare Pages, GitHub Pages).

## Home page

A zoomable map of the whole country (`src/ui/atlas-map.ts`, an SVG; the dusk palette comes from the Stitch design "Tunisian Odyssey"):

- **The land is real.** Tunisia's colours come from NASA Blue Marble (public domain), with hill shading computed from AWS Terrain Tiles, so the green north, the steppe, the chotts and the dunes of the Grand Erg are where they really are (`node scripts/make-atlas.mjs` writes `public/atlas/relief.webp`). The big lakes and salt flats and the Medjerda river are outlines from OpenStreetMap; region names are written on the land.
- **Zoom and pan.** Wheel up from the top of the page, pinch, double-click or the + / − buttons; drag to move once zoomed in. Wheeling down at the whole-country view gives the wheel back to the page. Pins and labels keep their size on screen; names of the smaller places appear from zoom 2.6. A scale bar follows the zoom.
- **Places.** 54 in all: the 12 monuments built in 3D and 42 places that are cards only (`src/content/places.ts`): heritage, beaches, nature, the Sahara and its oases. Filter chips choose the kinds shown, on the map and in the list of cards below it. A search box finds a place by name; "Surprise me" picks one.
- **A card for each place:** photo with credit, short text, when to go, rough distance and driving time from Tunis, the nearest airport and (within 60 km) train station, festivals nearby, a hotel search for the nearest town with places to stay, tours, directions and a share button (the system share sheet on phones, else the link is copied). Monuments and museums show their opening hours, ticket price and closing day, with the year they were checked (`VISITS` in `src/content/guide.ts`; prices for foreign visitors went up on 1 April 2026 and go up again in January 2027). The 3D monuments open from their card.
- **Wildlife layer:** eleven animals placed where sources record them (flamingos on Sebkhet Sijoumi and at Korba, wintering ducks at Ichkeul, storks at Sejnane, Barbary deer at El Feija, wild boar in Kroumirie, birds of prey over El Haouaria, loggerhead turtles on the Kuriat Islands, oryx at Bou Hedma, dromedaries at Douz, the fennec in the Erg).
- **Getting around layer:** nine airports, the railways, the three motorways and the ferries (Kerkennah, Djerba, La Goulette), drawn schematically through their main stops (`src/content/atlas.ts`), with trains and planes moving on them.
- **Journeys and "My trip":** five ready-made routes (Roman Africa, medinas and ribats, the northern coast and Cap Bon, oases and dunes, the Star Wars trail) and the visitor's own list of stops, ordered from Tunis by nearest neighbour, drawn on the map with a rough total distance and driving time, kept in the browser and shareable as a link (`#/trip/a,b,c`). With an arrival date and a number of nights per stop, every hotel link searches the right dates for that stop.
- **Weather layer:** live conditions in 24 towns (Open-Meteo forecast API, no key, one request kept for 30 minutes), or, with a month picked, the typical daytime high and sea temperature there in that month. Each card shows the weather now and the next three days at the nearest town, and the year month by month (bars for the daytime high, a line for the sea), from averages over 2015–2024 (`node scripts/make-climate.mjs` writes `src/content/climate.ts`; ERA5 and the Open-Meteo marine model, CC BY 4.0). Hours of sunshine are left out: the source overstates them in winter. The Open-Meteo forecast API is free for non-commercial use only; `VITE_LIVE_WEATHER=off` turns the live part off (the averages stay).
- **Icons:** each 3D monument has its own drawn icon on a cream badge with a terracotta ring (`src/ui/monument-icons.ts`); orange waves play only round the one you pick; the other places have a white pictogram of their kind (beach, oasis, fort, lighthouse, canyon, waterfall…) on a disc in the colour of their category (`src/ui/place-icons.ts`). Names show on hover and when zoomed in. The map opens framed on the country from the north coast to the edge of the Grand Erg; zooming out shows the far south. Pins are drawn at 70 % on phones.
- **Search and language menu:** the search lists matching places as you type (accents ignored, any language or English names) with their icon and category; arrow keys and Enter work. The language menu shows flags (drawn in SVG, since flag emoji do not show on Windows) and each language's own name; Arabic carries the flag of Tunisia.
- **Hotels and tours:** every card has a "Hotels nearby" button for the nearest town with places to stay (Booking.com search), as do the cards below the map, and a "Tours and activities" link (GetYourGuide search). Affiliate ids go in `.env.local` (see below).
- **Filters:** a place hidden by a filter closes its card; animals show with "Everything" or "Nature"; picking a place from the search or a journey brings back the pins it needs.
- **Life:** fishing boats rocking off the ports, ferries crossing, a caravan between Douz and Ksar Ghilane, flamingos flying between the northern lagoons, a bird of prey circling Cap Bon, clouds, surf on the coast, shimmer on the salt lakes. Everything pauses when the map is off screen and is left out for visitors who ask for reduced motion.

### Views

The home page has five views, chosen in the top bar (a sliding terracotta highlight) or, on phones, in a tab bar at the bottom; each has its own address (`#/plan`, `#/guide`, `#/events`, `#/food`; the map is `#/`), so the back button and shared links work. The layout follows the Stitch screens in `references/design/` (desktop home, phone, trip planner, food page), made in November 2026 with the "Tunisian Odyssey" design system.

- **Explore** (`src/ui/landing.ts`): the map with its filter panel (categories with icons, three layer tiles, journeys) and the place card. The card keeps the photo, name, "Walk in 3D" and hotels at the top, and puts the rest under four tabs: Overview (when to go, distance from Tunis, festivals nearby), Visit (hours and tickets, tours), Weather, Getting there (airport, station, directions); "Add to my trip" and Share sit at the bottom. On phones the card is a sheet over the map: drag or tap its handle to open it fully or lower it, drag it down to close it; it hides while the map is scrolled away. Under the map, four picture cards lead to the other views, then every place as a card.
- **Plan my trip** (`src/ui/plan-view.ts`): the 3-, 7- and 10-day itineraries as cards; the chosen one opens as a day-by-day timeline (driving distance per day, a photo, and a hotel search for that night, with dates once an arrival date is set). "My trip" shows the visitor's own stops the same way, with nights per stop. A side panel has a small map where the route draws itself through numbered stops, the arrival date, the totals and the buttons (show on the big map, make it my trip, copy link). The five themed journeys are below.
- **Before you go** (`src/ui/guide.ts`): twelve tiles: visas, money (with a dinar converter: daily rates from the free Exchange Rate API, credited on the page, kept 12 hours), safety, health, emergency numbers, phone and internet, electricity, airports, getting around, customs, holidays and Ramadan, language, each with its sources.
- **What's on:** 18 festivals by month, each card with the photo of the nearest place; the month is shared with the weather layer. Festivals that skipped recent years or move with the Islamic or Hebrew calendar say so.
- **Food:** 14 dishes and products, each with a photo (Wikimedia Commons, credited, `public/photos/food/`, from `references/food/picks.json`), its Arabic name, where it is best and a link to that place on the map, filtered by kind (street food, main dishes, sweets, drinks and products); then 20 phrases of Tunisian Arabic in Latin letters and Arabic script.

Animations: views cross-fade (View Transitions where the browser has them), cards and tiles rise into place as they scroll into view, the place card slides in while its photo slowly settles, card tabs fade, food cards pop when filtered, the planner's route draws itself and its stops pop in, the trip distance counts up. All of it is off for visitors who ask for reduced motion. Icons are line drawings in `src/ui/icons.ts`.

## Place pages, sharing and search engines

`npm run build` also writes a page for every place in every language (`dist/<lang>/<place>/index.html`, 648 pages, by `scripts/make-pages.mjs`) and a home page per language. Each has its own title, description, share preview (Open Graph), links to its other languages (hreflang), structured data (schema.org `TouristAttraction`) and the place's text, facts, hours and tickets as plain HTML for search engines and visitors without JavaScript; the map then opens on that place. Set `VITE_SITE_URL` to add canonical links, absolute share images, `sitemap.xml` and `robots.txt`.

## Settings

Copy `.env.example` to `.env.local` and fill in what you have:

- `VITE_SITE_URL`: the address the site will live at (for the sitemap and share previews).
- `VITE_BOOKING_AID`, `VITE_GYG_PARTNER_ID`: Booking.com and GetYourGuide affiliate ids. Without them the links work but earn nothing.
- `VITE_LIVE_WEATHER=off`: turns off the live forecast (Open-Meteo's free API is for non-commercial use; a commercial site needs their paid plan). The climate averages stay.

## Offline and installable

The built site is a progressive web app (`public/manifest.webmanifest`, `public/sw.js`, icons from `node scripts/make-icons.mjs`): Chrome, Edge and Android offer to install it (a button appears in the footer), and iPhone users can add it to the home screen. Pages come from the network when there is one and from the cache otherwise; built files are cached for good, photos and data are served from the cache and refreshed in the background. What a visitor has seen works offline, including on their first visit. Live weather and exchange rates need a connection. Raise `VERSION` in `public/sw.js` to drop old caches.

Distances and times are estimates (straight line × 1.25, about 75 km/h) and are labelled as such. The transport lines are schematic. Each place's coordinates and lead photo come from Wikipedia and Wikimedia Commons (`node scripts/find-place-photos.mjs`, then `node scripts/prep-site-photos.mjs references/places/picks.json places`); ten photos were replaced by hand after checking the contact sheet (Le Kef, Mahdia and Testour in November 2026: `references/places/picks-2026-11.json`).

## Languages

Twelve languages: English, French and Arabic are written in the code next to each interface text, and the guide's texts are written in English only (`T1`), so French and Arabic for those come from `src/locales/fr.json` and `ar.json`; German, Italian, Spanish, Russian, Ukrainian, Polish, Czech, Dutch and Simplified Chinese are in `src/locales/<lang>.json`, keyed by the English text, and loaded only when chosen. The first visit picks the visitor's browser language; the choice is remembered. A text missing from a translation shows in English. Chinese uses the system's Chinese fonts.

To update the translations after changing English texts: `node scripts/i18n-extract.mjs` lists every English text in `references/i18n/source.json`; the translations live in parts under `references/i18n/<lang>/`, and `node scripts/i18n-merge.mjs <lang>` merges them and checks that every text is translated and every `{placeholder}` kept (`node scripts/i18n-check.mjs <lang>` checks only; for French and Arabic it checks the English-only texts listed in `references/i18n/t1.json`). Two English texts must not be shared between different meanings, since each English text has one translation (the trip's "Clear" button and the weather's "Clear sky" are kept apart for that reason). The translations were made with AI and checked for completeness, not proofread by native speakers.

## Sidi Bou Said

The village on its cliff above the Gulf of Tunis (`#/sidi-bou-said`), built from real data:
- terrain from AWS Terrain Tiles (SRTM-based, 4 m grid), with the shoreline taken from the OpenStreetMap coastline;
- streets, cobbled lanes, about 560 mapped buildings, gardens, cemetery, pools and marina piers from OpenStreetMap; houses on mapped streets without mapped buildings are generated (dense in the old village, villas with gardens on the slopes);
- look from reference photos: lime-washed walls, arched blue doors studded with black nails, blue window cages and wooden balconies, flat white roofs and small domes, bougainvillea, the white minaret, the Café des Nattes steps and striped arch, the lighthouse on the summit, boats in the marina, Aleppo pines on the slopes;
- the Café des Délices (Café Sidi Chabaane): its real outline from OpenStreetMap stepped down the cliff into white terraces with blue-capped parapets, blue-and-white striped benches, tables, blue umbrellas, steps between levels, palms and a small domed pavilion;
- night: lit windows, wall lanterns along the lanes, lamp posts on the marina piers, warm lights at the cafés and main lanes, a floodlit minaret and the lighthouse with turning beams;
- eight places to see with real photos (Wikimedia Commons, credited); "Go there" finds a clear spot with a view of each landmark.

Refresh the data with `node scripts/make-village.mjs` (the OSM download command is at the top of the script).

Each monument is a site definition in `src/sites/` (build, hotspots, texts, intro orbit); `src/main.ts` lists them and the viewer and site UI are shared.

## Carthage

From Byrsa Hill to the sea (`#/carthage`), on the same shared terrain-town builder (`src/monuments/common/terrain-town.ts`) as Sidi Bou Said:
- terrain, coastline, streets, ruins outlines and the Cathédrale Saint-Louis footprint from real data (`node scripts/make-village.mjs carthage`);
- the Antonine Baths modelled from their published plan, aligned on the shore and anchored on the real position of the re-erected frigidarium column: vaulted basement rooms, masses of fallen Roman concrete, the frigidarium piers and its two standing columns, five caldarium apses facing the sea, the latrines, the natatio, palaestra column stumps;
- the Roman theatre fitted to its mapped outline, the Villa de la Volière peristyle, the Punic quarter on Byrsa, low walls on the other mapped ruins;
- eight places to see with real photos (Wikimedia Commons, credited). The ruins are simplified.

## Dougga

The Roman town of Thugga on its hillside (`#/dougga`), on the same terrain-town builder with house generation turned off (`fill: false`) and shared Roman pieces in `src/monuments/common/roman.ts` (columns, temples, theatre, arches, low ruins):
- terrain at 465–620 m and every monument outline from real data (`node scripts/make-village.mjs dougga`); inland sites get a terrain skirt out to the horizon instead of a sea plane;
- the Capitol (porch of four columns, pediment, cella on its podium), the theatre fitted to its outline, the Temple of Juno Caelestis in its half-moon court, the Libyco-Punic mausoleum, the arches of Severus Alexander and Septimius Severus, the Temple of Saturn's porch, the forum, the Square of the Winds, low walls on the houses, baths and other temples, olive trees among the ruins;
- eight places to see with real photos (Wikimedia Commons, credited). The ruins are simplified.

## Kairouan

The Great Mosque, the walled medina and the Aghlabid basins (`#/kairouan`), on the terrain-town builder with the medina as the old town (`corePoly`, from the mapped ramparts) and its blocks filled with courtyard houses (`blockYaw`):
- terrain, streets, ramparts, gates and monument outlines from real data (`node scripts/make-village.mjs kairouan`, which now also exports `barrier=city_wall` lines and `historic=city_gate` points); the ground is levelled under the mosque and the basins (`flatten`), because the free elevation data includes their roofs;
- the Great Mosque laid out in its mapped outline from the published plan: buttressed walls with merlons, the three-tier minaret, the courtyard with its arcades, well-heads and sundial, the portico with the Bahu dome, the prayer hall of 17 naves with its column forest, mihrab, minbar and the ribbed mihrab dome;
- the ramparts with bastions, the gates (striped voussoirs at Bab ech Chouhada and Bab Tunis), the Aghlabid basins with their buttresses and central pier, the Mausoleum of Sidi Sahab, the Mosque of the Three Doors and Bir Barouta;
- eight places to see with real photos (Wikimedia Commons, credited). Medina houses are generated; shapes are simplified.
- kept light (about 0.75 M triangles, from 2 M): an 8 m terrain grid on the flat plain (`terrainStep`), light tree models beyond 200 m (`treeR`), half the scrub (`scrub`), and at most about 3,000 tombs per cemetery. Flat ground layers (roads, tracks, paving) no longer cast shadows on any site.

## Sousse

The Ribat, the Great Mosque, the Kasbah and the walled medina above the harbour (`#/sousse`), on the terrain-town builder with the real coastline and the medina ring chained from the mapped wall segments (`wallRing` in `src/monuments/common/islamic.ts`, the shared module for Kairouan and Sousse: horseshoe arcades, ribbed and zigzag domes, merlons, ramparts and gates):
- the Ribat on its mapped outline: round towers, the projecting gate with antique columns, two storeys of cells round the courtyard, and the round watchtower (nador) on its square base;
- the Great Mosque in its mapped outline: crenellated walls, round northern towers with the muezzin's domed kiosk, the courtyard arcades with the inscription band, the 13-nave prayer hall and its two domes;
- the Kasbah walls with the museum's garden courts, the Khalef al-Fata tower (mapped as the lighthouse it is today), the Kalaout el-Koubba with its zigzag-ribbed dome (seen from its roof terrace), the ramparts and gates;
- eight places to see with real photos (Wikimedia Commons, credited). Medina houses on unmapped plots are generated; shapes are simplified.

The shared builder now runs a site's `special` hook before its default lighthouse and palace models, so a site can claim a mapped building first.

## Sbeitla

The Roman town of Sufetula (`#/sbeitla`), on the terrain-town builder (the modern town's houses generated outside the archaeological park; the ruins are mapped as areas and built from their outlines) and the shared Roman pieces in `src/monuments/common/roman.ts` (now also `archFrom`, `outlineWall`, and roofless temples with `roof: false`):
- the forum in its mapped enclosure: the three-bay Antonine gate, porticoes, the paved square, and the three temples side by side on their terrace, linked by arches (the northern one without its pediment), in the warm ochre stone of the site;
- the single-bay Arch of the Tetrarchy, the theatre above the wadi, the great baths, the Byzantine churches (Vitalis, Bellator, Servus...), the small Byzantine forts, the amphitheatre rings, the aqueduct bridge;
- eight places to see with real photos (Wikimedia Commons, credited). Shapes are simplified.

The shared builder now clips its area loops to the map: mapped areas can reach far beyond it (Sbeitla's wadi is a polygon about 14 km across), which used to stall the build.

## Djerba

The village of Erriadh (Hara Sghira) and the Ghriba synagogue (`#/djerba`), on the terrain-town builder with every one of the 1,300 houses from OpenStreetMap (no generated ones), many more roof domes (`domes`), palms and olive trees in the fields, and the inland horizon forced on (`inland: true`, since the sea is 5 km away):
- the Ghriba: thick white walls on its mapped outline with a door on the street side, and inside a hall of blue-tiled walls, white horseshoe arcades on blue columns, a painted wooden ceiling, brass lamps and the Ark; the pilgrims' caravanserai beside it with a two-storey arcade on its front;
- the Djerbahood murals: procedural paintings (canvas textures) on street walls around the village square;
- the mosques with their short minarets, and the white domed shrines of the countryside;
- seven places to see with real photos (Wikimedia Commons, credited). Shapes are simplified; the murals are generated.

Houmt Souk (Borj el Kebir, the souks and fondouks) is 7 km north and would be a scene of its own.

## Matmata

The troglodyte pit houses of Matmata el Qadima (`#/matmata`), with the courtyards cut out of the terrain so you can walk down into them:
- the 18 courtyard pits mapped in OpenStreetMap (as closed `natural=cliff` rings) plus about 75 generated on open ground near them, most of them abandoned; each is a round courtyard 6 to 8 m deep, lime-washed below and bare ochre soil above, with vaulted rooms dug in at the floor, granary doors higher up (one reached by white steps), and a sloping entrance tunnel that rises to meet the hillside in a sunken lane, chosen towards lower ground;
- Hotel Sidi Driss: the three mapped pits nearest the hotel, joined by underground passages, with rooms you can walk into (beds on platforms, lamps at night);
- the village above ground in local stone colours, packed-earth lanes, and palms and olive trees in the hollows;
- seven places to see with real photos (Wikimedia Commons, credited). Shapes are simplified.

New options of the terrain-town builder: `holes` (outlines cut out of the terrain once the heights are loaded; the grid cells each hole touches are re-triangulated around it, so the ground meets the outline exactly), `smooth` (blur the heights to drop stripes in the elevation data), `paved` (which roads are asphalt), `houseColors` and `palette` (soil and scrub). Heights are now kept as floats after loading, so smoothing and averaging leave no 10 cm terraces (they showed as contour-line stripes on gentle slopes).

## Ksar Ouled Soltane

The fortified granary south of Tataouine (`#/ksar-ouled-soltane`), on its hilltop with the village and roads around it from OpenStreetMap:
- the outline and the first courtyard come from the mapped multipolygon (its inner ring, now exported by `make-village.mjs` as `holes`); the second courtyard is the notch in the outline that opens east towards the café and car park;
- a plastered base two storeys high on the whole outline, and on the courtyard sides columns of ghorfas rising to three or four storeys, each topped by its barrel vault, which makes the scalloped roofline of the photos; small wooden doors on every level, beam ends under the upper doors, and stair ramps up to upper doors;
- one ghorfa open to walk into (jars inside), and a straight passage roofed with palm trunks between the courtyards;
- the ground under the ksar is levelled to its mean height (`flatten` now takes `level: 'mean'`), so it stays on its crest;
- six places to see with real photos (Wikimedia Commons, credited). Shapes are simplified.

The vault helpers shared by Matmata and the ksar (walls with arched openings, vaulted passages) are in `src/monuments/common/vaults.ts`.

## Bulla Regia

The Roman town at the foot of Jebel Rebia (`#/bulla-regia`), with every one of its 45 mapped ruins from OpenStreetMap:
- the underground floors of the Houses of the Hunt, of Amphitrite and of the Fishing, cut into the terrain (`holes`): a light well open to the sky with Corinthian columns carrying stone architraves and hexagonal openings in the walls above (as in photos of the House of the Hunt), a portico round it under a stone ceiling, a barrel-vaulted main room, a stair down from the surface, a railing round the rim, and dim lamps below;
- mosaic floors drawn in tesserae on canvas textures: generated geometric patterns (rosette squares, interlaced circles, diamonds, a sea with fish), not copies of the real mosaics;
- the theatre, the forum with the Temple of Apollo and the Capitol, the Baths of Julia Memmia with standing arches, the Byzantine fort, the piers of the triumphal arch, and low walls on the other ruins (kept off the underground floors);
- seven places to see, six with real photos (Wikimedia Commons, credited; no free photo of the fort was found). Shapes are simplified.

## Medina of Tunis

The medina and its two suburbs (`#/tunis-medina`), inside their UNESCO World Heritage outline from OpenStreetMap (`node scripts/make-village.mjs tunis-medina`, which now also exports `heritage:operator=whc` outlines as `heritage`, place-of-worship, monument and souk points, and skips the shoreline step for sites with no coastline):
- the Zitouna Mosque in its mapped outline and courtyard: arcades of honey stone on white columns round the court, the prayer hall with naves of columns and arches, the dome over the hall's entrance on its tall square drum and the one over the mihrab, the arcaded east front with flights of steps up from the souks (one per bay, as the lane slopes), and the 1894 minaret with lozenge-net panels (a canvas texture);
- the covered souks: barrel vaults over every mapped lane named Souk… within 260 m of the mosque, shopfronts, skylights, the painted columns of the Souk el Attarine; where a lane runs along the mosque, the vault rests on its wall; vaults are in the collision mesh (well over head height) so that views are never found under them;
- the Kasbah Mosque's Almohad-style minaret, the octagonal minarets of the Youssef Dey, Hammouda Pacha and Dyers' mosques, the Sidi Mahrez Mosque (great dome, half-domes, corner domes, a domed portico, a court ringed by domed galleries, a door out), the Tourbet el Bey (ochre pilastered walls, green-tiled domes), Bab Bhar, Bab Jedid and Bab Mnara;
- the town is packed: new `TownConfig` options `urban` (houses outside the old core packed along the streets, 3 to 5 storeys, no gardens) and `packTight` (lane houses run up to 20 m deep and shorten until they fit, block lots fill their grid cell, a second offset pass fills the gaps); both are off on the other sites;
- eight places to see, all with real photos (Wikimedia Commons, credited). The Youssef Dey minaret stands among covered souks, so its view is from a rooftop café terrace the site builds (the new `rooftop` hotspot flag keeps the houses round it); Hammouda Pacha's view is found when visiting. Shapes are simplified.

## Performance

Trees on every site switch model with distance (`distanceLod` in `src/monuments/el-jem/city.ts`): the detailed street and garden tree (960 triangles) within 140 m of the camera and a 4-clump version (about 100) beyond; grove olives and pines (40) within 350 m and an 8-triangle crown beyond. El Jem's olive groves use a wider 13 m spacing, closer to the dry-farmed Sahel. Triangles per frame at a typical view: El Jem about 1.0 M (from 3.1 M), Sidi Bou Said 0.65 M (from 2.4 M), Carthage 0.73 M (from 1.5 M), Kairouan 0.61 M (from 2.0 M), Dougga 0.29 M (from 0.4 M). Matmata is about 0.25 M with 93 pits, Ksar Ouled Soltane 0.24 M, Bulla Regia 0.30 M, the Medina of Tunis about 0.68 M (the whole scene, the densest of the sites).

## What's in the El Jem scene

- Outer facade: 64 bays × 3 arcaded storeys with engaged columns, a surviving attic sector, ruined upper edges and the breach
- Inner arcade ring, barrel-vaulted ring corridors on two levels, and stairs up to the top gallery
- Restored lower seats, ruined upper cavea, the podium wall with its small doors, axial gates
- Arena with the glass-covered slot, the underground galleries with arched cells, and the vaulted tunnel with a stair to the east gate
- Restored seat sectors next to eroded ones, fallen blocks on the ruined cavea and around the breach
- Stone weathering shader (block-to-block tone, patina, grime at the base, rain streaks, sand dust on ledges)
- Paved esplanade inside the site fence, the stepped front square, gardens with palms and shrubs
- The real town of El Jem from OpenStreetMap: its actual streets, railway, parks, cemeteries and mapped buildings (Al Qsar mosque, museum, ticket kiosk...); streets without mapped buildings get generated 1–3 storey houses. Flat roofs with parapets, water tanks, dishes, shop awnings near the monument, mosques with square minarets
- Tunisian flag at the entrance; sun position corrected for the real orientation of the amphitheatre (long axis bearing 81.7°)
- Subtle bloom and colour grade on High; quality steps down automatically if the first seconds run below ~30 fps
- Real sun position for El Jem (time slider), night mode with floodlights and stars
- 12 points of interest with photos, in English, French and Arabic (right-to-left)
- "Plan your visit" panel with tour and hotel links (affiliate ids in `.env.local`)
- Photo mode, procedural wind sound, quality presets (Low / Medium / High)

Controls: click to look, WASD/arrows (ZQSD on AZERTY) to walk, Shift to run. On phones: left thumb walks, right thumb looks.

## Town data (OpenStreetMap)

The town around the amphitheatre is real map data: © OpenStreetMap contributors, ODbL (credited on the Credits page). To refresh it:

```
curl -A "walk-tunisia-dev" "https://api.openstreetmap.org/api/0.6/map.json?bbox=10.6930,35.2855,10.7210,35.3075" -o references/el-jem/osm/eljem-osm.json
node scripts/make-town.mjs
```

The script centres the data on the arena (from its OSM outline), turns it so the long axis is the scene x axis, and writes `src/content/el-jem-town.json` plus a top-view check image `references/el-jem/osm/preview.png`.

## Houses of the 3D towns

Tunisian houses are not all white and blue, so each town has its own house style (`src/viewer/house-styles.ts`, set with `houseStyle` in the town's build): the plaster colour, the door (arched or square, studded or of planks), the windows (bulging iron cages, flat grilles, or small openings with wooden screens), wooden balconies, and a list of joinery colours, one picked per house.

- **Sidi Bou Said:** lime-white and blue only.
- **Tunis medina:** white and cream, with blue, green, yellow, red-brown, teal and bare-wood doors.
- **Kairouan:** white, blue and green, some wood.
- **Sousse:** white, with blue, green, wood and grey.
- **Carthage:** white villas with square doors in blue, green, wood or grey.
- **Djerba:** white houses with square doors and small screened windows.
- **Matmata, Ksar Ouled Soltane:** earth-coloured plaster, palm-wood doors with a little faded blue or green, small windows.
- **Dougga, Bulla Regia, Sbeitla:** cream and beige village houses with wooden and metal doors.

The walls get real surface relief from scanned textures (Poly Haven, CC0): lime plaster (`painted_plaster_wall`) or earth plaster in the south (`clay_plaster`); balconies show painted planks (`distressed_painted_planks`), and the lanes of the old towns are cobbled (`cobblestone_floor_08`). `node scripts/get-polyhaven.mjs <id> …` downloads more (1k maps) and adds their credits.

## Project layout

```
src/
  main.ts                    routing (#/ = landing, #/el-jem = 3D)
  i18n.ts                    UI strings (en / fr / ar)
  config.ts                  affiliate ids and link builders
  content/                   monument list, places, wildlife and transport (places.ts, atlas.ts), map outline and lakes
  monuments/el-jem/          geometry helpers and the procedural build
  viewer/                    renderer, sky + sun, walker physics, input, props loader, sound
  ui/                        home map (landing.ts, atlas-map.ts), site interface, credits
public/
  textures/                  CC0 textures (Poly Haven) + credits.json
  photos/el-jem/             web-sized CC BY-SA photos + credits.json
references/                  full-size reference photos and source textures (not shipped)
scripts/                     asset helpers (photos, textures, map, contact sheets, make-town.mjs: OSM -> src/content/el-jem-town.json)
```

## Licences

- Code: yours.
- Photos: many authors on Wikimedia Commons, under CC BY, CC BY-SA or CC0 (each one is credited in the app and listed in `public/photos/*/credits.json`; keep the credits if you reuse them).
- Textures: Poly Haven, CC0.
- Map outline: Natural Earth, public domain. Land colours: NASA Blue Marble, public domain. Hill shading: AWS Terrain Tiles. Lakes, salt flats, the Medjerda, streets and outlines: © OpenStreetMap contributors, ODbL.
- Weather: Open-Meteo, CC BY 4.0. Exchange rates: Exchange Rate API (open access, with attribution).
- three.js and three-mesh-bvh: MIT.
