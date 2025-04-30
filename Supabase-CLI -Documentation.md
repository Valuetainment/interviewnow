# Supabase CLI Documentation



## Overview

Develop locally while running the Supabase stack on your machine.

### Quickstart

1.  Install the Supabase CLI:
    ```bash
    npm install supabase --save-dev
    # or yarn add supabase --dev
    # or pnpm add -D supabase
    # or brew install supabase/tap/supabase
    ```
2.  In your repo, initialize the Supabase project:
    ```bash
    npx supabase init
    ```
3.  Start the Supabase stack:
    ```bash
    npx supabase start
    ```
4.  View your local Supabase instance at http://localhost:54323.

### Local development

Local development with Supabase allows you to work on your projects in a self-contained environment on your local machine. Working locally has several advantages:

1.  Faster development: You can make changes and see results instantly without waiting for remote deployments.
2.  Offline work: You can continue development even without an internet connection.
3.  Cost-effective: Local development is free and doesn't consume your project's quota.
4.  Enhanced privacy: Sensitive data remains on your local machine during development.
5.  Easy testing: You can experiment with different configurations and features without affecting your production environment.

To get started with local development, you'll need to install the Supabase CLI and Docker. The Supabase CLI allows you to start and manage your local Supabase stack, while Docker is used to run the necessary services.

Once set up, you can initialize a new Supabase project, start the local stack, and begin developing your application using local Supabase services. This includes access to a local Postgres database, Auth, Storage, and other Supabase features.

### CLI

The Supabase CLI is a powerful tool that enables developers to manage their Supabase projects directly from the terminal. It provides a suite of commands for various tasks, including:

*   Setting up and managing local development environments
*   Generating TypeScript types for your database schema
*   Handling database migrations
*   Managing environment variables and secrets
*   Deploying your project to the Supabase platform

With the CLI, you can streamline your development workflow, automate repetitive tasks, and maintain consistency across different environments. It's an essential tool for both local development and CI/CD pipelines.

See the [CLI Getting Started guide](https://supabase.com/docs/guides/cli) for more information.




## CLI Getting Started

Develop locally, deploy to the Supabase Platform, and set up CI/CD workflows.

The Supabase CLI enables you to run the entire Supabase stack locally, on your machine or in a CI environment. With just two commands, you can set up and start a new local project:

1.  `supabase init` to create a new local project
2.  `supabase start` to launch the Supabase services

### Installing the Supabase CLI

**macOS**

Install the CLI with [Homebrew](https://brew.sh/):
```bash
brew install supabase/tap/supabase
```

**Windows**

Install the CLI with [Scoop](https://scoop.sh/):
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```
Or download the latest release `.exe` from [GitHub Releases](https://github.com/supabase/cli/releases).

**Linux**

Install the CLI with `dpkg` (Debian/Ubuntu):
```bash
sudo wget https://github.com/supabase/cli/releases/download/v<version>/supabase_<version>_linux_amd64.deb
sudo dpkg -i supabase_<version>_linux_amd64.deb
```
Replace `<version>` with the latest release version.

Or download the latest release `.apk` or `.rpm` from [GitHub Releases](https://github.com/supabase/cli/releases).

**npm / Bun**

Install the CLI with npm:
```bash
npm install supabase --save-dev
```
Or with Bun:
```bash
bun add supabase --dev
```

### Updating the Supabase CLI

When a new [version](https://github.com/supabase/cli/releases) is released, you can update the CLI using the same methods.

**macOS (Homebrew)**
```bash
brew upgrade supabase
```

**Windows (Scoop)**
```bash
scoop update supabase
```

**Linux (dpkg)**
```bash
sudo wget https://github.com/supabase/cli/releases/download/v<version>/supabase_<version>_linux_amd64.deb
sudo dpkg -i supabase_<version>_linux_amd64.deb
```

**npm / Bun**
```bash
npm update supabase
# or
bun update supabase
```

### Running Supabase locally

Before running Supabase locally, make sure you have [Docker installed](https://docs.docker.com/get-docker/) and running.

1.  Initialize Supabase:
    ```bash
    supabase init
    ```
    This creates a new `supabase` directory.

2.  Start the Supabase services:
    ```bash
    supabase start
    ```
    Once the services are running, you'll see output containing your local Supabase credentials:
    ```
    API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
        Inbucket URL: http://localhost:54324
          anon key: eyJh...<your local anon key>
    service_role key: eyJh...<your local service role key>
    ```

### Access your project's services

-   **API URL**: Your project's API gateway. You can use this with the client libraries.
-   **DB URL**: Your project's Postgres database.
-   **Studio URL**: Your project's local Supabase Studio.
-   **Inbucket URL**: A local email testing server.
-   **JWT secret**: The secret used for signing JWTs.
-   **anon key**: The public key used for accessing your API gateway.
-   **service_role key**: The private key used for bypassing RLS.

### Stopping local services

To stop the services:
```bash
supabase stop
```
To stop and reset the database:
```bash
supabase stop --no-backup
```

### Learn more

-   [Local Development](https://supabase.com/docs/guides/local-development)
-   [Managing Environments](https://supabase.com/docs/guides/getting-started/managing-environments)
-   [CLI Reference](https://supabase.com/docs/reference/cli)




## CLI Configuration (`supabase/config.toml`)

A `supabase/config.toml` file is generated after running `supabase init`.

You can edit this file to change the settings for your locally running project. After you make changes, you will need to restart using `supabase stop` and then `supabase start` for the changes to take effect.

### General Config

#### `project_id`

-   **Name**: `project_id`
-   **Default**: None
-   **Required**: true
-   **Description**: A string used to distinguish different Supabase projects on the same host. Defaults to the working directory name when running `supabase init`.

### Auth Config

#### `auth.enabled`

-   **Name**: `auth.enabled`
-   **Default**: `true`
-   **Required**: false
-   **Description**: Enable the GoTrue server.

#### `auth.site_url`

-   **Name**: `auth.site_url`
-   **Default**: `http://localhost:3000`
-   **Required**: true
-   **Description**: The base URL of your website. Used as the default redirect URL for password recovery and email verification emails.

#### `auth.additional_redirect_urls`

-   **Name**: `auth.additional_redirect_urls`
-   **Default**: `[]`
-   **Required**: false
-   **Description**: A list of URLs that GoTrue is allowed to redirect to after authentication.

#### `auth.jwt_expiry`

-   **Name**: `auth.jwt_expiry`
-   **Default**: `3600`
-   **Required**: false
-   **Description**: How long tokens are valid for, in seconds. Defaults to 3600 (1 hour), maximum 604800 (1 week).

#### `auth.enable_manual_linking`

-   **Name**: `auth.enable_manual_linking`
-   **Default**: `false`
-   **Required**: false
-   **Description**: Allow manual linking of accounts.

#### `auth.enable_refresh_token_rotation`

-   **Name**: `auth.enable_refresh_token_rotation`
-   **Default**: `true`
-   **Required**: false
-   **Description**: Enable refresh token rotation.

#### `auth.refresh_token_reuse_interval`

-   **Name**: `auth.refresh_token_reuse_interval`
-   **Default**: `10`
-   **Required**: false
-   **Description**: The duration in seconds within which a refresh token can be reused.

#### `auth.rate_limit.email_sent`

-   **Name**: `auth.rate_limit.email_sent`
-   **Default**: `30`
-   **Required**: false
-   **Description**: Maximum number of emails sent per hour.

#### `auth.rate_limit.sms_sent`

-   **Name**: `auth.rate_limit.sms_sent`
-   **Default**: `30`
-   **Required**: false
-   **Description**: Maximum number of SMS messages sent per hour.

#### `auth.rate_limit.anonymous_users`

-   **Name**: `auth.rate_limit.anonymous_users`
-   **Default**: `5`
-   **Required**: false
-   **Description**: Maximum number of anonymous sign-ins per hour.

#### `auth.rate_limit.token_refresh`

-   **Name**: `auth.rate_limit.token_refresh`
-   **Default**: `30`
-   **Required**: false
-   **Description**: Maximum number of token refreshes per hour.

#### `auth.rate_limit.sign_in_sign_ups`

-   **Name**: `auth.rate_limit.sign_in_sign_ups`
-   **Default**: `30`
-   **Required**: false
-   **Description**: Maximum number of sign-ins and sign-ups per hour.

#### `auth.rate_limit.token_verifications`

-   **Name**: `auth.rate_limit.token_verifications`
-   **Default**: `30`
-   **Required**: false
-   **Description**: Maximum number of token verifications per hour.

#### `auth.enable_signup`

-   **Name**: `auth.enable_signup`
-   **Default**: `true`
-   **Required**: false
-   **Description**: Allow new users to sign up.

#### `auth.enable_anonymous_sign_ins`

-   **Name**: `auth.enable_anonymous_sign_ins`
-   **Default**: `false`
-   **Required**: false
-   **Description**: Allow users to sign in anonymously.

#### `auth.email.enable_signup`

-   **Name**: `auth.email.enable_signup`
-   **Default**: `true`
-   **Required**: false
-   **Description**: Allow new users to sign up via email.

### Global Flags

Supabase CLI supports global flags for every command.

*   `--debug`: Print debugging information.
*   `--experimental`: Enable experimental features.
*   `--json`: Output command results in JSON format.
*   `--quiet`: Suppress CLI messages, except for errors.
*   `-v`, `--version`: Print CLI version.
*   `-h`, `--help`: Display help for command.




### CLI Commands

#### `supabase bootstrap [template] [flags]`

*   **Usage**: `supabase bootstrap [template] [flags]`
*   **Description**: Launch a quick start template.
*   **Flags**:
    *   `-p`, `--password <string>` (Optional): Password to your remote Postgres database.

#### `supabase init`

*   **Usage**: `supabase init`
*   **Description**: Initialize configurations for Supabase local development. Creates a `supabase/config.toml` file in the current working directory. This configuration is specific to each local project.
*   **Notes**: You may override the directory path by specifying the `SUPABASE_WORKDIR` environment variable or `--workdir` flag.




#### `supabase login [flags]`

*   **Usage**: `supabase login [flags]`
*   **Description**: Connect the Supabase CLI to your Supabase account by logging in with your [personal access token](https://supabase.com/dashboard/account/tokens). Your access token is stored securely in native credentials storage. If native credentials storage is unavailable, it will be written to a plain text file at `~/.supabase/access-token`. If this behavior is not desired, such as in a CI environment, you may skip login by specifying the `SUPABASE_ACCESS_TOKEN` environment variable in other commands. The Supabase CLI uses the stored token to access Management APIs for projects, functions, secrets, etc.
*   **Flags**:
    *   `--name <string>` (Optional): Name that will be used to store token in your settings.
    *   `--no-browser` (Optional): Do not open browser to log in.
    *   `--token <string>` (Optional): Supabase access token. Can also be set by `SUPABASE_ACCESS_TOKEN` environment variable.




#### `supabase link [flags]`

*   **Usage**: `supabase link [flags]`
*   **Description**: Link your local development project to a hosted Supabase project. PostgREST configurations are fetched from the Supabase platform and validated against your local configuration file. Optionally, database settings can be validated if you provide a password. Your database password is saved in native credentials storage if available. If you do not want to be prompted for the database password, such as in a CI environment, you may specify it explicitly via the `SUPABASE_DB_PASSWORD` environment variable. Some commands like `db dump`, `db push`, and `db pull` require your project to be linked first.
*   **Flags**:
    *   `-p`, `--password <string>` (Optional): Password to your remote Postgres database. Can also be set by `SUPABASE_DB_PASSWORD` environment variable.
    *   `--project-ref <string>` (Required): Project ref of the Supabase project.




#### `supabase start [flags]`

*   **Usage**: `supabase start [flags]`
*   **Description**: Starts the Supabase local development stack. Requires `supabase/config.toml` to be created in your current working directory by running `supabase init`. All service containers are started by default. You can exclude those not needed by passing in `-x` flag. To exclude multiple containers, either pass in a comma separated string, such as `-x gotrue,imgproxy`, or specify `-x` flag multiple times. It is recommended to have at least 7GB of RAM to start all services. Health checks are automatically added to verify the started containers. Use `--ignore-health-check` flag to ignore these errors.
*   **Flags**:
    *   `-x`, `--exclude <strings>` (Optional): Names of containers to not start. [gotrue,realtime,storage-api,imgproxy,kong,mailpit,postgres,meta,studio,edge-runtime,vector,pgsodium-keys]
    *   `--ignore-health-check` (Optional): Ignore health check failures for starting services.




#### `supabase stop [flags]`

*   **Usage**: `supabase stop [flags]`
*   **Description**: Stops the Supabase local development stack. Requires `supabase/config.toml` to be created in your current working directory by running `supabase init`. All Docker resources are maintained across restarts. Use `--no-backup` flag to reset your local development data between restarts. Use the `--all` flag to stop all local Supabase projects instances on the machine. Use with caution with `--no-backup` as it will delete all supabase local projects data.
*   **Flags**:
    *   `--all` (Optional): Stop all local Supabase instances from all projects across the machine.
    *   `--backup` (Optional, default: true): Backup the database before stopping. Disabling backup resets the database on the next `supabase start`.
    *   `--no-backup` (Optional): Deletes all data volumes after stopping. (Equivalent to `--backup=false`)
    *   `--project-ref <string>` (Optional): Project ref of the Supabase project to stop.




#### `supabase status [flags]`

*   **Usage**: `supabase status [flags]`
*   **Description**: Shows status of the Supabase local development stack. Requires the local development stack to be started by running `supabase start` or `supabase db start`. You can export the connection parameters for initializing supabase-js locally by specifying the `-o env` flag. Supported parameters include `JWT_SECRET`, `ANON_KEY`, and `SERVICE_ROLE_KEY`.
*   **Flags**:
    *   `--override-name <strings>` (Optional): Override specific variable names.
    *   `-o`, `--output <env | pretty | json | toml | yaml>` (Optional): Output format of status variables.




#### `supabase test db [path] ... [flags]`

*   **Usage**: `supabase test db [path] ... [flags]`
*   **Description**: Executes pgTAP tests against the local database. Requires the local development stack to be started by running `supabase start`. Runs `pg_prove` in a container with unit test files volume mounted from `supabase/tests` directory. The test file can be suffixed by either `.sql` or `.pg` extension. Since each test is wrapped in its own transaction, it will be individually rolled back regardless of success or failure.
*   **Arguments**:
    *   `[path] ...` (Optional): Path to test files. Defaults to `supabase/tests` directory.
*   **Flags**:
    *   `--db-url <string>` (Optional): Database URL to run tests against.
    *   `--level <debug | info | warn | error>` (Optional, default: info): Log level of the test runner.
    *   `--linked` (Optional): Test the linked project database.
    *   `--local` (Optional, default: true): Test the local database.
    *   `-r`, `--reporter <tap | dot | spec>` (Optional, default: tap): Test reporter output format.
    *   `--timeout-seconds <uint>` (Optional, default: 0): Timeout for tests execution.


