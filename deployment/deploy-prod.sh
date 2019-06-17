#!/usr/bin/env bash
source $(dirname "$0")/./deploy.sh

image="uplink-slack"
tag="released"
cluster="uplink-prod"
service="uplink-prod-service"

deploy ${image} ${tag} ${cluster} ${service}
