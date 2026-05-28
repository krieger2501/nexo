/**
 * Native BarcodeDetector first (Chromium + iOS Safari 17+, zero bundle), zxing-wasm fallback.
 * Decoder reads frames from a <video> element and resolves a barcode string or null.
 */

export type DecodeFn = (video: HTMLVideoElement) => Promise<string | null>;

type ZxingReadResult = { text: string };
type ZxingReadFn = (
	source: ImageData | Blob | HTMLCanvasElement,
	opts?: { formats?: string[] }
) => Promise<ZxingReadResult[]>;

interface BarcodeDetectorLike {
	detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
}

interface BarcodeDetectorCtor {
	new (opts?: { formats?: string[] }): BarcodeDetectorLike;
}

const BARCODE_FORMATS_NATIVE = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
const BARCODE_FORMATS_ZXING = ['EAN13', 'EAN8', 'UPCA', 'UPCE'];

export async function makeDecoder(): Promise<DecodeFn> {
	const native = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
		.BarcodeDetector;
	if (native) {
		const detector = new native({ formats: BARCODE_FORMATS_NATIVE });
		return async (video) => {
			try {
				const hits = await detector.detect(video);
				return hits[0]?.rawValue ?? null;
			} catch {
				return null;
			}
		};
	}

	const mod = (await import('zxing-wasm/reader')) as { readBarcodes: ZxingReadFn };
	return async (video) => {
		if (video.videoWidth === 0 || video.videoHeight === 0) return null;
		const canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		ctx.drawImage(video, 0, 0);
		try {
			const blob: Blob = await new Promise((resolve, reject) =>
				canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no blob'))), 'image/png')
			);
			const hits = await mod.readBarcodes(blob, { formats: BARCODE_FORMATS_ZXING });
			return hits[0]?.text ?? null;
		} catch {
			return null;
		}
	};
}
