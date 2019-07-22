# Uplink for Slack

Enables messaging between users of different Slack workspaces.

## Prerequisites

```
Node 10
Docker
Docker Compose
AWS CLI
```

## Workspace

If you don't have one already, create your own private Slack workspace for local development purposes only.

## Local Tunnel

Set up a tunnel to your local machine with [ngrok](https://ngrok.com).

Make sure that the tunnel endpoint uses a *fixed* subdomain.

## Slack Application

Create a fresh Slack application on your development workspace at [api.slack.com](https://api.slack.com).

Continue to configure the application as stated below.

### Bot Users

Create a bot user and name it as you like (e.g. uplink-dev).

### Interactive components 

Interactivity (Request URL):

```
https://[your-tunnel-endpoint]/slack/events
```

Message Menus (Options Load URL):

```
https://[your-tunnel-endpoint]/slack/events
```

### Event Subscriptions

Enable Events (Request URL):

```
https://[your-tunnel-endpoint]/slack/events
```

Subscribe to Workspace Events:

```
app_home_opened
```

Subscribe to Bot Events:

```
group_left
member_joined_channel
message.groups
message.im
```

### OAuth & Permissions 

You might need to install the app on your workspace before having access to these options.

Redirect URLs:

```
https://[your-tunnel-endpoint]/oauth/
```

Scopes:

```
groups:read
groups:write
bot
users.profile:read
```

### Install App

Install the app on your development workspace if you haven't done that yet. 
This will grant you all necessary tokens and can be repeated as often as necessary.

## Environment variables

Create a `.env` file in the project root with the following contents:

```
SLACK_CLIENT_ID=[your-apps-client-id]
SLACK_CLIENT_SECRET=[your-apps-client-secret]
SLACK_SIGNING_SECRET=[your-apps-signing-secret]

HOST=[your-tunnel-endpoint]
NGROK_AUTH=[your-ngrok-auth-key]

REDIS_HOST=redis
HASH_SALT=no-hash
LOG_LEVEL=debug
```

You can find the Slack credentials under `Basic Information` in your App's Setting on Slack.

## Running a local server

Is as simple as:

```
docker-compose up
```

This will:

- set up a tunnel with ngrok
- spawn a redis instance with persistence
- spawn a node server

Source files are linked with the node server. When source files are changed, the server is automatically restarted.

## Running Tests

### Unit

To run all unit tests:

```
npm run ut
```

To run unit tests in watch mode:

```
npm run watch
```

The log level for unit-tests is set to "fatal" to not pollute test result outputs with undesired info and error logs.

File watchers will trigger a rerun of all tests in watch mode. Watch mode uses a mocha reporter which reports failed 
tests only.

### End-to-End

To run all e2e tests:

```
npm run e2e
```

End-to-end tests make use of the following test workspace:

- Domain: `uplink-slack-e2e-one.slack.com`
- User: `christian.bick@uplink-chat.com`
- Password: ask

## Deployment

### Prerequisites

Retrieve an AWS key from your favorite admin and follow the AWS documentation to set up AWS CLI.

### Deploy

To deploy to production:

```
./deployment/deploy-prod.sh
```
