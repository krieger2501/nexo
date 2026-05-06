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
  PORT = '3003',
} = process.env;

if (!GH_APP_ID || !GH_APP_PRIVATE_KEY || !GH_WEBHOOK_SECRET || !GH_REPO_OWNER || !GH_REPO_NAME || !GITHUB_TOKEN) {
  console.error('Missing required env vars');
  process.exit(1);
}

const INITIAL_COMMENT = (prNumber: number) => `### Nexo Preview

**Status:** 💤 Idle

React with 🚀 to deploy this PR to the preview environment, or uncheck the box below.

- [ ] Deploy preview

<!-- nexo-preview pr:${prNumber} -->`;

const DEPLOYING_COMMENT = (sha: string) => `### Nexo Preview

**Status:** ⏳ Deploying \`${sha.slice(0, 7)}\`…`;

const SUCCESS_COMMENT = (sha: string) => `### Nexo Preview

**Status:** ✅ Deployed \`${sha.slice(0, 7)}\`

| App | URL |
|---|---|
| Landing | https://preview.krieger2501.de |
| Finance | https://finance.preview.krieger2501.de |
| Auth | https://auth.preview.krieger2501.de |

React with 🚀 on this comment to redeploy.

<!-- nexo-preview-live -->`;

async function getInstallationOctokit(): Promise<Octokit> {
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: Number(GH_APP_ID),
      privateKey: GH_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
  });

  const { data: installation } = await appOctokit.apps.getRepoInstallation({
    owner: GH_REPO_OWNER!,
    repo: GH_REPO_NAME!,
  });

  const auth = createAppAuth({
    appId: Number(GH_APP_ID),
    privateKey: GH_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    installationId: installation.id,
  });

  const { token } = await auth({ type: 'installation' });
  return new Octokit({ auth: token });
}

async function triggerDeploy(prNumber: number, sha: string, commentId: number) {
  const octokit = await getInstallationOctokit();

  // Update comment to "deploying"
  await octokit.issues.updateComment({
    owner: GH_REPO_OWNER!,
    repo: GH_REPO_NAME!,
    comment_id: commentId,
    body: DEPLOYING_COMMENT(sha),
  });

  // Trigger the workflow via PAT (app token doesn't have actions:write by default)
  const patOctokit = new Octokit({ auth: GITHUB_TOKEN });
  await patOctokit.actions.createWorkflowDispatch({
    owner: GH_REPO_OWNER!,
    repo: GH_REPO_NAME!,
    workflow_id: 'deploy-preview.yml',
    ref: 'main',
    inputs: {
      pr_number: String(prNumber),
      sha,
      comment_id: String(commentId),
    },
  });
}

const webhooks = new Webhooks({ secret: GH_WEBHOOK_SECRET! });

// Post initial comment when a PR is opened or reopened
webhooks.on(['pull_request.opened', 'pull_request.reopened'], async ({ payload }) => {
  const octokit = await getInstallationOctokit();
  await octokit.issues.createComment({
    owner: GH_REPO_OWNER!,
    repo: GH_REPO_NAME!,
    issue_number: payload.pull_request.number,
    body: INITIAL_COMMENT(payload.pull_request.number),
  });
});

// Watch for checkbox tick or 🚀 reaction on bot comments
webhooks.on('issue_comment.edited', async ({ payload }) => {
  const body = payload.comment.body ?? '';
  if (!body.includes('<!-- nexo-preview')) return;

  const prMatch = body.match(/<!-- nexo-preview pr:(\d+) -->/);
  if (!prMatch) return;

  const prNumber = Number(prMatch[1]);
  const checked = body.includes('[x] Deploy preview') || body.includes('[X] Deploy preview');
  if (!checked) return;

  // Get the PR's head SHA
  const octokit = await getInstallationOctokit();
  const { data: pr } = await octokit.pulls.get({
    owner: GH_REPO_OWNER!,
    repo: GH_REPO_NAME!,
    pull_number: prNumber,
  });

  await triggerDeploy(prNumber, pr.head.sha, payload.comment.id);
});

// Also support 🚀 reaction on a live-comment to redeploy
webhooks.on('pull_request_review_comment.created', async () => {
  // not needed — handled via issue_comment
});

const middleware = createNodeMiddleware(webhooks, { path: '/webhook' });

createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200).end('ok');
    return;
  }
  middleware(req, res);
}).listen(Number(PORT), () => {
  console.log(`Bot listening on port ${PORT}`);
});
