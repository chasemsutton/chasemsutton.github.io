# chasemsutton.github.io
Personal GitHub Pages site (Clash Reference at /clash/)

Info-tab descriptions and practical tips are authored in `scripts/info-copy.txt`. Run `python scripts/build-info.py` to rebuild `clash/data/info.json` with wiki source references and merge visuals. This is a maintenance script; the static site still needs no build step. Info copy is loaded only when a visitor opens an Info tab.

Hero Equipment is grouped by its `hero` field. A filtered collection can be linked directly with `#/c/equip?hero=Archer%20Queen`; equipment detail links preserve the same hash query so Back returns to that collection. Individual Home Village heroes link to their own equipment collection.

Regular and Super Troop pages link in both directions using the verified `baseTroop`, `baseLevelRequired`, and `unlockTH` fields in `super.json`. Regular troop details reuse the cached Super Troops dataset to avoid maintaining a second relationship roster.

Images use the original wiki CDN URLs directly. Derived thumbnail requests were removed after a loading regression; the CDN still chooses the response format. Gallery captions use explicit level mappings where available, with readable labels for non-level images.
