# Évszakok és nappalhossz

Magyar, böngészőben futó oktatási modell a Föld megvilágításáról és a nappalok éves változásáról.

Élő oldal: https://palgeri93.github.io/evszakok-modell-magyar/

## Javított megvilágítás és nappalhossz

A korábbi `saisons.swf` csak Párizs nappalhosszát jelenítette meg a `12 - 4*cos(...)` közelítéssel, és alacsony részletességű gömböt rajzolt. A főoldal ezért önálló HTML/JavaScript/WebGL 2 modellt kapott.

- Folytonos, analitikus gömb, durva háromszögháló nélkül.
- A világos félgömböt a felszíni normális és a Nap irányvektorának skalárszorzata határozza meg.
- A nappalhossz ugyanezen napirány alapján, a teljes szélességi kör horizontviszonyaiból számolódik.
- A szélesség −90° és +90° között állítható. A sarki nappal, sarki éjszaka és a pólusok határesete külön kezelést kapott.
- A Nap látszó ekliptikai hosszúsága Julianus-napból, a NOAA/Meeus közelítő képleteivel számolódik. A modell rögzített 23,44° tengelyferdeséget és a 2026-os év dátumait használja.
- A geometriai horizont 0° napmagasságnál van. Légköri fénytörés és a napkorong sugara nincs benne a nappalhosszban; ez a teljes gömb megvilágításával következetes, szemléltető definíció.

A földrajzi hosszúság szerinti napi forgás animációja szemléltető; a gömb nem egy kijelzett UTC időpillanat térképe. A Nap felőli irány követhető, a szélességi kör megvilágítása és a számított nappalhossz mindig összhangban van.

## Kezelés

Évszakválasztás, dátumcsúszka és dátummező, lejátszás/szünet, sebességválasztás, forgatható és nagyítható földgömb, északi/déli sarkvidéki nézet, fokhálózat és sarkkörök, éves nappalhossz-grafikon. Az évszaknevek az északi félgömbre vonatkoznak; a déli félgömb évszakai fordítottak.

Az eredeti magyarított Flash-változat referenciaként a `legacy.html`, `magyar.swf` és `ruffle/` fájlokban megmaradt. A főoldal a javított modellt tölti be.

## Helyi indítás

`inditas.cmd` (Python 3), vagy a mappában `python -m http.server 8000`, majd http://localhost:8000/ . A modell a helyi térképadatokat HTTP-n tölti be. A földgömb megjelenítéséhez WebGL 2 szükséges.

## Ellenőrzés

`node tests/solar.test.mjs`

Napfordulók, napéjegyenlőségek, mindkét félgömb, pólusok, sarki nappal és éjszaka, egész éves szélsőértékek. A nappalhossz a felszíni normálisokból függetlenül számolt numerikus integrállal is összehasonlítva. Böngészős próba a WebGL valódi képpontjain, továbbá lejátszás, forgatás és mobilos elrendezés ellenőrzése.

## Források

- [NOAA számítási háttér](https://gml.noaa.gov/grad/solcalc/calcdetails.html) és [napmagasság](https://gml.noaa.gov/grad/solcalc/solareqns.PDF).
- [Natural Earth](https://www.naturalearthdata.com/): közkincs földfelszín-poligonok, `ne_110m_land`, a [projekt adattárából](https://github.com/nvkelso/natural-earth-vector). A térkép 4096×2048 textúrává alakul, a megvilágítás képpontonként számolódik.
- Az eredeti SWF szerzői jogai és a Ruffle licencei változatlanok. Ez nem az eredeti alkotók hivatalos magyar kiadása.
