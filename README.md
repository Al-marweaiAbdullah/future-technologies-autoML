# UNO Kleurhulp

Campus Quest, **track D (eigen idee)**: een webapp die kleurenblinde spelers helpt bij UNO.

* **Kleurhulp**: richt de camera op een kaart. De app toont de kleur met een vorm (▲ rood, ● blauw, ■ groen, ★ geel) en zegt ze luidop.
* **Puntenteller**: scan de kaarten van je tegenstanders, de app telt de UNO punten en bewaart ze in een klassement.

Live: _(Vercel link)_

## Starten

```bash
npm install
npm run dev        # op je laptop: http://localhost:5173
npm run gsm        # op je gsm via wifi: https://<ip van je laptop>:5173 (certificaatwaarschuwing accepteren)
npm run build      # productie build in dist/
```

Scores gaan naar Supabase als je `.env` invult (zie `.env.example` en `supabase.sql`). Anders worden ze lokaal in de browser bewaard.

## Modellen

Twee Teachable Machine modellen (Image Project, Standard image model), geëxporteerd naar TensorFlow.js:

| Model | Klassen | Map |
|---|---|---|
| Kleur | Rood, Blauw, Groen, Geel, Wild, Geen kaart | `public/models/kleur/` |
| Waarde | 0 tot 9, Actie, Wild, Geen kaart | `public/models/waarde/` |

Een kaart telt pas als het model **minstens 1 seconde boven 90% zekerheid** blijft. In de puntenteller moet er tussen twee kaarten eerst "Geen kaart" verschijnen, zodat niets dubbel geteld wordt.

## Dataset

**Kleurmodel**
* Online: [Uno Card Detector](https://universe.roboflow.com/visual-interfaces/uno-card-detector) (CC BY 4.0). Kaarten uitgeknipt met `scripts/maak_datasets.py`, grijswaardenfoto's automatisch verwijderd, daarna elke foto manueel nagekeken. Afgekeurde foto's staan in `data/_afgekeurd/`.
* Eigen foto's: genomen met mijn gsm, 40 tot 66 per klasse, op verschillende momenten en met verschillend licht.

**Waardemodel**
* Online: [Uno Cards](https://universe.roboflow.com/joseph-nelson/uno-cards) door Adam Crawshaw (MIT). Deze dataset bevat enkel het symbool in de hoek van de kaart. De klassenamen in de COCO export klopten niet (alfabetisch genummerd: label "10" is eigenlijk een 5); de juiste koppeling is gecontroleerd en staat in het script.
* Daarom zoomt de puntenteller in op een klein kader in het midden van het beeld.

## Privacy

Het herkennen gebeurt volledig in de browser (TensorFlow.js). Camerabeelden worden nooit opgeslagen of verstuurd. Naar de backend gaan enkel: naam, punten en de herkende labels.

## Fouttabel

| Situatie | Wat ging fout | Wat ik aanpaste |
|---|---|---|
| Waardemodel op normale afstand | Toont altijd "Geen kaart" | Kader in de app dat inzoomt op het hoeksymbool |
| Kader (30%) groter dan het hoeksymbool | Nog steeds "Geen kaart": het symbool vult het beeld niet, zoals in de trainingsdata | Kader verkleind naar 18%, per frame 3 zoomniveaus proberen, voorbeeld "Model ziet" op het scherm |
| | | |

## Reflectie

_(max. 200 woorden: hoe maak je de trigger moeilijker te foppen, welke bias zit in de dataset)_

## AI verantwoording

Zie `ai_log.md`.
