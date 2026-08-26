# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:22.23.2-bookworm-slim

############################################
# 1) deps
############################################
FROM ${NODE_IMAGE} AS deps
WORKDIR /app

RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

############################################
# 2) build
############################################
FROM ${NODE_IMAGE} AS build
WORKDIR /app

RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

############################################
# 3) runner
############################################
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    default-mysql-client \
    && test "$(node --version)" = "v22.23.2" \
    && rm -rf /var/lib/apt/lists/*

# ไม่ COPY .env เข้า image
# ใช้ env_file หรือ environment จาก docker compose

COPY --chown=node:node --from=build /app/package.json ./package.json
COPY --chown=node:node --from=build /app/package-lock.json ./package-lock.json
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/.next ./.next
COPY --chown=node:node --from=build /app/public ./public
COPY --chown=node:node --from=build /app/prisma ./prisma

COPY --chown=node:node entrypoint.sh ./entrypoint.sh
COPY --chown=node:node wait-for-it.sh ./wait-for-it.sh

RUN sed -i 's/\r$//' ./entrypoint.sh ./wait-for-it.sh \
    && chmod +x ./entrypoint.sh ./wait-for-it.sh \
    && mkdir -p /app/fileuploads /app/fileborrows /app/filerequisitions \
    && chown -R node:node /app/fileuploads /app/fileborrows /app/filerequisitions

USER node

EXPOSE 3000
CMD ["./entrypoint.sh"]
