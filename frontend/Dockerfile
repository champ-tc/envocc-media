# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:22.23.2-alpine3.24

############################################
# 1) deps
############################################
FROM ${NODE_IMAGE} AS deps
WORKDIR /app

RUN apk upgrade --no-cache \
    && apk add --no-cache ca-certificates openssl

COPY package.json package-lock.json ./
# NextAuth 4 declares Nodemailer 7 as an optional peer for its Email provider.
# This app uses CredentialsProvider and imports the patched Nodemailer 9 directly.
RUN npm ci --legacy-peer-deps

############################################
# 2) build
############################################
FROM ${NODE_IMAGE} AS build
WORKDIR /app

RUN apk upgrade --no-cache \
    && apk add --no-cache ca-certificates openssl

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

RUN apk upgrade --no-cache \
    && apk add --no-cache ca-certificates openssl \
    && test "$(node --version)" = "v22.23.2"

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
