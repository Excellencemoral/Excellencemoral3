#!/usr/bin/env bash

gcloud datastore indexes create test/screenshot/shield/index.yaml

cd $(dirname "$0")

if [[ "$1" == '--local' ]]; then
  functions stop
  functions start
  functions deploy screenshot-shield-svg --entry-point=screenshotShieldSvg --trigger-http
  functions deploy screenshot-shield-url --entry-point=screenshotShieldUrl --trigger-http
else
  gcloud functions deploy screenshot-shield-svg --entry-point=screenshotShieldSvg --runtime nodejs8 --trigger-http
  gcloud functions deploy screenshot-shield-url --entry-point=screenshotShieldUrl --runtime nodejs8 --trigger-http
fi
