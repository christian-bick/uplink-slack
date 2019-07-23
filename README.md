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

ENCRYPTION_SECRET=[any-32-character-string]
HASH_SALT=no-hash

VERSION=latest
LOG_LEVEL=debug
```

You can find the Slack credentials under `Basic Information` in your App's Setting on Slack.

## Running a local server

Is as simple as:

```
npm run dev
```

This will run docker-compose and:

- set up a tunnel with ngrok
- spawn a redis instance with persistence
- spawn a node server

Source files are linked with the node server. When source files are changed, the server is automatically restarted.

## Running Tests

### Unit

To run all unit tests:

```
npm run ut:run
```

To run unit tests in watch mode:

```
npm run ut:watch
```

The log level for unit-tests is set to "fatal" to not pollute test result outputs with undesired info and error logs.

File watchers will trigger a rerun of all tests in watch mode. Watch mode uses a mocha reporter which reports failed 
tests only.

### End-to-End

#### Prerequisites

```
Chrome / Chromium / Electron
Full Test Setup (follow the steps bellow)
```

**Step 1: Create an independent test app on api.slack.com**
  
To run end2end tests create another separate test app with the same settings as your local testing 
app including the setup of an independent ngrok endpoint for this app.

Add a file called `.env-beta` to the project root, equivalent to the dev setup.

```
SLACK_CLIENT_ID=[your-apps-client-id]
SLACK_CLIENT_SECRET=[your-apps-client-secret]
SLACK_SIGNING_SECRET=[your-apps-signing-secret]

HOST=[your-tunnel-endpoint]
NGROK_AUTH=[your-ngrok-auth-key]

REDIS_HOST=redis

ENCRYPTION_SECRET=[any-32-character-string]
HASH_SALT=no-hash

VERSION=latest
LOG_LEVEL=debug

DM_IN_PRIVATE_CHANNELS=false
```

**Step 2: Create two independent test teams**

Create two test teams on slack.com and create a cypress.env.json. Copy paste the content from below and
replace *all fields* with *your own data*. 

Create a test-tokens in *Custome Integrations* for each Slack team and use them as *_ADMIN_TOKEN. Test tokens have 
all scopes and therefore can for example hard-delete channels which we do to always have a clean test-setup. 


```
{
  "CURRENT_TEAM_ID": "TLEHLCEPK",
  "CURRENT_TEAM_BOT_ID": "ULMLVPFAR",
  "CURRENT_TEAM_BOT_TOKEN": "***",
  "CURRENT_APP_HOME": "DLPG6FALF",
  "CURRENT_EMAIL": "christian.bick@uplink-chat.com",
  "CURRENT_PASSWORD": "***",
  "CURRENT_USER_ID": "UL9G1KQMR",
  "CURRENT_ADMIN_TOKEN": "***",

  "CONTACT_TEAM_ID": "TLPDQKZ1T",
  "CONTACT_TEAM_BOT_ID": "ULC1BBHHQ",
  "CONTACT_TEAM_BOT_TOKEN": "***",
  "CONTACT_APP_HOME": "DLRHQ1FGW",
  "CONTACT_EMAIL": "christian.bick@bitsuppliers.com",
  "CONTACT_PASSWORD": "***",
  "CONTACT_USER_ID": "ULNUW7CE8",
  "CONTACT_ADMIN_TOKEN": "***"
}

```

#### Run E2E Tests

To run all e2e tests:

```
npm run e2e:run
```

To run e2e tests with browser and dashboard: 

```
npm run e2e:watch
```

E2E Tests are run against the actual Slack UI and may break when Slack releases major changes on their UI components. 

Both, the redis database and Slack workspaces are cleaned up before running all tests. 

All required database state is seeded before a test runs. Especially when making major changes to installs and 
user/account datastructure, the seeding might require adoption.  

## Deployment

### Prerequisites

Retrieve an AWS key from your favorite admin and follow the AWS documentation to set up AWS CLI.

### Deploy

To deploy to production:

```
./deployment/deploy-prod.sh
```
