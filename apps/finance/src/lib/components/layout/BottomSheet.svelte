<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		children
	}: {
		open: boolean;
		title: string;
		children: Snippet;
	} = $props();

	function close() {
		open = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div
		class="sheet-backdrop fixed inset-0 z-50 flex flex-col justify-end"
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
			onclick={close}
			aria-label="Close"
			tabindex="-1"
		></button>

		<!-- Sheet panel -->
		<div class="sheet-panel relative rounded-t-3xl bg-surface shadow-2xl">
			<!-- Drag handle -->
			<div class="flex justify-center pt-3 pb-1">
				<div class="h-1 w-10 rounded-full bg-border"></div>
			</div>

			<!-- Header -->
			<div class="flex items-center justify-between px-5 pt-2 pb-4">
				<h2 class="text-base font-semibold tracking-tight">{title}</h2>
				<button
					type="button"
					onclick={close}
					class="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-neutral transition-colors hover:bg-border"
					aria-label="Close"
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
						<path
							d="M1 1l10 10M11 1L1 11"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>

			<!-- Content — clears the bottom nav bar + safe area -->
			<div
				class="px-5"
				style="padding-bottom: max(calc(var(--bottom-nav-height) + 1rem), env(safe-area-inset-bottom));"
			>
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.sheet-backdrop {
		animation: fade-in 180ms ease;
	}

	.sheet-panel {
		animation: slide-up 280ms cubic-bezier(0.32, 0.72, 0, 1);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
