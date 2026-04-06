#!/usr/bin/env bash

set -exu

VERSION=$(jq -r .version manifest.json)

rm -f done-with-three-${VERSION}.zip
zip -r done-with-three-${VERSION}.zip LICENSE.txt README.txt PRIVACY.md content.js manifest.json
