# Uplink for Slack

Uplink is a Slack App for direct messaging between Slack workspaces. Uplink users can discover each other via email address on any Slack workspace to start messaging right away without any administrative effort.

## Prerequisites

```
Node 10
Docker
Docker Compose
AWS CLI
```

## Workspace

In case you don't use a dedicated Slack workspace for local development already, first thing is to set up a private workspace for testing and debugging.

## Local Tunnel

For Slack events to be forwarded to your local machine, set up a tunnel with [ngrok](https://ngrok.com).

Important: Make sure that the tunnel endpoint uses a *fixed* subdomain.

## Slack Application

Create a fresh Slack application on your development workspace at [api.slack.com](https://api.slack.com) and name it something like *Ulink Dev*.

Then continue to configure the application using the instructions below.

### Bot Users

Create a bot user and name it give it a name (e.g. uplink-dev).

### Interactive components

Configure the endpoints for interactive components:

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

Subscribe to the following *Workspace Events*:

```
app_home_opened
```

Subscribe to the follwing *Bot Events*:

```
group_left
member_joined_channel
message.groups
message.im
```

### OAuth & Permissions 

Note: Before continuing, you might need to install the app on your development workspace before gaining access to the oauth configuration options.

Configure *Redirect URLs*:

```
https://[your-tunnel-endpoint]/oauth/
```

Add the following *Permission Scopes*:

```
groups:read
groups:write
bot
users.profile:read
```

### Install App

Install the app on your development workspace if you haven't done yet. 
This will grant test tokens (bot token & user token) and can be repeated as often as necessary.

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

You can find the Slack App credentials under `Basic Information` in your App's Setting on Slack.

The .env file is in .gitignore for a good reason. They are your private credentials for local testing purposes and are not supposed to be checked in at any time. On staging and production environments, secrets and credentials are supposed to be passed into the Docker container using a credential manager.

## Running a local server

Is as simple as:

```
npm run dev
```

This runs docker-compose which will:

- set up a tunnel with ngrok
- spawn a redis instance with persistence
- spawn a node server

The source files within the Docker container are automatically linked with the project source files on the host machine. Any local source code changes are immediately synchronized with the container and automatically trigger a server restart (using *nodemon*. Server restarts are executed within a fraction of a second, allowing us to see and test changes without waiting time and manual action.

## Running Tests

### Unit Tests

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

### End-to-End Tests

#### Prerequisites

```
Chrome / Chromium / Electron
Full Test Setup (follow the steps bellow)
```

**Step 1: Create an independent test app on api.slack.com**
  
To run end-to-end tests in isolation, create another separate test app with the same settings as your local testing 
app including the setup of an independent ngrok endpoint to use with the test app.

Also, activate distribution for the test app so it can be installed on multiple workspaces. With the end-to-end tests, we want to test a realistic scenario which naturally involves two separate Slack workspaces in our case.

Add a file called `.env-beta` to the project root and complete the placeholders equivalent to the dev setup:

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

Run `npm run beta` and browse to your configured ngrok endpoint to verify that your setup works.


**Step 2: Create two independent test teams**

Create two test teams on *slack.com* with one user each (one user will be called *current*, the other one will 
be called *contact*) 

*Important:* Use a different email address for each user.

Now, install and test the app on both teams while running `npm run beta`.

Create a test token under *Custom Integrations* on *slack.com* for each Slack team to later use them as *_ADMIN_TOKEN*. We need a dedicated admin token to prepare and clean up before and after our tests. Test tokens are different from normal app tokens in that they are issued with all scopes and that they can also be used with restricted API methods.

Finally, add a file called `cypress.env.json` to the project root and replace *all values* with your *own values* 
for your *current* and *contact* users:

```
{
  "CURRENT_TEAM_ID": "TLEHLCEPK",
  "CURRENT_TEAM_BOT_ID": "ULMLVPFAR",
  "CURRENT_TEAM_BOT_TOKEN": "***",
  "CURRENT_APP_HOME": "DLPG6FALF",
  "CURRENT_EMAIL": "***",
  "CURRENT_PASSWORD": "***",
  "CURRENT_USER_ID": "UL9G1KQMR",
  "CURRENT_ADMIN_TOKEN": "***",

  "CONTACT_TEAM_ID": "TLPDQKZ1T",
  "CONTACT_TEAM_BOT_ID": "ULC1BBHHQ",
  "CONTACT_TEAM_BOT_TOKEN": "***",
  "CONTACT_APP_HOME": "DLRHQ1FGW",
  "CONTACT_EMAIL": "***",
  "CONTACT_PASSWORD": "***",
  "CONTACT_USER_ID": "ULNUW7CE8",
  "CONTACT_ADMIN_TOKEN": "***"
}

```

*Hint:* All necessary data to fill the above fields is logged to console during install in development mode (ids are obfuscated through hashing in production)

#### Run E2E Tests

To run all e2e tests:

```
npm run e2e:run
```

To run e2e tests with browser and dashboard: 

```
npm run e2e:watch
```

*Note:* E2E Tests run against the actual Slack UI and may break when Slack releases major changes on their UI components. 

Both, the redis database and Slack workspaces are cleaned up before running all tests. 

All required database state is seeded before a test run. Especially when making major changes to installs and 
user/account datastructure, the seeding might require adoption.  

## Deployment

### Prerequisites

Retrieve an AWS key from your favorite AWS admin and follow the AWS documentation to set up AWS CLI and AWS ECS.

### Deploy

To deploy to production:

```
./deployment/deploy-prod.sh
```
