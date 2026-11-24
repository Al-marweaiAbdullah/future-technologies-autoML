"""
Waardemodel v2: hele kaarten uit de dataset "UnoCards" (Hof University, CC BY 4.0)
https://universe.roboflow.com/hof-university-of-applied-sciences-5x05r/unocards-z8f0f

  data/waarde_v2/  0..9, Actie, Wild        (uit de dataset)
  data/tm_upload/waarde_v2/                 (+ Geen kaart uit data/tm_upload/waarde)

Gebruik (vanuit de repo map):
  python3 scripts/maak_waarde_v2.py --bron "../UnoCards.v3i.coco"

Opmerkingen over de brondata (zie README):
  * Eén kaart per foto, kader rond de hele kaart. Labels visueel gecontroleerd.
  * Roboflow maakte 3 versies van elke foto (spiegelen, 90° draaien, scheef draaien).
    Bij het draaien ontstaan zwarte randen: crops met veel zwart worden overgeslagen.
"""
import argparse
import json
import random
import shutil
from pathlib import Path

from PIL import Image

SIZE = 224
PER_KLASSE = 150
SEED = 42

KLASSE = {
    "numbered-0": "0", "numbered-1": "1", "numbered-2": "2", "numbered-3": "3", "numbered-4": "4",
    "numbered-5": "5", "numbered-6": "6", "numbered-7": "7", "numbered-8": "8", "numbered-9": "9",
    "draw 2 cards": "Actie", "reverse card": "Actie", "skip card": "Actie",
    "draw 4 cards": "Wild", "wild color card": "Wild",
}


def vierkant(img, bbox, pad=0.04):
    """Vierkant rond de kaart. Valt het vierkant buiten de foto, dan schuiven we het
    terug naar binnen (anders vult PIL de rand met zwart)."""
    x, y, w, h = bbox
    s = min(max(w, h) * (1 + 2 * pad), img.width, img.height)
    cx = min(max(x + w / 2, s / 2), img.width - s / 2)
    cy = min(max(y + h / 2, s / 2), img.height - s / 2)
    return img.crop((cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2)).resize((SIZE, SIZE), Image.LANCZOS)


def zwart_aandeel(img):
    # pure zwarte pixels komen van het draaien door Roboflow (de kaart zelf is nooit 100% zwart)
    px = list(img.convert("L").getdata())
    return sum(1 for p in px if p < 6) / len(px)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--bron", required=True)
    p.add_argument("--uit", default="data")
    a = p.parse_args()
    bron, uit = Path(a.bron), Path(a.uit)

    items = {}
    for split in ["train", "valid", "test"]:
        f = bron / split / "_annotations.coco.json"
        if not f.exists():
            continue
        d = json.load(open(f))
        imgs = {i["id"]: i for i in d["images"]}
        cats = {c["id"]: c["name"] for c in d["categories"]}
        for an in d["annotations"]:
            k = KLASSE.get(cats[an["category_id"]])
            if k:
                items.setdefault(k, []).append((bron / split / imgs[an["image_id"]]["file_name"], an["bbox"]))

    rng = random.Random(SEED)
    print("Waarde v2:")
    for k, lijst in sorted(items.items()):
        rng.shuffle(lijst)
        doel = uit / "waarde_v2" / k
        doel.mkdir(parents=True, exist_ok=True)
        n = zwart = 0
        for pad, bbox in lijst:
            if n >= PER_KLASSE:
                break
            crop = vierkant(Image.open(pad).convert("RGB"), bbox)
            if zwart_aandeel(crop) > 0.12:
                zwart += 1
                continue
            crop.save(doel / f"{k}_{n:03d}.jpg", quality=92)
            n += 1
        print(f"  {k:6s} {n:4d} gekozen uit {len(lijst)} ({zwart} met zwarte randen overgeslagen)")

    # uploadmap voor Teachable Machine
    tm = uit / "tm_upload" / "waarde_v2"
    for k in list(items) + ["Geen kaart"]:
        src = uit / "waarde_v2" / k if k != "Geen kaart" else uit / "tm_upload" / "waarde" / "Geen kaart"
        (tm / k).mkdir(parents=True, exist_ok=True)
        for f in src.glob("*.jpg"):
            shutil.copy(f, tm / k / f.name)
        print(f"  upload {k:10s} {len(list((tm / k).glob('*.jpg')))}")


if __name__ == "__main__":
    main()
