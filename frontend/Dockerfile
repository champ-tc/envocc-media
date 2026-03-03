# syntax=docker/dockerfile:1

############################################
# 1) deps: install node deps (reproducible)
############################################
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# security patches + minimal packages only
RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

############################################
# 2) build: prisma generate + next build
############################################
FROM node:20-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# generate prisma client (needs schema in repo)
RUN npx prisma generate

# build next
RUN npm run build

############################################
# 3) runner: minimal runtime
############################################
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# runtime needs mysql client only if entrypoint/wait-for-it uses it
RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# run as non-root
USER node

# copy only what is required to run
COPY --chown=node:node --from=build /app/package.json ./package.json
COPY --chown=node:node --from=build /app/package-lock.json ./package-lock.json
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/.next ./.next
COPY --chown=node:node --from=build /app/public ./public

# if you rely on next.config.* at runtime, uncomment:
# COPY --chown=node:node --from=build /app/next.config.* ./

COPY --chown=node:node entrypoint.sh ./entrypoint.sh
COPY --chown=node:node wait-for-it.sh ./wait-for-it.sh
RUN chmod +x ./entrypoint.sh ./wait-for-it.sh

EXPOSE 3000
CMD ["./entrypoint.sh"]