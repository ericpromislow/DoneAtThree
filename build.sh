#!/usr/bin/env bash

set -exu

VERSION=$(jq -r .version manifest.json)

ZIPFILE=done-with-three-${TARGET}-${VERSION}.zip

rm -f ../$ZIPFILE
zip -r ../$ZIPFILE LICENSE.txt README.txt PRIVACY.md content.js manifest.json
