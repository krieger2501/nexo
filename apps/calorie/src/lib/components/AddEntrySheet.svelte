<script lang="ts">
	import {
		Search,
		Barcode,
		Clock,
		Star,
		X,
		Layers,
		Plus,
		Trash2,
		Check,
		ChevronDown
	} from '@lucide/svelte';
	import { BottomSheet } from '@nexo/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import UnitStepper from './UnitStepper.svelte';
	import { untrack } from 'svelte';
	import type { Food, FoodUnit, Meal, MealSlot } from '$lib/types';
	import { m } from '$lib/i18n';

	let {
		open = $bindable(false),
		initialSlot = null,
		foods = [],
		favoriteIds = [],
		recentIds = [],
		savedMeals = []
	}: {
		open?: boolean;
		initialSlot?: MealSlot | null;
		foods?: Food[];
		favoriteIds?: string[];
		recentIds?: string[];
		savedMeals?: Meal[];
	} = $props();

	type Tab = 'search' | 'scan' | 'recents' | 'favorites' | 'meals';
	type StackItem = { id: string; food: Food; grams: number };

	let tab = $state<Tab>('search');
	let query = $state('');
	let stack = $state<StackItem[]>([]);
	let mealName = $state('');
	let mealSlot = $state<MealSlot | null>(untrack(() => initialSlot));
	let saveAsTemplate = $state(false);
	let slotPickerOpen = $state(false);

	// In-flight food being configured (replaces the row inline, not a takeover)
	let pendingFoodId = $state<string | null>(null);
	let pendingGrams = $state(100);
	let saving = $state(false);

	// Sync slot when sheet opens
	$effect(() => {
		if (open) {
			if (initialSlot && !mealSlot) mealSlot = initialSlot;
		}
	});

	const matches = $derived(
		query.trim()
			? foods.filter(
					(f) =>
						f.name.toLowerCase().includes(query.toLowerCase()) ||
						f.brand?.toLowerCase().includes(query.toLowerCase())
				)
			: foods.slice(0, 8)
	);

	const recents = $derived(
		recentIds.map((id) => foods.find((f) => f.id === id)).filter((x): x is Food => x != null)
	);

	const favorites = $derived(
		favoriteIds.map((id) => foods.find((f) => f.id === id)).filter((x): x is Food => x != null)
	);

	const totals = $derived(
		stack.reduce(
			(acc, it) => {
				const k = (n: number | undefined) => ((n ?? 0) * it.grams) / 100;
				return {
					kcal: acc.kcal + k(it.food.per100.kcal),
					protein_g: acc.protein_g + k(it.food.per100.protein_g),
					carbs_g: acc.carbs_g + k(it.food.per100.carbs_g),
					fat_g: acc.fat_g + k(it.food.per100.fat_g)
				};
			},
			{ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
		)
	);

	const pendingFood = $derived(pendingFoodId ? foods.find((f) => f.id === pendingFoodId) : null);

	const pendingPreview = $derived.by(() => {
		if (!pendingFood) return { kcal: 0, p: 0, c: 0, f: 0 };
		const g = pendingGrams;
		return {
			kcal: Math.round((pendingFood.per100.kcal * g) / 100),
			p: Math.round(((pendingFood.per100.protein_g * g) / 100) * 10) / 10,
			c: Math.round(((pendingFood.per100.carbs_g * g) / 100) * 10) / 10,
			f: Math.round(((pendingFood.per100.fat_g * g) / 100) * 10) / 10
		};
	});

	function startPending(f: Food) {
		pendingFoodId = f.id;
		// Pick the food's default unit and set grams to ~1 of that unit (or 100g if just g).
		const defaultUnit = f.units?.find((u) => u.default) ?? f.units?.[0];
		if (defaultUnit && defaultUnit.id !== 'g') {
			pendingGrams = Math.round(defaultUnit.gramsPerUnit);
		} else {
			pendingGrams = 100;
		}
	}

	function unitsFor(food: Food | null): FoodUnit[] {
		if (!food) return [{ id: 'g', gramsPerUnit: 1, default: true }];
		return food.units ?? [{ id: 'g', gramsPerUnit: 1, default: true }];
	}

	function cancelPending() {
		pendingFoodId = null;
	}

	function commitPending() {
		if (!pendingFood) return;
		stack = [
			...stack,
			{ id: 's-' + Math.random().toString(36).slice(2, 8), food: pendingFood, grams: pendingGrams }
		];
		pendingFoodId = null;
	}

	function removeFromStack(id: string) {
		stack = stack.filter((it) => it.id !== id);
	}

	function addSavedMeal(meal: Meal) {
		const items = meal.items
			.map((mi) => {
				const f = foods.find((x) => x.id === mi.foodId);
				return f
					? { id: 's-' + Math.random().toString(36).slice(2, 8), food: f, grams: mi.grams }
					: null;
			})
			.filter((x): x is StackItem => x != null);
		stack = [...stack, ...items];
		if (!mealName && meal.name) mealName = meal.name;
		if (!mealSlot && meal.mealSlot) mealSlot = meal.mealSlot;
		tab = 'search';
	}

	function reset() {
		stack = [];
		mealName = '';
		mealSlot = initialSlot;
		saveAsTemplate = false;
		pendingFoodId = null;
		query = '';
		tab = 'search';
	}

	function save() {
		if (stack.length === 0) return;
		if (saving) return;
		saving = true;
		const items = stack.map((it) => {
			const f = it.food;
			const g = it.grams;
			const isBarcode = /^\d{8,14}$/.test(f.id);
			return {
				foodBarcode: isBarcode ? f.id : null,
				foodUserId: isBarcode ? null : f.id,
				foodName: f.name,
				grams: g,
				unit: 'g',
				kcal: Math.round((f.per100.kcal * g) / 100),
				proteinG: Math.round(((f.per100.protein_g * g) / 100) * 10) / 10,
				carbsG: Math.round(((f.per100.carbs_g * g) / 100) * 10) / 10,
				fatG: Math.round(((f.per100.fat_g * g) / 100) * 10) / 10,
				fiberG:
					f.per100.fiber_g != null
						? Math.round(((f.per100.fiber_g * g) / 100) * 10) / 10
						: undefined,
				sugarG:
					f.per100.sugar_g != null
						? Math.round(((f.per100.sugar_g * g) / 100) * 10) / 10
						: undefined
			};
		});
		const form = new FormData();
		form.set('items', JSON.stringify(items));
		if (mealSlot) form.set('mealSlot', mealSlot);
		if (saveAsTemplate && stack.length > 1 && mealName) form.set('templateName', mealName);
		fetch('/?/logEntry', { method: 'POST', body: form })
			.then(async (res) => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				await invalidateAll();
				open = false;
				reset();
			})
			.catch((e) => console.error('logEntry failed', e))
			.finally(() => (saving = false));
	}

	const tabs: { id: Tab; label: string; icon: typeof Search }[] = [
		{ id: 'search', label: m.add_search(), icon: Search },
		{ id: 'scan', label: m.add_scan(), icon: Barcode },
		{ id: 'recents', label: m.add_recents(), icon: Clock },
		{ id: 'favorites', label: m.add_favorites(), icon: Star },
		{ id: 'meals', label: m.add_meals(), icon: Layers }
	];

	const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
	const slotLabels: Record<MealSlot, () => string> = {
		breakfast: m.meal_breakfast,
		lunch: m.meal_lunch,
		dinner: m.meal_dinner,
		snack: m.meal_snack
	};

	function mealKcalPreview(meal: Meal): number {
		return meal.items.reduce((sum, mi) => {
			const f = foods.find((x) => x.id === mi.foodId);
			return sum + (f ? Math.round((f.per100.kcal * mi.grams) / 100) : 0);
		}, 0);
	}

	const sheetTitle = $derived(stack.length > 1 ? m.meal_builder_heading() : m.action_log_food());
	const slotChipLabel = $derived(mealSlot ? slotLabels[mealSlot]() : m.add_meal_slot_none());
	const showNameField = $derived(stack.length > 1);
</script>

<BottomSheet bind:open title={sheetTitle}>
	<!-- Slot chip — small, in the top-right area -->
	<div class="slot-chip-row">
		<button
			class="slot-chip"
			class:assigned={mealSlot !== null}
			type="button"
			onclick={() => (slotPickerOpen = !slotPickerOpen)}
			aria-expanded={slotPickerOpen}
		>
			<span class="dot" aria-hidden="true"></span>
			<span class="lbl">{slotChipLabel}</span>
			<ChevronDown size={12} strokeWidth={1.7} />
		</button>
	</div>

	{#if slotPickerOpen}
		<div class="slot-picker" role="radiogroup" aria-label={m.add_meal_slot()}>
			<button
				class="sp-btn"
				class:on={mealSlot === null}
				type="button"
				onclick={() => {
					mealSlot = null;
					slotPickerOpen = false;
				}}
			>
				—
			</button>
			{#each slots as s (s)}
				<button
					class="sp-btn"
					class:on={mealSlot === s}
					type="button"
					onclick={() => {
						mealSlot = s;
						slotPickerOpen = false;
					}}
				>
					{slotLabels[s]()}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Stack — only shown once items added -->
	{#if stack.length > 0}
		<section class="stack">
			{#if showNameField}
				<input
					class="name-input"
					placeholder={m.meal_name_placeholder()}
					bind:value={mealName}
					autocomplete="off"
				/>
			{/if}
			<ul class="stack-list">
				{#each stack as it (it.id)}
					{@const ikcal = Math.round((it.food.per100.kcal * it.grams) / 100)}
					<li class="stack-item">
						<div class="si-text">
							<div class="si-name">{it.food.name}</div>
							<div class="si-meta">
								<span class="si-grams">{it.grams} g</span>
								<span class="si-dot">·</span>
								<span class="si-kcal-inline">{ikcal} kcal</span>
							</div>
						</div>
						<button
							class="si-remove"
							type="button"
							onclick={() => removeFromStack(it.id)}
							aria-label={m.meal_remove_item()}
						>
							<Trash2 size={13} strokeWidth={1.6} />
						</button>
					</li>
				{/each}
			</ul>

			<div class="totals">
				<span class="t-label">{m.meal_total()}</span>
				<div class="t-macros">
					<span class="t-m" data-key="protein">{Math.round(totals.protein_g)}P</span>
					<span class="t-m" data-key="carbs">{Math.round(totals.carbs_g)}C</span>
					<span class="t-m" data-key="fat">{Math.round(totals.fat_g)}F</span>
				</div>
				<span class="t-kcal">
					<span class="num">{Math.round(totals.kcal)}</span>
					<span class="unit">kcal</span>
				</span>
			</div>

			{#if showNameField}
				<label class="save-toggle">
					<input type="checkbox" bind:checked={saveAsTemplate} />
					<span class="st-text">
						<span class="st-label">{m.meal_save_template_label()}</span>
						<span class="st-hint">{m.meal_save_template_hint()}</span>
					</span>
				</label>
			{/if}

			<div class="add-more-rule" aria-hidden="true">
				<span class="amr-line"></span>
				<span class="amr-label">{m.meal_add_more()}</span>
				<span class="amr-line"></span>
			</div>
		</section>
	{/if}

	<!-- Tabs -->
	<div class="tabs" role="tablist">
		{#each tabs as t (t.id)}
			<button
				class="tab"
				class:active={tab === t.id}
				role="tab"
				aria-selected={tab === t.id}
				type="button"
				onclick={() => {
					if (t.id === 'scan') {
						open = false;
						goto('/scan');
					} else {
						tab = t.id;
					}
				}}
			>
				<t.icon size={14} strokeWidth={1.7} />
				<span>{t.label}</span>
			</button>
		{/each}
	</div>

	<!-- Search bar (only on search tab) -->
	{#if tab === 'search'}
		<div class="search-wrap">
			<Search size={16} strokeWidth={1.7} class="search-icon" />
			<input
				class="search-input"
				placeholder={m.add_search_placeholder()}
				bind:value={query}
				autocomplete="off"
			/>
			{#if query}
				<button class="clear" type="button" onclick={() => (query = '')} aria-label="Clear">
					<X size={13} strokeWidth={2} />
				</button>
			{/if}
		</div>
	{/if}

	<!-- Results -->
	<div class="results">
		{#if tab === 'search'}
			{#each matches as f (f.id)}
				{#if pendingFoodId === f.id && pendingFood}
					<!-- Inline-expanded row -->
					<div class="expand">
						<div class="ex-head">
							<div class="ex-text">
								<div class="ex-name">{pendingFood.name}</div>
								{#if pendingFood.brand}
									<div class="ex-brand">{pendingFood.brand}</div>
								{/if}
							</div>
							<button
								class="ex-close"
								type="button"
								onclick={cancelPending}
								aria-label={m.action_cancel()}
							>
								<X size={14} strokeWidth={1.7} />
							</button>
						</div>

						<div class="ex-row">
							<UnitStepper
								bind:grams={pendingGrams}
								units={unitsFor(pendingFood)}
								ariaLabel="Amount"
							/>
							<div class="ex-preview">
								<span class="ex-num">{pendingPreview.kcal}</span>
								<span class="ex-unit">kcal</span>
							</div>
						</div>

						<div class="ex-macros">
							<span class="emm" style="--c:var(--color-protein)"
								><span class="emm-l">P</span><span class="emm-v">{pendingPreview.p}g</span></span
							>
							<span class="emm" style="--c:var(--color-carbs)"
								><span class="emm-l">C</span><span class="emm-v">{pendingPreview.c}g</span></span
							>
							<span class="emm" style="--c:var(--color-fat)"
								><span class="emm-l">F</span><span class="emm-v">{pendingPreview.f}g</span></span
							>
						</div>

						<button class="ex-add" type="button" onclick={commitPending}>
							<Check size={14} strokeWidth={2.2} />
							<span>{m.meal_add_to_stack()}</span>
						</button>
					</div>
				{:else}
					<button class="row" type="button" onclick={() => startPending(f)}>
						<div class="r-text">
							<div class="r-name">{f.name}</div>
							<div class="r-sub">
								{#if f.brand}<span class="brand">{f.brand}</span><span class="dot">·</span>{/if}
								<span class="per"><span class="num">{f.per100.kcal}</span> kcal/100g</span>
							</div>
						</div>
						<span class="add-chip">
							<Plus size={13} strokeWidth={2} />
						</span>
					</button>
				{/if}
			{/each}
			{#if !matches.length}
				<div class="empty">{m.add_no_results()}</div>
			{/if}
		{:else if tab === 'recents'}
			{#each recents as f (f.id)}
				{#if pendingFoodId === f.id && pendingFood}
					<div class="expand">
						<div class="ex-head">
							<div class="ex-text">
								<div class="ex-name">{pendingFood.name}</div>
							</div>
							<button class="ex-close" type="button" onclick={cancelPending}>
								<X size={14} strokeWidth={1.7} />
							</button>
						</div>
						<div class="ex-row">
							<UnitStepper
								bind:grams={pendingGrams}
								units={unitsFor(pendingFood)}
								ariaLabel="Amount"
							/>
							<div class="ex-preview">
								<span class="ex-num">{pendingPreview.kcal}</span>
								<span class="ex-unit">kcal</span>
							</div>
						</div>
						<button class="ex-add" type="button" onclick={commitPending}>
							<Check size={14} strokeWidth={2.2} />
							<span>{m.meal_add_to_stack()}</span>
						</button>
					</div>
				{:else}
					<button class="row" type="button" onclick={() => startPending(f)}>
						<div class="r-text">
							<div class="r-name">{f.name}</div>
							<div class="r-sub">
								<span class="per"><span class="num">{f.per100.kcal}</span> kcal/100g</span>
							</div>
						</div>
						<span class="add-chip"><Plus size={13} strokeWidth={2} /></span>
					</button>
				{/if}
			{/each}
		{:else if tab === 'favorites'}
			{#each favorites as f (f.id)}
				{#if pendingFoodId === f.id && pendingFood}
					<div class="expand">
						<div class="ex-head">
							<div class="ex-text">
								<div class="ex-name">{pendingFood.name}</div>
							</div>
							<button class="ex-close" type="button" onclick={cancelPending}>
								<X size={14} strokeWidth={1.7} />
							</button>
						</div>
						<div class="ex-row">
							<UnitStepper
								bind:grams={pendingGrams}
								units={unitsFor(pendingFood)}
								ariaLabel="Amount"
							/>
							<div class="ex-preview">
								<span class="ex-num">{pendingPreview.kcal}</span>
								<span class="ex-unit">kcal</span>
							</div>
						</div>
						<button class="ex-add" type="button" onclick={commitPending}>
							<Check size={14} strokeWidth={2.2} />
							<span>{m.meal_add_to_stack()}</span>
						</button>
					</div>
				{:else}
					<button class="row" type="button" onclick={() => startPending(f)}>
						<div class="r-text">
							<div class="r-name">
								<Star size={11} strokeWidth={2} class="star-icon" fill="currentColor" />
								{f.name}
							</div>
							<div class="r-sub">
								<span class="per"><span class="num">{f.per100.kcal}</span> kcal/100g</span>
							</div>
						</div>
						<span class="add-chip"><Plus size={13} strokeWidth={2} /></span>
					</button>
				{/if}
			{/each}
		{:else if tab === 'meals'}
			{#each savedMeals as meal (meal.id)}
				<button class="row" type="button" onclick={() => addSavedMeal(meal)}>
					<div class="r-text">
						<div class="r-name">{meal.name}</div>
						<div class="r-sub">
							{meal.items.length}
							{m.saved_meal_items()} ·
							<span class="num">{mealKcalPreview(meal)}</span> kcal
						</div>
					</div>
					<span class="add-chip"><Plus size={13} strokeWidth={2} /></span>
				</button>
			{/each}
			{#if !savedMeals.length}
				<div class="empty">{m.saved_meals_empty()}</div>
			{/if}
		{/if}
	</div>

	<!-- Sticky save bar -->
	{#if stack.length > 0}
		<div class="save-bar">
			<button class="save-cta" type="button" onclick={save}>
				<span class="sc-label">
					{stack.length > 1 ? m.meal_save_button_many() : m.meal_save_button_one()}
				</span>
				<span class="sc-num">
					<span class="sc-count">{stack.length}</span>
					<span class="sc-bullet">·</span>
					{Math.round(totals.kcal)}
					{m.unit_kcal()}
				</span>
			</button>
		</div>
	{/if}
</BottomSheet>

<style>
	/* ── Slot chip ── */
	.slot-chip-row {
		display: flex;
		justify-content: flex-end;
		padding: 0 0 10px;
	}

	.slot-chip {
		all: unset;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 999px;
		background: var(--color-bg-1);
		color: var(--color-text-muted);
		font-size: 12px;
		border: 1px solid transparent;
		transition: all 160ms;
	}

	.slot-chip.assigned {
		background: color-mix(in oklab, var(--color-ember) 8%, var(--color-bg-0));
		color: var(--color-ember-deep);
		border-color: color-mix(in oklab, var(--color-ember) 22%, transparent);
	}

	.slot-chip .dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: currentColor;
		opacity: 0.55;
	}

	.slot-picker {
		display: flex;
		gap: 4px;
		padding: 4px;
		background: var(--color-bg-1);
		border-radius: 12px;
		margin-bottom: 12px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.slot-picker::-webkit-scrollbar {
		display: none;
	}

	.sp-btn {
		all: unset;
		flex: 1;
		text-align: center;
		min-width: 60px;
		padding: 8px 12px;
		border-radius: 9px;
		font-size: 12.5px;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 160ms;
		flex-shrink: 0;
	}

	.sp-btn.on {
		background: var(--color-text-primary);
		color: var(--color-bg-0);
	}

	/* ── Stack ── */
	.stack {
		padding: 0 0 12px;
	}

	.name-input {
		all: unset;
		font-family: var(--font-display);
		font-variation-settings:
			'opsz' 36,
			'SOFT' 70,
			'wght' 470;
		font-size: 17px;
		letter-spacing: -0.015em;
		color: var(--color-text-primary);
		padding: 4px 0 10px;
		width: 100%;
		border-bottom: 1px solid var(--color-border-subtle);
		margin-bottom: 8px;
	}

	.name-input::placeholder {
		color: var(--color-text-faint);
	}

	.stack-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.stack-item {
		display: grid;
		grid-template-columns: 1fr 28px;
		gap: 12px;
		align-items: center;
		padding: 9px 0;
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.stack-item:last-child {
		border-bottom: none;
	}

	.si-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.si-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.si-meta {
		display: inline-flex;
		gap: 5px;
		align-items: baseline;
		font-size: 12px;
		color: var(--color-text-subtle);
	}

	.si-grams,
	.si-kcal-inline {
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1;
		font-variation-settings:
			'opsz' 18,
			'wght' 460;
	}

	.si-dot {
		color: var(--color-text-faint);
	}

	.si-remove {
		all: unset;
		cursor: pointer;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 999px;
		color: var(--color-text-faint);
		transition:
			background 140ms,
			color 140ms;
	}

	.si-remove:active {
		background: color-mix(in oklab, var(--color-overtarget) 12%, transparent);
		color: var(--color-overtarget);
	}

	.totals {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: baseline;
		gap: 14px;
		padding: 12px 4px 4px;
		margin-top: 4px;
		border-top: 1px solid var(--color-border-default);
	}

	.t-label {
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-text-subtle);
	}

	.t-macros {
		display: inline-flex;
		gap: 8px;
		justify-self: end;
	}

	.t-m {
		font-family: var(--font-mono);
		font-size: 11px;
		font-feature-settings: 'tnum' 1;
		color: var(--color-text-subtle);
		letter-spacing: 0.02em;
	}

	.t-m[data-key='protein'] {
		color: color-mix(in oklab, var(--color-protein) 80%, var(--color-text-muted));
	}
	.t-m[data-key='carbs'] {
		color: color-mix(in oklab, var(--color-carbs) 75%, var(--color-text-muted));
	}
	.t-m[data-key='fat'] {
		color: color-mix(in oklab, var(--color-fat) 70%, var(--color-text-muted));
	}

	.t-kcal {
		display: inline-flex;
		align-items: baseline;
		gap: 4px;
	}

	.t-kcal .num {
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1;
		font-variation-settings:
			'opsz' 60,
			'SOFT' 80,
			'wght' 500;
		font-size: 22px;
		letter-spacing: -0.025em;
		color: var(--color-text-primary);
	}

	.t-kcal .unit {
		font-size: 10px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-text-subtle);
	}

	.save-toggle {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 12px 0 4px;
		cursor: pointer;
	}

	.save-toggle input[type='checkbox'] {
		appearance: none;
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 5px;
		border: 1.5px solid var(--color-border-strong);
		background: var(--color-surface-1);
		cursor: pointer;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		margin-top: 1px;
		transition: all 160ms;
	}

	.save-toggle input[type='checkbox']:checked {
		background: var(--color-ember);
		border-color: var(--color-ember);
	}

	.save-toggle input[type='checkbox']:checked::after {
		content: '';
		width: 9px;
		height: 5px;
		border-left: 2px solid var(--color-bg-0);
		border-bottom: 2px solid var(--color-bg-0);
		transform: rotate(-45deg) translate(1px, -1px);
	}

	.st-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.st-label {
		font-size: 13px;
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.st-hint {
		font-size: 11.5px;
		color: var(--color-text-subtle);
	}

	.add-more-rule {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 4px 8px;
	}

	.amr-line {
		flex: 1;
		height: 1px;
		background: var(--color-border-subtle);
	}

	.amr-label {
		font-family: var(--font-mono);
		font-size: 9.5px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-text-faint);
	}

	/* ── Tabs ── */
	.tabs {
		display: flex;
		gap: 2px;
		padding: 0 0 10px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.tabs::-webkit-scrollbar {
		display: none;
	}

	.tab {
		all: unset;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 7px 12px;
		border-radius: 999px;
		font-size: 12px;
		color: var(--color-text-subtle);
		flex-shrink: 0;
		transition:
			background 160ms,
			color 160ms;
	}

	.tab.active {
		color: var(--color-text-primary);
		background: var(--color-bg-1);
	}

	/* ── Search ── */
	.search-wrap {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		background: var(--color-bg-1);
		border-radius: 12px;
		margin-bottom: 6px;
		color: var(--color-text-subtle);
	}

	:global(.search-icon) {
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		all: unset;
		font-size: 14.5px;
		color: var(--color-text-primary);
	}

	.search-input::placeholder {
		color: var(--color-text-faint);
	}

	.clear {
		all: unset;
		cursor: pointer;
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 999px;
		background: var(--color-bg-2);
		color: var(--color-text-subtle);
	}

	/* ── Result rows ── */
	.results {
		display: flex;
		flex-direction: column;
	}

	.row {
		all: unset;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 11px 4px;
		border-bottom: 1px solid var(--color-border-subtle);
		gap: 10px;
		transition: background 140ms;
	}

	.row:active {
		background: var(--color-bg-1);
	}

	.r-name {
		font-size: 14px;
		color: var(--color-text-primary);
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	:global(.star-icon) {
		color: var(--color-ember);
	}

	.r-sub {
		display: inline-flex;
		gap: 6px;
		align-items: baseline;
		margin-top: 2px;
		font-size: 12px;
		color: var(--color-text-subtle);
	}

	.brand {
		color: var(--color-text-muted);
	}

	.dot {
		color: var(--color-text-faint);
	}

	.per {
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1;
		font-variation-settings:
			'opsz' 18,
			'wght' 460;
	}

	.per .num {
		color: var(--color-text-primary);
	}

	.add-chip {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 999px;
		background: var(--color-bg-1);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.empty {
		padding: 18px 4px;
		font-size: 13px;
		color: var(--color-text-subtle);
		line-height: 1.5;
	}

	/* ── Inline expand (pending food) ── */
	.expand {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 14px 14px 14px;
		margin: 6px 0;
		background: color-mix(in oklab, var(--color-ember) 5%, var(--color-surface-1));
		border: 1px solid color-mix(in oklab, var(--color-ember) 22%, var(--color-border-default));
		border-radius: 14px;
		animation: expand-in 220ms cubic-bezier(0.32, 0.72, 0, 1);
	}

	@keyframes expand-in {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.ex-head {
		display: grid;
		grid-template-columns: 1fr 28px;
		gap: 10px;
		align-items: start;
	}

	.ex-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.ex-name {
		font-size: 15px;
		font-weight: 500;
		color: var(--color-text-primary);
		letter-spacing: -0.005em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ex-brand {
		font-size: 12px;
		color: var(--color-text-subtle);
	}

	.ex-close {
		all: unset;
		cursor: pointer;
		width: 28px;
		height: 28px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		background: var(--color-surface-1);
		color: var(--color-text-muted);
		border: 1px solid var(--color-border-subtle);
	}

	.ex-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 12px;
		align-items: center;
	}

	.ex-preview {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.ex-num {
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1;
		font-variation-settings:
			'opsz' 60,
			'SOFT' 80,
			'wght' 500;
		font-size: 24px;
		letter-spacing: -0.025em;
		color: var(--color-text-primary);
	}

	.ex-unit {
		font-size: 9.5px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-text-subtle);
	}

	.ex-macros {
		display: flex;
		gap: 16px;
		justify-content: flex-start;
	}

	.emm {
		display: inline-flex;
		align-items: baseline;
		gap: 4px;
	}

	.emm-l {
		font-size: 9.5px;
		letter-spacing: 0.16em;
		color: var(--c);
		font-weight: 600;
	}

	.emm-v {
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1;
		font-variation-settings:
			'opsz' 18,
			'wght' 460;
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.ex-add {
		all: unset;
		cursor: pointer;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		gap: 6px;
		padding: 11px 18px;
		background: var(--color-text-primary);
		color: var(--color-bg-0);
		border-radius: 12px;
		font-size: 13.5px;
		font-weight: 500;
		transition: transform 120ms;
	}

	.ex-add:active {
		transform: scale(0.99);
	}

	/* ── Sticky save bar ── */
	.save-bar {
		position: sticky;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 12px 0 4px;
		background: linear-gradient(
			to top,
			var(--color-bg-0) 60%,
			color-mix(in oklab, var(--color-bg-0) 50%, transparent)
		);
		margin-top: 10px;
	}

	.save-cta {
		all: unset;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 22px;
		background: var(--color-ember);
		color: oklch(98% 0.008 70);
		border-radius: 16px;
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.005em;
		transition:
			background 160ms,
			transform 120ms;
		width: 100%;
		box-sizing: border-box;
	}

	.save-cta:active {
		transform: scale(0.99);
		background: var(--color-ember-deep);
	}

	.sc-label {
		font-size: 15px;
	}

	.sc-num {
		display: inline-flex;
		align-items: baseline;
		gap: 5px;
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1;
		font-variation-settings:
			'opsz' 24,
			'wght' 460;
		opacity: 0.92;
	}

	.sc-count {
		display: inline-grid;
		place-items: center;
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.16);
		font-size: 12px;
	}

	.sc-bullet {
		opacity: 0.5;
	}
</style>
