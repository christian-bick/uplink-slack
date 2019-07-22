#!/usr/bin/env bash

docker-compose -f docker-compose-beta.yml up &
./node_modules/wait-on/bin/wait-on http://localhost:3001
./node_modules/.bin/cypress open
