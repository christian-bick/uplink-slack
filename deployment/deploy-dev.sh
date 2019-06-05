#!/usr/bin/env bash
source $(dirname "$0")/./deploy.sh

image="open-convo-slack"
tag="dev"
cluster="dev"

deploy ${image} ${tag} ${cluster}