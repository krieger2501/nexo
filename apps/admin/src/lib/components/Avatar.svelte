<script lang="ts">
	interface Props {
		initials: string;
		size?: 'sm' | 'lg';
		highlight?: boolean;
	}

	let { initials, size = 'sm', highlight = false }: Props = $props();
</script>

<div class="avatar" class:lg={size === 'lg'} class:owner={highlight}>
	{initials}
</div>
