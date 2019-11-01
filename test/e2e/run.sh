#!/usr/bin/env bash

docker-compose -f docker-compose-beta.yml up &
./node_modules/wait-on/bin/wait-on https://uplink-slack-beta.eu.ngrok.io
./node_modules/.bin/cypress run
