FROM node:10-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .
COPY src/ src/

RUN npm install

ENTRYPOINT exec npm run start