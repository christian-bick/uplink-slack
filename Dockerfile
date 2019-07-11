FROM node:10-alpine

ARG version=0
ENV VERSION=$version

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .
COPY public/ public/
COPY src/ src/

RUN npm install

ENTRYPOINT exec npm run start
