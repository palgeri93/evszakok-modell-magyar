# A nappalhossz és a megvilágítás ellenőrzése

- Nyári napforduló: 69,65° É esetén 24 óra nappal, téli napfordulókor 0 óra.
- 69,65° D esetén ugyanennek a fordítottja.
- Az Egyenlítőn a geometriai nappal 12 óra egész évben.
- Napéjegyenlőségkor a nem pólusi szélességeken 12 óra nappal.
- A pólusok megfelelő évszakban 0 vagy 24 órás állapotot kapnak. A napéjegyenlőség pontos határesete külön magyarázatot kap.
- Független numerikus ellenőrzés: szélességi körönként 36 000 felszíni normális és a napirány skalárszorzatának előjele.
- A WebGL tényleges képpontjai is ellenőrizve: északi nyáron a sarkkörön túli kör nappali, északi télen ugyanaz a kör éjszakai színezést kap.
- Asztali és nagy pixelsűrűségű megjelenítés, 390 képpont széles mobilnézet: nincs vízszintes túlcsordulás.
- Évszakgombok, szélességválasztók, lejátszás és szünet, forgatás, jelölések, súgó és alaphelyzet: kipróbálva, JavaScript-hiba nélkül.

A geometriai modell nem tartalmaz légköri fénytörést és napkorongméret-korrekciót. A földrajzi hosszúság szerinti forgás szemléltető, nem valós idejű UTC-térkép. Az eredeti SWF referenciaként megmaradt, a főoldal már az új modellt használja.
