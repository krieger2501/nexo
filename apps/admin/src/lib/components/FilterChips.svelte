<script lang="ts" generics="T extends string">
	interface Option {
		value: T;
		label: string;
		count?: number;
	}

	interface Props {
		options: Option[];
		value: T;
	}

	let { options, value = $bindable(options[0]?.value as T) }: Props = $props();
</script>

<div class="chip-row">
	{#each options as opt (opt.value)}
		<button
			type="button"
			class="chip"
			class:active={value === opt.value}
			onclick={() => (value = opt.value)}
		>
			{opt.label}
			{#if opt.count !== undefined}
				<span class="count">{opt.count}</span>
			{/if}
		</button>
	{/each}
</div>
