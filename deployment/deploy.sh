#!/bin/bash

function deploy {
    image=$1
    tag=$2
    repo="838547702205.dkr.ecr.eu-central-1.amazonaws.com/"${image}
    cluster="dev"

    echo "Building ${image}:${tag}"

    docker build -t ${image}:${tag} .

    echo "Pushing ${image}:${tag} to ${repo}"

    aws ecr get-login --no-include-email --registry-ids 838547702205 --region eu-central-1 | source /dev/stdin
    docker tag ${image}:${tag} ${repo}:${tag}
    docker push ${repo}:${tag}

    echo "Deploying ${image}:${tag}"

    aws ecs update-service --cluster dev --service open-convo-slack-dev-ec2 --force-new-deployment
}