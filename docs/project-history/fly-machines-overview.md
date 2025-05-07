# Fly Machines Overview

## Introduction

Fly Machines are fast-launching VMs; they can be started and stopped at subsecond speeds. Fly.io gives you control of your Machine count and each Machine's lifecycle, resources, and region placement with a simple REST API or flyctl commands.

## Core Concepts

### What are Fly Machines?

Fly Machines are fast-launching VMs with a simple REST API. They're the compute behind the Fly.io platform. If you've launched an app on Fly.io, you're already using Fly Machines.

Fly.io uses the Machines API to build the orchestration for Fly Launch. You can use it however you'd like.

### Do I need to control Machines directly?

Fly.io gives you low-level control over Fly Machines for when you need to be picky about how, where, and when to start VMs.

For most applications, most of the time, you don't need to be picky! You scale things up to more cores or more memory, and out to more regions and more Machine counts. Fly Launch does all that for you with simple syntax and configuration.

### Machines

A Machine is the configuration and state for a single VM running on Fly.io. Every Machine will belong to a Fly App; Apps can have more than one Machine.

You can start a Machine right now, without configuring anything:

```bash
fly machine run --shell
```

When you `run` a Machine with `--shell`, Fly.io will create a small one, and tear it down when you're done.

### Machine States

The big Fly Machine trick is: starting up super fast; like, "in response to an HTTP request from a user" fast. 

The lifecycle of a Fly Machine follows these states:

1. **Created** - You create a Fly Machine with a Create Machine request, or with `fly machine run`. The Machine is in `created` state while Fly.io reserves space for your Machine, fetches your container from the global registry, and then builds a root file system. This can take some time, maybe low double-digit seconds.

2. **Started** - Once the Fly Machine exists, Fly.io boots it up right away. The Machine is in `started` state. It's running and accessible. This happens fast! Everything's already assembled; it's just booting. Usually this takes _well under a second_. The same goes for starting a stopped Machine.

3. **Stopped** - When you're done with the Fly Machine, you stop it. The VM shuts down. The Machine is in `stopped` state. Its components are still assembled on the worker host, ready to start back up.

4. **Deleted** - When you're tired of the Fly Machine and want it to go away permanently. Fly.io clears the resources held for the Machine off the server. You can easily create and start a new Machine from the same image, but it'll be slower than stopping and starting an existing Machine.

### Scaling Machines

Whether or not you use `fly launch` to boot up a Fly App, every Machine belongs to an "App" (an "App" is ultimately just a named collection of resources, configuration, and routing rules).

#### Horizontal Scaling

Scale a workload out horizontally with `fly machine clone`:

```bash
fly machine clone -a my-app --region ord 7811373c095228
```

You can clone a specific Machine as many times as you like, into specific regions; you can manage each of those Machines individually with `fly machine stop` and `fly machine start`.

#### Vertical Scaling

Scale a Machine up vertically with `fly machine update`:

```bash
fly machine update -a my-app --vm-memory 512M 7811373c095228
```

Updating a Machine takes it down (like with `fly machine stop`), applies configuration changes, and brings it back up. If you're not changing the image, so Fly.io doesn't have to fetch it from the global registry, this is fast, for the same reason `stop` and `start` are; the heavy lifting has already been done.

### Static Machine IPs

Static egress IPs can be attached to a machine. These IPs survive a machine migration and are not shared between machines.

Static egress IPs are useful when your machine needs to connect to a service that requires allowlisting a specific set of IPs. If supported, it is recommended to use Wireguard to connect to external services.

You can attach a static egress IP to your machine with:

```bash
fly machine egress-ip allocate <machine_id>
```

### Placement

When you `create`, `run`, or `clone` a Machine, you can pick a Fly.io region to place it in. The API will contact the Machines API server, which will reach out to all the worker servers in the region, find out which ones have the requisite resources to host the Machine, and try to make a smart choice about which of those servers to put the Machine in.

You don't get to pick particular servers (there are ways to cheat and do it anyway, but you shouldn't want to), just the region.

If you pick a particular region, like `ord` or `yyz`, Fly.io will _only_ create the Machine in that region.

**Placement can fail!** It shouldn't happen often, but Fly.io can run out of capacity in particular regions. Both flyctl and the Fly Machines API are best-effort. If you're working with Fly.io at this level of control, it's on you to retry requests and ensure they go through. In exchange for that burden, Fly.io tries to make sure the Fly Machines API is responsive, so you get quick answers.

## Fly Machine Features Recap

* Manage with the Machines API or flyctl commands
* Stop automatically when a program exits
* Stop or start quickly, either manually or automatically based on traffic
* Provide ephemeral storage, a blank slate on every startup
* Attach a volume for persistent storage
* Place in any region 