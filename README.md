# Uplink for Slack

Enables messaging between users of different Slack workspaces.

## Prerequisites

```
Node 10
Docker
Docker Compose
AWS CLI
```

## Environment

### Workspace

If you don't have one already, create your own private Slack workspace for local development purposes only.

### Local Tunnel

Set up a tunnel to your local machine with [ngrok](https://ngrok.com).

Make sure that the tunnel endpoint uses a *fixed* subdomain.

### Slack Application

Create a fresh Slack application on your development workspace at [api.slack.com](https://api.slack.com).

#### Set the following options in your Slack app

##### Bot Users

Create a bot user and name it as you like (e.g. uplink-dev).

##### Interactive components 

###### Interactivity (Request URL)

```
https://[your-tunnel-endpoint]/slack/events
```

###### Message Menus (Options Load URL)

```
https://[your-tunnel-endpoint]/slack/events
```

##### Event Subscriptions

###### Enable Events (Request URL)

```
https://[your-tunnel-endpoint]/slack/events
```

###### Subscribe to Workspace Events

```
app_home_opened
```

###### Subscribe to Bot Events

```
group_left
member_joined_channel
message.groups
message.im
```

#### OAuth & Permissions 

You might need to install the app on your workspace before having access to these options.

##### Redirect URLs

```
https://[your-tunnel-endpoint]/oauth/
```

##### Scopes

```
groups:read
groups:write
bot
users.profile:read
```

#### Install App

Install the app on your development workspace if you haven't done that yet. 
This will grant you all necessary tokens and can be repeated as often as necessary.

### Environment variables

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

```
npm run ut
```

And in watch mode:

```
npm run watch
```

### End-to-End

```
npm run e2e
```

#### Test Resources

End-to-end tests make use of the following test workspaces:

- Domain: `uplink-chat-1`
- User: `christian.bick@uplink-chat.com`

## Deployment

### Prerequisites

Retrieve an AWS key from your favorite admin and follow the AWS documentation to set up AWS CLI.

### Deploy

```
./deployment/deploy-prod.sh
```
