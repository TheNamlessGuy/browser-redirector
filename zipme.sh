#!/bin/bash

if [[ -f './redirector.zip' ]]; then
  \rm -i './redirector.zip'
  if [[ -f './redirector.zip' ]]; then
    echo >&2 'Cannot continue while the old .zip exists'
    exit 1
  fi
fi

echo "Zipping..."
zip -r -q './redirector.zip' res/ src/ manifest.json