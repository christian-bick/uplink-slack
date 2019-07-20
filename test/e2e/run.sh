trap "exit" INT TERM ERR
trap "kill 0" EXIT

export LOG_LEVEL=debug
export REDIS_MOCK=true
export PORT=3002

npm run dev &
./node_modules/wait-on/bin/wait-on http://localhost:3002
./node_modules/.bin/cypress run

wait
