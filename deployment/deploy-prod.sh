#!/usr/bin/env bash
source $(dirname "$0")/./deploy.sh

image="uplink-slack"
tag="released"
cluster="production"
service="uplink-slack-prod-service"

deploy ${image} ${tag} ${cluster} ${service}
