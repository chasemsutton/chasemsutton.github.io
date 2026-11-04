# chasemsutton.github.io
Personal GitHub Pages site (Clash Reference at /clash/)

Info-tab descriptions and practical tips are authored in `scripts/info-copy.txt`. Run `python scripts/build-info.py` to rebuild `clash/data/info.json` with wiki source references and merge visuals. This is a maintenance script; the static site still needs no build step. Info copy is loaded only when a visitor opens an Info tab.

Hero Equipment is grouped by its `hero` field. A filtered collection can be linked directly with `#/c/equip?hero=Archer%20Queen`; equipment detail links preserve the same hash query so Back returns to that collection. Individual Home Village heroes link to their own equipment collection.

Regular and Super Troop pages link in both directions using the verified `baseTroop`, `baseLevelRequired`, and `unlockTH` fields in `super.json`. Regular troop details reuse the cached Super Troops dataset to avoid maintaining a second relationship roster.

Image helpers keep the original wiki URL as a fallback and request CDN-sized variants through `srcset` for 1x?4x displays. The source filename can end in PNG even when the CDN response is WebP; changing a filename extension is not a conversion. Gallery captions use explicit level mappings where available, with readable icon/artwork labels for non-level images.
