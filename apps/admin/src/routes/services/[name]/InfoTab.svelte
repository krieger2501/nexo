<script lang="ts">
	import type { ContainerInspect } from '$lib/server/docker';

	interface Props {
		container: ContainerInspect;
		formatDate: (iso: string) => string;
		restartPolicy: string;
		networks: string[];
	}

	let { container, formatDate, restartPolicy, networks }: Props = $props();
</script>

<div class="row-stack fade-in">
	{#each [['Image', container.Config.Image, true], ['Container ID', container.Id.slice(0, 12), true], ['Started', formatDate(container.State.StartedAt), false], ['Restarts', String(container.RestartCount), true], ['Restart policy', restartPolicy, true], ['Networks', networks.join(', '), true]] as [k, v, mono] (k)}
		<div class="kv">
			<span class="k">{k}</span>
			<span class="v {mono ? 'mono' : ''} ellipsis">{v}</span>
		</div>
	{/each}
	{#if !container.State.Running}
		<div class="kv">
			<span class="k">Stopped</span>
			<span class="v">{formatDate(container.State.FinishedAt)}</span>
		</div>
		<div class="kv">
			<span class="k">Exit code</span>
			<span class="v mono {container.State.ExitCode !== 0 ? 'warn-v' : ''}"
				>{container.State.ExitCode}</span
			>
		</div>
	{/if}
</div>
