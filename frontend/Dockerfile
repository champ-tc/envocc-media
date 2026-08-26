# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:22.23.2-trixie-slim
ARG FIXED_OPENSSL_VERSION=3.5.7-1~deb13u2
ARG FIXED_LIBCAP2_VERSION=1:2.75-10+deb13u1
ARG FIXED_UTIL_LINUX_VERSION=2.41.5-0+deb13u1
ARG FIXED_XZ_VERSION=5.8.1-1+deb13u1

############################################
# 1) deps
############################################
FROM ${NODE_IMAGE} AS deps
ARG FIXED_OPENSSL_VERSION
ARG FIXED_LIBCAP2_VERSION
ARG FIXED_UTIL_LINUX_VERSION
ARG FIXED_XZ_VERSION
WORKDIR /app

RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libssl3t64)" ge "$FIXED_OPENSSL_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' openssl)" ge "$FIXED_OPENSSL_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' openssl-provider-legacy)" ge "$FIXED_OPENSSL_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libcap2)" ge "$FIXED_LIBCAP2_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libblkid1)" ge "$FIXED_UTIL_LINUX_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' liblastlog2-2)" ge "$FIXED_UTIL_LINUX_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' liblzma5)" ge "$FIXED_XZ_VERSION" \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

############################################
# 2) build
############################################
FROM ${NODE_IMAGE} AS build
ARG FIXED_OPENSSL_VERSION
ARG FIXED_LIBCAP2_VERSION
ARG FIXED_UTIL_LINUX_VERSION
ARG FIXED_XZ_VERSION
WORKDIR /app

RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libssl3t64)" ge "$FIXED_OPENSSL_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' openssl)" ge "$FIXED_OPENSSL_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' openssl-provider-legacy)" ge "$FIXED_OPENSSL_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libcap2)" ge "$FIXED_LIBCAP2_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libblkid1)" ge "$FIXED_UTIL_LINUX_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' liblastlog2-2)" ge "$FIXED_UTIL_LINUX_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' liblzma5)" ge "$FIXED_XZ_VERSION" \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

############################################
# 3) runner
############################################
FROM ${NODE_IMAGE} AS runner
ARG FIXED_OPENSSL_VERSION
ARG FIXED_LIBCAP2_VERSION
ARG FIXED_UTIL_LINUX_VERSION
ARG FIXED_XZ_VERSION
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    default-mysql-client \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libssl3t64)" ge "$FIXED_OPENSSL_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' openssl)" ge "$FIXED_OPENSSL_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' openssl-provider-legacy)" ge "$FIXED_OPENSSL_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libcap2)" ge "$FIXED_LIBCAP2_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libblkid1)" ge "$FIXED_UTIL_LINUX_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' liblastlog2-2)" ge "$FIXED_UTIL_LINUX_VERSION" \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' liblzma5)" ge "$FIXED_XZ_VERSION" \
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
