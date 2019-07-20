export LOG_LEVEL=debug
export REDIS_MOCK=true
export PORT=3002

docker-compose up &
./node_modules/wait-on/bin/wait-on http://localhost:3000
./node_modules/.bin/cypress run
