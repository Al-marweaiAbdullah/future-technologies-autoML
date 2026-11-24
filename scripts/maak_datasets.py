"""
Maakt twee Teachable Machine datasets uit de Roboflow UNO datasets.

  data/kleur/   Rood, Blauw, Groen, Geel, Wild      (uit "Uno Card Detector", hele kaarten)
  data/waarde/  0..9, Actie, Wild, Geen kaart      (uit "Uno Cards", hoeksymbolen)

Gebruik (vanuit de repo map):
  python3 scripts/maak_datasets.py --kleur "../Uno Card Detector.v4i.coco" --waarde "../Uno Cards.v2-raw.coco"

Opmerkingen over de brondata (zie README):
  * In "Uno Cards" kloppen de klassenamen in de COCO json niet: de id's zijn
    alfabetisch toegekend ('0','1','10','11',...). Daarom gebruiken we hieronder
    een eigen mapping, gecontroleerd door crops te bekijken.
  * "Uno Card Detector" bevat grijswaardenkopieën (augmentatie). Die zijn
    waardeloos voor een kleurmodel en worden eruit gefilterd.
"""
import argparse
import json
import os
import random
from pathlib import Path

from PIL import Image, ImageStat

SIZE = 224          # Teachable Machine werkt intern met 224x224
PER_KLASSE = 150
SEED = 42
SPLITS = ["train", "valid", "test"]

# ---------- Kleur: categorie naam -> klasse ----------
def kleur_klasse(naam: str):
    n = naam.lower()
    if n.startswith("blue"):
        return "Blauw"
    if n.startswith("green"):
        return "Groen"
    if n.startswith("red"):
        return "Rood"
    if n.startswith("yellow"):
        return "Geel"
    if n in ("wild_card", "draw_four"):
        return "Wild"
    return None  # 'uno-cards' (superklasse) en 'uno_card' (achterkant) laten we weg

# ---------- Waarde: categorie id -> klasse (gecontroleerd met crops) ----------
WAARDE = {
    1: "0", 2: "1", 8: "2", 9: "3", 10: "4", 11: "5", 12: "6", 13: "7", 14: "8", 15: "9",
    3: "Wild",   # +4
    4: "Actie",  # +2
    5: "Actie",  # keer om
    6: "Actie",  # sla over
    7: "Wild",   # wild
}


def laad(root: Path):
    for split in SPLITS:
        f = root / split / "_annotations.coco.json"
        if not f.exists():
            continue
        d = json.load(open(f))
        imgs = {i["id"]: i for i in d["images"]}
        cats = {c["id"]: c["name"] for c in d["categories"]}
        for a in d["annotations"]:
            yield root / split / imgs[a["image_id"]]["file_name"], a, cats[a["category_id"]], imgs[a["image_id"]]


def is_grijs(img: Image.Image) -> bool:
    return ImageStat.Stat(img.convert("HSV")).mean[1] < 15


def vierkante_crop(img, bbox, pad=0.08):
    x, y, w, h = bbox
    s = max(w, h) * (1 + 2 * pad)
    cx, cy = x + w / 2, y + h / 2
    return img.crop((cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2)).resize((SIZE, SIZE), Image.LANCZOS)


def raakt_rand(bbox, iw, ih, marge=2):
    x, y, w, h = bbox
    return x < marge or y < marge or x + w > iw - marge or y + h > ih - marge


def bewaar(buckets, uit: Path):
    rng = random.Random(SEED)
    for klasse, items in sorted(buckets.items()):
        rng.shuffle(items)
        keuze = items[:PER_KLASSE]
        map_ = uit / klasse
        map_.mkdir(parents=True, exist_ok=True)
        for i, (pad, bbox) in enumerate(keuze):
            img = Image.open(pad).convert("RGB")
            vierkante_crop(img, bbox).save(map_ / f"{klasse}_{i:03d}.jpg", quality=92)
        print(f"  {klasse:10s} {len(keuze):4d} gekozen uit {len(items)}")


def maak_kleur(root: Path, uit: Path):
    buckets, grijs_cache, grijs = {}, {}, 0
    for pad, a, naam, info in laad(root):
        k = kleur_klasse(naam)
        if not k:
            continue
        w, h = a["bbox"][2], a["bbox"][3]
        if min(w, h) < 60 or raakt_rand(a["bbox"], info["width"], info["height"]):
            continue
        if pad not in grijs_cache:
            grijs_cache[pad] = is_grijs(Image.open(pad).convert("RGB"))
        if grijs_cache[pad]:
            grijs += 1
            continue
        buckets.setdefault(k, []).append((pad, a["bbox"]))
    print(f"Kleur ({grijs} kaarten op grijswaardenfoto's overgeslagen):")
    bewaar(buckets, uit)


def maak_waarde(root: Path, uit: Path):
    buckets, achtergrond = {}, []
    per_beeld = {}
    for pad, a, naam, info in laad(root):
        per_beeld.setdefault(pad, (info, []))[1].append(a["bbox"])
        k = WAARDE.get(a["category_id"])
        if not k or min(a["bbox"][2], a["bbox"][3]) < 20:
            continue
        buckets.setdefault(k, []).append((pad, a["bbox"]))

    # "Geen kaart": stukjes achtergrond die geen kaart raken
    rng = random.Random(SEED)
    beelden = list(per_beeld.items())
    rng.shuffle(beelden)
    for pad, (info, boxes) in beelden:
        if len(achtergrond) >= PER_KLASSE * 3:
            break
        s = 80
        for _ in range(10):
            x, y = rng.randint(0, info["width"] - s), rng.randint(0, info["height"] - s)
            # de kaders zitten enkel rond het hoeksymbool, de kaart zelf is veel groter:
            # daarom een ruime zone (6x het symbool) rond elk kader vermijden
            vrij = all(
                x + s < bx - bw * 6 or x > bx + bw * 7 or y + s < by - bh * 6 or y > by + bh * 7
                for bx, by, bw, bh in boxes
            )
            if vrij:
                achtergrond.append((pad, [x, y, s, s]))
                break
    buckets["Geen kaart"] = achtergrond
    print("Waarde:")
    bewaar(buckets, uit)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--kleur", required=True, help="map van Uno Card Detector (COCO)")
    p.add_argument("--waarde", required=True, help="map van Uno Cards (COCO)")
    p.add_argument("--uit", default="data")
    a = p.parse_args()
    maak_kleur(Path(a.kleur), Path(a.uit) / "kleur")
    maak_waarde(Path(a.waarde), Path(a.uit) / "waarde")
