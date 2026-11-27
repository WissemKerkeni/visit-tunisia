# Tunisia Monuments 3D: Plan and Brainstorm

A website where visitors walk through Tunisia's monuments in 3D (Three.js) in the browser, look closely at the details, learn the story of each place, and come away wanting to book a trip.

Status: research and planning. No code yet.

---

## 1. One thing to settle first: what "realistic from photos" means

Web photos alone do **not** become a walkable 3D model automatically. There are three ways to get realism, and the plan mixes them:

| Approach | How it works | Realism | Cost / risk | Best for |
|---|---|---|---|---|
| **A. Modelled from reference photos** | We build the geometry in Three.js using real dimensions + photos as reference, then apply PBR stone/plaster textures | Good to very good | Most work, but we own everything (no licence problems) | Regular architecture: El Jem, Dougga Capitol, Kairouan courtyard, Sidi Bou Said streets |
| **B. Existing 3D scans** | Download scan datasets (e.g. CyArk / Open Heritage 3D) and optimise them for the web | Photoreal | Mostly **CC BY-NC** (no commercial use), datasets are ~25 GB each | Carthage amphitheatre (dataset exists) |
| **C. Our own capture → Gaussian splats** | A photographer/drone shoots 300–1000 overlapping photos or video of one site; we train a Gaussian-splat scene and show it with Spark | Photoreal, "being there" | Needs someone on site in Tunisia; we own it | Later phases: Ksar Ouled Soltane, Matmata, Sidi Bou Said, Bardo mosaics |

Random photos scraped from the web are taken from different cameras, years and lighting, so they rarely work for photogrammetry, and most are not licensed for reuse. We use web photos for **reference, textures colour-matching and info cards** (only openly licensed ones, with credit), not as the 3D source.

**Recommendation:** start with A (fully ours, works now), add B where a licence allows, and plan C as the "wow" upgrade once there is a partner photographer or tourism-office support.

### 1b. AI-assisted pipeline (no photographer, no drone)

Decision: no on-site capture for now, and the project should make money. So CC BY-NC scans are out, and every AI tool must be on a plan that allows commercial use.

Decision (19 Nov 2026): no Tripo, no Blender and no AI-generated 3D models. Everything is built in Three.js code to real dimensions, the town around each monument comes from real map data (OpenStreetMap), and photos and Google Maps are the visual reference.

So the pipeline is:

| Layer | Tool | Notes |
|---|---|---|
| **Walkable architecture** (the shell you walk in) | Procedural Three.js code, built to real dimensions | El Jem is ideal: ellipse + repeated arch bays can be generated in code. Fully ours, accurate, light. |
| **Town around the monument** | OpenStreetMap streets and building footprints (ODbL, attribution in the credits), extruded in code; streets without mapped buildings filled with generated houses | scripts/make-town.mjs converts the download to scene coordinates. |
| **Aerial "fly-in" from the map** | **Google Photorealistic 3D Tiles** streamed into Three.js (3DTilesRendererJS) | Real photo-mesh from Google; must stream (no caching), show Google attribution, billed per request after a free tier. Coverage of Tunisian sites must be checked. |
| **Materials** | CC0 PBR textures (Poly Haven, ambientCG) + AI seamless texture generation, colour-matched to reference photos | |
| **Reference photos** | Prefer CC0 / public domain / CC BY. CC BY-SA input may make the model a derivative that must also be CC BY-SA. Keep a credits file per asset. | |

Honesty rule: anything AI-generated or reconstructed is labelled ("AI-assisted reconstruction") and checked against the real dimensions and photos, so the site doesn't mislead people about what they'll see.

Cheap upgrade later, still no drone: anyone visiting a site with a recent phone can capture a free Gaussian splat with apps like Scaniverse or Polycam. A local guide, a student or a hired photographer on a freelance site could do a site in an afternoon.

---

## 2. Monuments: research summary and priority

Tunisia now has 10 UNESCO World Heritage properties; Sidi Bou Said was reported added in July 2026 (to confirm on whc.unesco.org).

| # | Monument | Key facts for the model | Why it's a good pick | Difficulty | Phase |
|---|---|---|---|---|---|
| 1 | **Amphitheatre of El Jem** (Thysdrus) | c. 238 CE; outer 148 × 122 m, 36 m high; arena 64 × 39 m; 30–35k seats; nearly full height survives; UNESCO 1979 | Iconic, very regular geometry (ellipse + 3 tiers of arches) that's ideal to build procedurally; walk the arena and the underground corridors | Medium | **MVP** |
| 2 | **Sidi Bou Said** | Blue-and-white village, colour rule from 1920s (Baron d'Erlanger, Dar Ennejma Ezzahra palace 1912–22); cliff over the Gulf of Tunis | Most "Instagram" image of Tunisia; strong tourism pull; modular (doors, walls, stairs) | Medium | 2 |
| 3 | **Dougga** (Thugga) | Capitol 166–167 CE to Jupiter, Juno, Minerva, on a high podium with steps; theatre; Libyco-Punic mausoleum; UNESCO 1997 | Best-preserved Roman small town in North Africa; hilltop with olive groves | Medium–high | 2 |
| 4 | **Great Mosque of Kairouan** (Uqba) | Founded 670, Aghlabid rebuild 9th c.; courtyard ~67 × 52 m with double arcades; prayer hall 70.6 × 37.5 m, 17 aisles; ~400 reused Roman columns; minaret 724–728, base ~10.7 m, one of the oldest standing | Huge cultural value; the courtyard and minaret are perfect for a calm walk | Medium | 3 |
| 5 | **Carthage** | Byrsa Hill, Antonine Baths (2nd c. CE, among the largest Roman baths outside Rome), Punic ports | Name everyone knows; strong "then vs now" reconstruction story | High (big site) | 3 |
| 6 | **Ksar Ouled Soltane** (Tataouine) | 15th-c. fortified granary, two courtyards with ghorfas stacked up to 4 floors | Unique look, Star Wars fans; modular build | Low–medium | 3 |
| 7 | **Matmata troglodyte houses** | Berber pit houses dug into the ground around a central courtyard | Surprising, family-friendly; Star Wars location | Low | 3 |
| 8 | **Medina of Tunis** + Zitouna Mosque | UNESCO 1979; ~700 monuments, Almohad/Hafsid periods | Souks, doors, street life; good for ambient sound | High | 4 |
| 9 | **Ribats of Sousse and Monastir** | Monastir 796 CE; Sousse tower 821 CE; coastal fortresses | Climb the tower and look at the sea | Low–medium | 4 |
| 10 | **Djerba** (El Ghriba, Houmt Souk) | UNESCO 2023; El Ghriba synagogue, one of the oldest in Africa | Island + multi-faith heritage | Medium | 4 |
| 11 | **Bulla Regia** | Roman villas built underground to escape the heat, mosaics in place | "Go underground" experience | Medium | 4 |
| 12 | **Sbeitla** (Sufetula) | Three separate temples (Jupiter, Juno, Minerva) side by side, forum | Striking silhouette, simple to model | Low | 4 |
| 13 | **Bardo Museum mosaics** | Largest Roman mosaic collection, incl. the Virgil mosaic | Close-up detail viewer (high-res textures, not a walk) | Low–medium | 4 |
| 14 | **Kerkuane** | Only Punic town the Romans didn't rebuild | Niche, good for the "history layer" | Low | 5 |

Sensitivity notes: Kairouan is an active mosque (show it respectfully, no game elements, show visiting rules); El Ghriba has been attacked (2023), so no security-related details, focus on heritage.

---

## 3. Where the images and 3D data come from

**Reference photos (licence-checked, credited):**
- Wikimedia Commons: "Featured pictures of Tunisia", El Jem HDR panoramas, Dougga high-res series (≈4288 × 2848). Most are CC BY-SA, so we must credit the author and share-alike the photo itself.
- UNESCO WHC photo galleries for each site (check each image's licence).
- Tunisian Ministry of Culture heritage portal (patrimoinedetunisie.com.tn) for official facts and dimensions.
- World History Encyclopedia images of Dougga's Capitol and mausoleum (check licences).

**Textures and lighting (free, CC0, commercial-safe):** Poly Haven and ambientCG for stone, sandstone, plaster, sand, olive trees, HDRI skies. We colour-match them to Tunisian limestone using the reference photos.

**Existing 3D data:**
- CyArk / Open Heritage 3D: **Amphitheatre of Carthage** dataset (CC BY-NC 4.0, free form download, ~25 GB).
- CyArk El Jem virtual tour exists ("Explore in 3D"), but no open download confirmed. We could ask CyArk.
- Academic 3D: Mustis (Musti) arch and temple models (Mainz 3D repository), Dougga theatre lidar (Artfabrik, licence unknown). Useful as references, or to request permission.
- No good open Sketchfab models of El Jem, Kairouan or Sidi Bou Said were found, which is a gap we can fill.

**Our own capture (Phase C):** partner with a Tunisian photographer or drone operator. One site per day, 360° video + stills, trained into Gaussian splats.

---

## 4. Tech stack

| Area | Choice | Why |
|---|---|---|
| Build | Vite + TypeScript | Fast dev, small bundles |
| 3D | three.js (WebGPURenderer, auto WebGL2 fallback) | Modern renderer, TSL post-processing |
| Photoreal scans | **Spark** (`@sparkjsdev/spark`, MIT) for Gaussian splats, with paged LoD | Mixes splats with normal meshes, works on mobile and WebXR |
| Assets | glTF/GLB + **meshopt** geometry compression + **KTX2/Basis** textures | 5–10× smaller downloads, GPU-friendly |
| Walking | First-person controller with capsule collision (`three-mesh-bvh`), touch joystick on mobile, click-to-move | Feels like a real walk, works on phones |
| Lighting | Physical sky/atmosphere, sun from real lat/long + time of day, baked AO/lightmaps for static ruins, HDRI | The Tunisian light is the realism |
| Post FX | Tone mapping (AgX/ACES), SSAO/GTAO, bloom, subtle depth of field in photo mode | Cinematic look |
| UI | Lightweight (Preact or vanilla), CSS for panels | Keep the 3D fast |
| Content | Markdown/JSON per monument (facts, hotspots, sources), i18n files | Easy to add monuments and languages |
| Hosting | Static hosting + CDN (Cloudflare Pages / Netlify), assets streamed per monument | Cheap, fast worldwide |

**Performance budget per monument:** first view < 5 MB, full scene < 40 MB, 60 fps on a mid-range laptop, 30 fps on a 2023 phone. Quality presets: Low / Medium / High / Ultra.

---

## 5. The experience (core features)

1. **Map of Tunisia hub**: a stylised 3D map; click a monument pin to fly in. Shows region, era, travel time from Tunis.
2. **Free walk mode**: WASD/mouse on desktop, joystick + swipe on mobile; walk at human height, real scale.
3. **Hotspots**: glowing markers on details (an arch keystone, a mosaic, an inscription). Click → close-up camera + info card with photo, fact, source.
4. **Inspect mode**: orbit around a single object (a column capital, a door of Sidi Bou Said) in high detail.
5. **Guided tour**: an automatic camera path with narration and subtitles, 3–5 min per monument.
6. **Time of day slider**: sunrise to night; El Jem at sunset, Sidi Bou Said at blue hour.
7. **Ambient sound**: wind, cicadas, sea, call to prayer in the distance (Kairouan, respectfully), footsteps that change on sand vs stone.
8. **"Plan your visit" panel** on every monument: opening hours, tickets, best season, nearby hotels/food, link to the official tourism office. This is how the site brings people to Tunisia.

---

## 6. Extra ideas (brainstorm)

**History and wow factor**
- **Then vs Now slider**: switch El Jem to 238 CE with the velarium (sun awning), painted surfaces and a crowd; Carthage's Punic circular harbour rebuilt; Dougga's Capitol with its roof and colours.
- **Timeline scrubber**: watch a site change from Numidian → Punic → Roman → Byzantine fort → today.
- **Ghost guides**: a stylised Roman spectator at El Jem, a merchant in the medina, a Berber grandmother in Matmata telling the story in first person.
- **Underground El Jem**: walk the corridors under the arena where animals and gladiators waited.

**Engagement**
- **Digital passport**: collect a stamp for each monument visited; share the passport card on social media.
- **Treasure hunt**: find 5 hidden details per site (a carved symbol, a specific mosaic animal). Good for schools.
- **Photo mode**: freeze, frame, filters, then share with a "Discover Tunisia" watermark and link back.
- **Postcard generator**: turn your photo-mode shot into a postcard to send to a friend.

**Smart features**
- **AI guide (Claude)**: ask "why is this mosque's minaret square?" while standing in front of it; answers grounded in our monument fact files, in the visitor's language.
- **Trip builder**: pick the monuments you liked → get a 5/7/10-day itinerary route on a map with distances.
- **Accessibility**: subtitles, audio descriptions, reduced-motion mode, keyboard-only navigation, seated-height camera.

**Platforms**
- **WebXR / VR mode** (Quest, Vision Pro browser): stand in the arena at real scale.
- **AR on phone**: place a mini El Jem on your table.
- **Offline school pack**: a lighter version for classrooms with worksheets.

**Languages**: Arabic (RTL), French, English first; then German, Italian, Spanish, Russian, Chinese, matching Tunisia's main visitor markets.

**Partnerships**: Tunisian National Tourism Office (ONTT), Ministry of Culture / INP heritage institute, CyArk, local guides and hotels (affiliate links could fund the project). Tourism is growing fast (about 10 million arrivals by late November 2025, up ~10%), so the timing is good.

---

## 6b. How the project can make money

Start with the ones that work with low traffic and no sales team, then add the bigger ones once the demo looks great.

| Stage | Revenue stream | How it works | Rough numbers |
|---|---|---|---|
| **Now (with MVP)** | **Affiliate bookings** in the "Plan your visit" panel | Links to tours (GetYourGuide, Viator), hotels (Booking.com), flights. Visitor books, we get a commission | Tours ≈ 8% of booking (up to ~30% on some products); hotels pay a share of Booking's own commission |
| Now | **Social video** | Record cinematic flythroughs of each 3D monument for TikTok / Reels / YouTube Shorts. Brings traffic to the site + platform payouts | Cheap: the 3D scene is the camera crew |
| Now | **Photo mode prints and merch** | Print-on-demand postcards, posters, mosaic-pattern items from in-app shots | Small, but automatic |
| **After launch** | **Hotels, riads and guesthouses** | Sell an embeddable "explore before you come" widget or a custom 3D tour of their property; lobby/kiosk version | Monthly fee or one-off project fee |
| After launch | **Tour operators and travel agencies** | White-label embed of a monument on their trip page (e.g. "Day 3: El Jem") | Licence per monument per year |
| After launch | **Sponsorship** | "Sidi Bou Said, presented by ..." from airlines, hotel chains, regional tourism boards (ONTT) | Annual sponsorship |
| **Later** | **Premium pass** | Free: walk + facts. Paid: Then vs Now reconstructions, VR mode, unlimited AI guide, offline HD | One-time pass or small subscription |
| Later | **Schools and education** | Classroom licence + worksheets + treasure hunts | Per-school / per-year |
| Later | **Grants** | Look into cultural-heritage digitisation and tourism-promotion funding (EU programmes, embassies, UNESCO-related partners) | Not guaranteed; worth applying |
| Later | **Selling 3D models** | Sell our own procedural/AI models on Sketchfab/CGTrader or as 3D-print miniatures, only where every input licence allows it | Side income |

Things this changes in the build: every asset must be cleared for commercial use; the "Plan your visit" panel and photo mode are in the MVP from day one; analytics (privacy-friendly) from day one so we can show traffic to partners.

Rough running costs: hosting free–$20/month.

---

## 7. Phased roadmap

| Phase | Scope | Deliverable |
|---|---|---|
| **0. Setup** (≈1 week) | Vite + three.js project, controller, quality presets, asset pipeline (glTF → meshopt + KTX2), content format, licence/credit system | Empty walkable test scene, credits page |
| **1. MVP** (≈2–3 weeks) | Landing page + Tunisia map hub + **El Jem** fully walkable with 8–10 hotspots, time of day, plan-your-visit panel, EN/FR/AR | First public demo |
| **2. Expand** (≈3–4 weeks) | **Sidi Bou Said** street + **Dougga** Capitol & theatre; guided tours; ambient audio; photo mode | 3 monuments |
| **3. South & spiritual** (≈4 weeks) | **Kairouan** courtyard + minaret, **Ksar Ouled Soltane**, **Matmata**, Carthage (Byrsa/baths); Then vs Now for El Jem | 7 monuments |
| **4. Smart & immersive** | AI guide, trip builder, passport, WebXR, Bardo mosaic viewer, more languages | Feature-complete v1 |
| **5. Photoreal upgrade** | Own captures → Gaussian splats (Spark) for selected sites; medina, ribats, Djerba, Bulla Regia, Sbeitla | v2 |

Each monument follows the same steps: research facts + dimensions → collect licensed reference photos → block out real-scale geometry → detail + PBR materials → lighting + bake → hotspots + content → optimise → test on phone.

---

## 8. Decisions needed from you

Settled: commercial project (no CC BY-NC assets); no photographer or drone, so we use the AI-assisted pipeline (section 1b).

1. **First monument**: I recommend El Jem (iconic, regular geometry, best fit for a first build).
2. **Downloading reference images**: OK to download openly licensed (Wikimedia Commons CC0 / CC BY / CC BY-SA) photos into `references/` with a credits file?
4. **Languages for launch**: EN / FR / AR?

---

## Sources

- [List of World Heritage Sites in Tunisia (Wikipedia)](https://www.wikipedia.com/wiki/List_of_World_Heritage_Sites_in_Tunisia), [UNESCO search](https://whc.unesco.org/en/list/search=tunisia&order=year), [Sidi Bou Said inscription (Africanews)](https://www.africanews.com/2026/07/26/tunisian-town-of-sidi-bou-said-added-to-unesco-world-heritage-list/)
- [Amphitheatre of El Jem (Wikipedia)](https://en.wikipedia.org/wiki/Amphitheatre_of_El_Jem), [Tunisian Ministry of Culture: El Jem](https://www.patrimoinedetunisie.com.tn/en/monuments/the-amphitheatre-of-thysdrus-el-jem/), [CyArk El Jem](https://tapestry.cyark.org/content/el-jem/about)
- [Capitol of Dougga (Heurist)](https://heurist.huma-num.fr/heurist/judaism_and_rome/view/84), [Dougga (World History)](https://www.worldhistory.org/timeline/Dougga), [Dougga site (patrimoinedetunisie)](https://www.patrimoinedetunisie.com.tn/en/sites/the-archaeological-site-of-dougga/)
- [Great Mosque of Kairouan (Wikipedia)](https://en.wikipedia.org/wiki/Great_Mosque_of_Kairouan), [patrimoinedetunisie: Kairouan](https://www.patrimoinedetunisie.com.tn/en/monuments/the-great-mosque-of-kairouan/)
- [Sidi Bou Said guide](https://www.themediterraneantraveller.com/sidi-bou-said/), [Bardo Museum](https://patrimoinedetunisie.com.tn/en/museums/the-national-bardo-museum)
- [Ksar Ouled Soltane (Wikiwand)](https://wikiwand.com/en/Ksar_Ouled_Soltane), [Ksour & troglodytes tentative list](https://www.worldheritagesite.org/tentative/id/6444)
- [Ribat of Sousse](https://en.wikipedia.com/wiki/Ribat_of_Sousse), [Ribat of Monastir](https://patrimoinedetunisie.com.tn/en/monuments/ribat-of-monastir)
- [Carthage guide (Lonely Planet)](https://www.lonelyplanet.com/articles/carthage-tunisia-ruins-guide), [Bulla Regia](https://en.wikipedia.org/wiki/Bulla_Regia), [Roman ruins in Tunisia](https://www.lonelyplanet.com/articles/roman-ruins-tunisia)
- [El Ghriba Synagogue](https://en.wikipedia.org/wiki/El_Ghriba_Synagogue), [Djerba WHS](https://www.worldheritagesite.org/list/djerba)
- [Open Heritage 3D FAQ](https://openheritage3d.org/faq), [CyArk data use policy](https://cyark.org/data-use-policy), [Carthage amphitheatre model](https://construkted.com/?p=4074)
- [Featured pictures of Tunisia (Commons)](https://c.enwp.org/wiki/Category:Featured_pictures_of_Tunisia), [El Jem HDR photo](https://wikipedia.com/wiki/File:Anfiteatro,_El_Jem,_T%C3%BAnez,_2016-09-04,_DD_38-40_HDR.jpg)
- [Spark Gaussian splatting](https://sparkjs.dev/docs/overview/), [Spark on GitHub](https://github.com/sparkjsdev/spark), [three.js WebGPU post-processing](https://threejs.org/manual/en/webgpu-postprocessing.html)
- [Google Map Tiles API usage and billing](https://developers.google.com/maps/documentation/tile/usage-and-billing?authuser=6), [Photorealistic 3D Tiles overview](https://developers.google.com/maps/documentation/tile/3d-tiles-overview?authuser=8)
- [Viator vs GetYourGuide affiliate programs](https://track360.io/blog/viator-getyourguide-affiliate-programs-operator-teardown-2026)
- [Tunisia tops 10 million arrivals (ATTA)](https://atta.travel/resource/tunisia-tops-10-million-arrivals-eyes-africa-s-top-three.html)
