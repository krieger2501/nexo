<script lang="ts">
	let {
		checked = $bindable(false),
		label,
		id,
		color = 'var(--color-primary-500)'
	}: {
		checked: boolean;
		label: string;
		id?: string;
		color?: string;
	} = $props();
</script>

<label class="flex cursor-pointer items-center justify-between gap-3 py-0.5" for={id}>
	<span class="text-sm">{label}</span>
	<button
		type="button"
		role="switch"
		{id}
		aria-checked={checked}
		aria-label={label}
		onclick={() => (checked = !checked)}
		class="relative h-6 w-11 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
		style="background-color: {checked ? color : 'var(--color-border)'};"
	>
		<span
			class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 {checked
				? 'translate-x-5'
				: 'translate-x-0'}"
		></span>
	</button>
</label>
