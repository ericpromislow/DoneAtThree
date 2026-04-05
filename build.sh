#!/usr/bin/env bash

set -exu

VERSION=$(jq -r .version manifest.json)

rm -f connection-completer-${VERSION}.zip
zip -r connection-completer-${VERSION}.zip LICENSE.txt README.txt PRIVACY.md content.js manifest.json
