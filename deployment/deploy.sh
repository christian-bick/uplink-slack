#!/bin/bash

function deploy {
    image=$1
    tag=$2
    cluster=$3
    service=$4
    repo="838547702205.dkr.ecr.eu-central-1.amazonaws.com/"${image}

    echo "Building ${image}:${tag}"

    docker build --build-arg version=$(git rev-parse --short HEAD) --no-cache -t ${image}:${tag} .

    echo "Pushing ${image}:${tag} to ${repo}"

    aws ecr get-login --no-include-email --registry-ids 838547702205 --region eu-central-1 | source /dev/stdin
    docker tag ${image}:${tag} ${repo}:${tag}
    docker push ${repo}:${tag}

    echo "Deploying ${image}:${tag}"

    aws ecs update-service --cluster ${cluster} --service ${service} --force-new-deployment
}
