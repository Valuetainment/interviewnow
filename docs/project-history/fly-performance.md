# Fly.io CPU Performance

## CPU Types

Fly.io offers two kinds of virtual CPUs for Machines: `shared` and `performance`. Both run on the same physical hardware and have the same clock speed. The difference is how much time they are allowed to spend running your applications.

| CPU Type | Period | Baseline Quota | Initial Burst Balance | Max Burst Balance |
| --- | --- | --- | --- | --- |
| `shared` | 80ms | 5ms (6.25%) | 5s | 500s |
| `performance` | 80ms | 80ms (100%) | - | - |

Fly.io enforces limits through the Linux scheduler's CPU bandwidth control by adjusting the `cpu.cfs_quota_us` setting on each machine cgroup. For each 80ms period of time, Fly.io sets a quota of 5ms for each `shared` vCPU, or the full 80ms period for each `performance` vCPU. If your machine's CPU usage reaches its quota, its tasks will be 'throttled' (not scheduled to run again) for the remainder of the 80ms period.

Quotas are shared between a Machine's vCPUs. For example, a `shared-cpu-2x` Machine is allowed to run for 10ms per 80ms period, regardless of which vCPU is using that time.

## Bursting

APIs and human-facing web applications are sensitive to latency and a 75ms pause in program execution is often unacceptable. These same types of applications often work hard in small bursts and remain idle much of the time. To improve the performance of `shared` vCPUs for these applications, Fly.io allows a balance of unused CPU time to be accrued. The application is then allowed to spend its balance in bursts. When bursting, the vCPU is allowed to run at up to 100%. When the balance is depleted, the vCPU is limited to running at its baseline quota.

Because the burst balance is only used for utilization above the baseline quota, the amount of time a machine can _actually_ run at 100% will be longer than the accumulated balance. For example, a `shared` CPU with a burst balance of 500 seconds can burst for `500/(1-.0625)` = 533 seconds. This adjustment is already applied to the burst balance displayed in the dashboard panel.

## Monitoring

Fly.io publishes a number of Instance Load and CPU platform metrics you can use to monitor quota and throttling behavior of your Machines. The easiest way to visualize these metrics is on the CPU Quota Balance and Throttling panel, on the Fly Instance dashboard in Managed Grafana.

On the dashboard, utilization (0-100%) is displayed as a per-vCPU average, divided by the total number of vCPUs in the instance. (There is also a Per-CPU Utilization panel for a detailed breakdown of utilization across each individual vCPU, but because quotas are shared between a Machine's vCPUs only the average matters to the enforced limits.)

For example, you might see a Machine whose `utilization` was running well below its `baseline` quota of 65%, and had accumulated a 50-second burst `balance`. Then, during a burst of activity, CPU utilization exceeded the baseline quota, causing the balance to drain. When the balance reached 0, the Machine was briefly `throttled`. When CPU utilization went down, throttling ended and the balance accumulated again.

A related and somewhat misleading metric is CPU steal. You can see this under the `mode=steal` label in the `fly_instance_cpu` metric. Steal is the amount of time your vCPUs are waiting to run, but the scheduler isn't allowing them to. This can happen when your Machine exceeds its quota and is throttled, but it can also be a sign that other Machines on the same host are competing for resources. In the Fly.io dashboard panels, `steal` is visualized separately from other CPU utilization since it doesn't consume any CPU quota. Fly.io publishes a separate `fly_instance_cpu_throttle` metric that only includes time your vCPUs were throttled for exceeding quota.

## Implications for Our Interview Platform

For our interview processing needs, the CPU characteristics have important implications:

### Shared CPUs

- Good for cost-efficient interview processing that involves periods of high activity followed by idle time
- The burst capability allows handling spikes in activity (such as transcription processing) without throttling
- Perfect for our interview use case where we have intense processing during speech but idle periods between responses

### Performance CPUs

- Recommended for consistent, high-CPU workloads that need predictable performance
- No throttling or burst balances to manage
- Would be appropriate for interview processing with continuous high computational requirements, such as real-time video analysis

### Recommendations

For our interview platform:
- Start with `shared` CPUs to take advantage of the burst capabilities
- Monitor CPU utilization and throttling during typical interview sessions
- If consistent throttling occurs, consider upgrading specific interview Machine types to `performance` CPUs
- Scale the number of CPUs based on the specific requirements of different interview types 