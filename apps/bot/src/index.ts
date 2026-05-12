import { createNodeMiddleware, Webhooks } from '@octokit/webhooks';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { createServer } from 'node:http';

const {
	GH_APP_ID,
	GH_APP_PRIVATE_KEY,
	GH_WEBHOOK_SECRET,
	GH_REPO_OWNER,
	GH_REPO_NAME,
	GITHUB_TOKEN, // PAT with actions:write to trigger workflows
	PORT = '3003'
} = process.env;

if (
	!GH_APP_ID ||
	!GH_APP_PRIVATE_KEY ||
	!GH_WEBHOOK_SECRET ||
	!GH_REPO_OWNER ||
	!GH_REPO_NAME ||
	!GITHUB_TOKEN
) {
	console.error('Missing required env vars');
	process.exit(1);
}

// ── In-memory deploy state ────────────────────────────────────────────────────

type DeployStatus = 'deploying' | 'deployed';

const deployState = new Map<number, { sha: string; status: DeployStatus }>();

// ── Comment templates ─────────────────────────────────────────────────────────

const MARKER = (prNumber: number) => `<!-- nexo-preview pr:${prNumber} -->`;

const IDLE_COMMENT = (prNumber: number) =>
	[
		'### Nexo Preview',
		'',
		'**Status:** 💤 Idle — no deployment yet',
		'',
		'- [ ] Deploy to preview environment',
		'',
		MARKER(prNumber)
	].join('\n');

const DEPLOYING_COMMENT = (prNumber: number, sha: string) =>
	[
		'### Nexo Preview',
		'',
		`**Status:** ⏳ Deploying \`${sha.slice(0, 7)}\`…`,
		'',
		'- [x] Deploy to preview environment _(in progress)_',
		'',
		MARKER(prNumber)
	].join('\n');

const DEPLOYED_COMMENT = (prNumber: number, sha: string) =>
	[
		'### Nexo Preview',
		'',
		`**Status:** ✅ Live at \`${sha.slice(0, 7)}\``,
		'',
		'- [x] Deploy to preview environment',
		'',
		MARKER(prNumber)
	].join('\n');

const STALE_COMMENT = (prNumber: number, liveSha: string, newSha: string) =>
	[
		'### Nexo Preview',
		'',
		`**Status:** ⚠️ Stale — \`${liveSha.slice(0, 7)}\` is live, PR is now at \`${newSha.slice(0, 7)}\``,
		'',
		'- [ ] Deploy latest commit to preview',
		'',
		MARKER(prNumber)
	].join('\n');

// ── Octokit helpers ───────────────────────────────────────────────────────────

async function getInstallationOctokit(): Promise<Octokit> {
	const appOctokit = new Octokit({
		authStrategy: createAppAuth,
		auth: {
			appId: Number(GH_APP_ID),
			privateKey: GH_APP_PRIVATE_KEY!.replace(/\\n/g, '\n')
		}
	});

	const { data: installation } = await appOctokit.apps.getRepoInstallation({
		owner: GH_REPO_OWNER!,
		repo: GH_REPO_NAME!
	});

	const auth = createAppAuth({
		appId: Number(GH_APP_ID),
		privateKey: GH_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
		installationId: installation.id
	});

	const { token } = await auth({ type: 'installation' });
	return new Octokit({ auth: token });
}

async function findBotComment(
	octokit: Octokit,
	prNumber: number
): Promise<{ id: number; body: string } | null> {
	const marker = MARKER(prNumber);
	const { data: comments } = await octokit.issues.listComments({
		owner: GH_REPO_OWNER!,
		repo: GH_REPO_NAME!,
		issue_number: prNumber,
		per_page: 100
	});
	const comment = comments.find((c) => c.body?.includes(marker));
	return comment ? { id: comment.id, body: comment.body ?? '' } : null;
}

async function triggerDeploy(prNumber: number, sha: string, commentId: number) {
	const octokit = await getInstallationOctokit();

	deployState.set(prNumber, { sha, status: 'deploying' });

	await octokit.issues.updateComment({
		owner: GH_REPO_OWNER!,
		repo: GH_REPO_NAME!,
		comment_id: commentId,
		body: DEPLOYING_COMMENT(prNumber, sha)
	});

	const patOctokit = new Octokit({ auth: GITHUB_TOKEN });
	await patOctokit.actions.createWorkflowDispatch({
		owner: GH_REPO_OWNER!,
		repo: GH_REPO_NAME!,
		workflow_id: 'deploy-preview.yml',
		ref: 'main',
		inputs: {
			pr_number: String(prNumber),
			sha,
			comment_id: String(commentId)
		}
	});
}

// ── Webhook handlers ──────────────────────────────────────────────────────────

const webhooks = new Webhooks({ secret: GH_WEBHOOK_SECRET! });

webhooks.on(['pull_request.opened', 'pull_request.reopened'], async ({ payload }) => {
	const octokit = await getInstallationOctokit();
	const prNumber = payload.pull_request.number;
	const existing = await findBotComment(octokit, prNumber);
	if (existing) return;
	await octokit.issues.createComment({
		owner: GH_REPO_OWNER!,
		repo: GH_REPO_NAME!,
		issue_number: prNumber,
		body: IDLE_COMMENT(prNumber)
	});
});

// When a new commit is pushed, mark comment as stale only if something was deployed
webhooks.on('pull_request.synchronize', async ({ payload }) => {
	const prNumber = payload.pull_request.number;
	const newSha = payload.pull_request.head.sha;

	const octokit = await getInstallationOctokit();
	const comment = await findBotComment(octokit, prNumber);
	if (!comment) return;

	// Only mark stale if a deployment is live or was deployed (has a SHA in the body)
	const isDeployed = comment.body.includes('✅');
	const isDeploying = comment.body.includes('⏳');
	const state = deployState.get(prNumber);

	if (!isDeployed && !state) return; // Never deployed
	if (isDeploying || state?.status === 'deploying') return; // Don't interrupt in-flight

	// Extract the live SHA from the comment or state
	const shaMatch = comment.body.match(/`([0-9a-f]{7})`/);
	const liveSha = shaMatch ? shaMatch[1] : (state?.sha ?? newSha.slice(0, 7));

	await octokit.issues.updateComment({
		owner: GH_REPO_OWNER!,
		repo: GH_REPO_NAME!,
		comment_id: comment.id,
		body: STALE_COMMENT(prNumber, liveSha, newSha)
	});
});

// Checkbox tick triggers a deploy
webhooks.on('issue_comment.edited', async ({ payload }) => {
	const body = payload.comment.body ?? '';
	const markerMatch = body.match(/<!-- nexo-preview pr:(\d+) -->/);
	if (!markerMatch) return;

	const prNumber = Number(markerMatch[1]);
	const checked = body.includes('[x] ') || body.includes('[X] ');
	if (!checked) return;

	// Ignore ticks on the deploying comment (already in progress)
	const state = deployState.get(prNumber);
	if (state?.status === 'deploying') return;

	const octokit = await getInstallationOctokit();
	const { data: pr } = await octokit.pulls.get({
		owner: GH_REPO_OWNER!,
		repo: GH_REPO_NAME!,
		pull_number: prNumber
	});

	await triggerDeploy(prNumber, pr.head.sha, payload.comment.id);
});

const middleware = createNodeMiddleware(webhooks, { path: '/webhook' });

createServer((req, res) => {
	if (req.url === '/health') {
		res.writeHead(200).end('ok');
		return;
	}
	middleware(req, res);
}).listen(Number(PORT), () => {
	// eslint-disable-next-line no-console
	console.log(`Bot listening on port ${PORT}`);
});
