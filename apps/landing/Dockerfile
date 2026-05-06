FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/landing/package.json ./apps/landing/
RUN corepack enable && pnpm install --frozen-lockfile

COPY vite.shared.ts ./
COPY apps/landing ./apps/landing

ARG PUBLIC_FINANCE_URL=https://finance.krieger2501.de
RUN echo "PUBLIC_FINANCE_URL=$PUBLIC_FINANCE_URL" > apps/landing/.env
RUN pnpm --filter=@nexo/landing run build

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/apps/landing/build ./build
COPY --from=builder /app/apps/landing/package.json ./
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "build"]
