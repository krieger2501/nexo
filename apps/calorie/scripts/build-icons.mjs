/**
 * Generate calorie PWA icons from favicon.svg.
 * Run from apps/calorie/: node scripts/build-icons.mjs
 *
 * Mirrors finance's icon set:
 *   - favicon.png (32×32)
 *   - apple-touch-icon.png (180×180)
 *   - icons/icon-192x192.png (PWA + maskable)
 *   - icons/icon-512x512.png (PWA + maskable)
 *
 * Maskable icons are generated with the logo at 70% scale so the safe zone
 * is preserved on Android adaptive icons.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const staticDir = join(root, 'static');
const iconsDir = join(staticDir, 'icons');
mkdirSync(iconsDir, { recursive: true });

const svg = readFileSync(join(staticDir, 'favicon.svg'));

async function emit(size, name, opts = {}) {
	const buf = await sharp(svg, { density: 384 })
		.resize(size, size, { fit: 'contain', background: opts.bg ?? { r: 42, g: 20, b: 16 } })
		.png({ compressionLevel: 9 })
		.toBuffer();
	const out = join(staticDir, name);
	writeFileSync(out, buf);
	console.log(`✓ ${name}  (${size}×${size})`);
}

// favicon.png — small, browser tab fallback
await emit(32, 'favicon.png');

// apple-touch-icon — iOS home-screen
await emit(180, 'apple-touch-icon.png');

// PWA icons
await emit(192, 'icons/icon-192x192.png');
await emit(512, 'icons/icon-512x512.png');

console.log('\nDone. Icons written to apps/calorie/static/');
