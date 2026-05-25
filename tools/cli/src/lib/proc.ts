import { spawn, spawnSync } from 'node:child_process';
import { info } from './log.ts';

export type RunOptions = {
	cwd?: string;
	env?: NodeJS.ProcessEnv;
	// When true, suppress the "› cmd args" preview line.
	quiet?: boolean;
	// When true, capture and return stdout instead of inheriting it.
	capture?: boolean;
};

export type RunResult = {
	stdout: string;
	stderr: string;
};

// Run a command, streaming stdio to the parent process by default. Throws
// on non-zero exit so callers don't have to check status codes.
export function run(cmd: string, args: readonly string[], opts: RunOptions = {}): RunResult {
	if (!opts.quiet) info(`$ ${cmd} ${args.join(' ')}`);
	const result = spawnSync(cmd, args, {
		cwd: opts.cwd ?? process.cwd(),
		env: opts.env ?? process.env,
		stdio: opts.capture ? ['inherit', 'pipe', 'pipe'] : 'inherit',
		encoding: 'utf8'
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`${cmd} exited with status ${result.status}`);
	}
	return { stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

// Async sibling of `run`. Use when you want to await several subprocesses
// concurrently (e.g. parallel `pnpm deploy` invocations).
export function runAsync(
	cmd: string,
	args: readonly string[],
	opts: RunOptions = {}
): Promise<RunResult> {
	if (!opts.quiet) info(`$ ${cmd} ${args.join(' ')}`);
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, {
			cwd: opts.cwd ?? process.cwd(),
			env: opts.env ?? process.env,
			stdio: opts.capture ? ['inherit', 'pipe', 'pipe'] : 'inherit'
		});
		let stdout = '';
		let stderr = '';
		child.stdout?.on('data', (chunk: Buffer | string) => {
			stdout += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
		});
		child.stderr?.on('data', (chunk: Buffer | string) => {
			stderr += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
		});
		child.once('error', reject);
		child.once('close', (code) => {
			if (code === 0) resolve({ stdout, stderr });
			else reject(new Error(`${cmd} exited with status ${code}`));
		});
	});
}
