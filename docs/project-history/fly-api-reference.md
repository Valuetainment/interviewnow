# Fly.io API Reference

## Machines API Overview

The Fly Machines REST API provides resources to provision and manage Fly Apps, Fly Machines, and Fly Volumes.

## Working with the Machines API

### API Endpoints

There are two base URLs available to connect to the Machines API service:

- **Internal base URL:** `http://_api.internal:4280`
- **Public base URL:** `https://api.machines.dev`

From within your Fly.io private WireGuard network, you can connect to the API directly using the internal endpoint. From outside the Fly.io WireGuard mesh, use the public endpoint; this proxies your request to the API.

### Authentication

All requests must include an API token in the HTTP headers:

```
Authorization: Bearer <fly_api_token>
```

Replace `<fly_api_token>` with a Fly.io authentication token.

### Environment Setup

For local development, you might set up your environment as follows:

```bash
# Set to http://_api.internal:4280 when using WireGuard
export FLY_API_HOSTNAME="https://api.machines.dev" 
export FLY_API_TOKEN=$(fly tokens deploy)
```

To set an access token as an environment variable on Fly Machines, use a secret:

```bash
fly secrets set FLY_API_TOKEN="$(fly tokens deploy)"
```

### Response Codes

The Machines API uses conventional HTTP status codes:

| Status | Description |
| --- | --- |
| 200 | Successful request. |
| 201 | Created successfully. |
| 202 | Accepted (success). |
| 204 | Successful request. No content. |
| 400 | Bad request. Check that the parameters were correct. |
| 401 | The API key used was missing or invalid. |
| 404 | The resource was not found. |
| 408 | Request timed out. |
| 5xx | Indicates an error with Fly.io API servers. |

### Rate Limits

Machines API rate limits apply _per-action_, _per-machine_ and are scoped per identifier:

- 1 request, per second, per action (Create Machine, Start Machine, etc.)
- Short-term burst limit up to 3 req/s, per action
- Get Machine allows 5 req/s, with a short-term burst limit up to 10 req/s

## Apps Resource

A Fly App is an abstraction for a group of Machines running your code, along with the configuration, provisioned resources, and data needed to run and route to your Machines.

### Create a Fly App

`POST /apps`

Machines must be associated with a Fly App. App names must be unique.

Example request:

```bash
curl -i -X POST \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps" \
  -d '{
    "app_name": "my-app-name",
    "org_slug": "personal",
    "network": "my-optional-network"
  }'
```

Example response (Status: 201 created):

```json
{
  "id":"z4k69dxd8r31p5mx",
  "created_at":1708631799000
}
```

To segment the app into its own network, pass a `network` argument in the JSON body. Any Machine started in such an app will not be able to access other apps within their organization over the private network. However, Machines within such an app can communicate with each other.

### Get App Details

`GET /apps/{app_name}`

Get details about an app, like its organization slug and name. Also useful to check if the app exists.

Example request:

```bash
curl -i -X GET \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name"
```

Example response (Status: 200 OK):

```json
{
  "id": "jlyv9r5d56v18xrg",
  "name": "my-app-name",
  "status": "pending",
  "organization": {
    "name": "My Org",
    "slug": "personal"
  }
}
```

### Set App Secrets

For sensitive environment variables, such as credentials, you can set secrets on the app:

```bash
fly secrets set DATABASE_URL=postgres://example.com/mydb <my-app-name>
```

Machines inherit secrets from the app. Existing Machines must be updated to pick up secrets set after the Machine was created.

### Delete a Fly App

`DELETE /apps/{app_name}`

Machines should be stopped before attempting deletion. Append `?force=true` to the URI to stop and delete immediately.

Example request:

```bash
curl -i -X DELETE \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name"
```

### List Apps in an Organization

`GET /apps?org_slug={org_slug}`

Example request:

```bash
curl -i -X GET \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps?org_slug=my-org"
```

## Machines Resource

### Machine Properties

A Machine is the configuration and state for a single VM running on Fly.io. Key properties include:

- `id`: The ID of the Machine
- `name`: The name of the Machine
- `state`: The state of the Machine (created, started, stopped, etc.)
- `region`: The region the Machine is in
- `private_ip`: The private IP address of the Machine
- `config`: The configuration of the Machine
- `image_ref`: Details about the image the Machine is running
- `created_at`: The time the Machine was created

### List Machines

`GET /apps/{app_name}/machines`

Example request:

```bash
curl -i -X GET \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name/machines"
```

### Create a Machine

`POST /apps/{app_name}/machines`

Example request:

```bash
curl -i -X POST \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name/machines" \
  -d '{
    "name": "my-machine-name",
    "region": "sjc",
    "config": {
      "image": "nginx",
      "guest": {
        "cpu_kind": "shared",
        "cpus": 1,
        "memory_mb": 256
      }
    }
  }'
```

### Wait for a Machine to Reach a Specified State

`GET /apps/{app_name}/machines/{machine_id}/wait`

Example request:

```bash
curl -i -X GET \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name/machines/73d8d46dbee589/wait?state=started&timeout_sec=120"
```

### Get a Machine

`GET /apps/{app_name}/machines/{machine_id}`

Example request:

```bash
curl -i -X GET \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name/machines/73d8d46dbee589"
```

### Update a Machine

`POST /apps/{app_name}/machines/{machine_id}`

Example request:

```bash
curl -i -X POST \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name/machines/73d8d46dbee589" \
  -d '{
    "config": {
      "image": "flyio/fastify-functions",
      "guest": {
        "memory_mb": 512,
        "cpus": 2,
        "cpu_kind": "shared"
      },
      "env": {
        "APP_ENV": "production"
      },
      "services": [
        {
          "ports": [
            {
              "port": 443,
              "handlers": [
                "tls",
                "http"
              ]
            }
          ],
          "protocol": "tcp",
          "internal_port": 8080
        }
      ]
    }
  }'
```

### Stop a Machine

`POST /apps/{app_name}/machines/{machine_id}/stop`

Example request:

```bash
curl -i -X POST \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name/machines/73d8d46dbee589/stop"
```

### Suspend a Machine

`POST /apps/{app_name}/machines/{machine_id}/suspend`

Suspending a Machine pauses the Machine and takes a snapshot of its state, including its memory.

Example request:

```bash
curl -i -X POST \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name/machines/73d8d46dbee589/suspend"
```

### Start a Machine

`POST /apps/{app_name}/machines/{machine_id}/start`

Example request:

```bash
curl -i -X POST \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name/machines/73d8d46dbee589/start"
```

### Delete a Machine

`DELETE /apps/{app_name}/machines/{machine_id}`

Example request:

```bash
curl -i -X DELETE \
  -H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
  "${FLY_API_HOSTNAME}/v1/apps/my-app-name/machines/24d896dec4879?force=true"
```

## Machine Config Object Properties

The `config` object for a Machine contains many properties that control its behavior:

- `image`: The container registry path to the image (required)
- `auto_destroy`: If true, the Machine destroys itself once complete
- `guest`: CPU, memory, and other resource settings
  - `cpu_kind`: `shared` or `performance`
  - `cpus`: Number of CPUs
  - `memory_mb`: Memory in megabytes
- `env`: Environment variables
- `services`: Network services and ports
- `mounts`: Attached volumes
- `restart`: Restart policies
- `metadata`: Custom metadata key-value pairs

## Networking Notes

Machines are closed to the public internet by default. To make them accessible via the associated application, you need to:

1. Allocate an IP address to the Fly App
2. Add one or more `services` to the Machine config with ports and handlers

Machines can be reached within the private network by hostname, in the format `<id>.vm.<app-name>.internal`.

For example, to reach a Machine with ID `3d8d413b29d089` on an app called `my-app-name` use hostname `3d8d413b29d089.vm.my-app-name.internal`. 