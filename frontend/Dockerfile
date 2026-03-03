# syntax=docker/dockerfile:1

############################################
# 1) deps: ติดตั้ง dependencies (เร็ว + cache ดี)
############################################
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# อัปเดตแพตช์ security + ติดตั้งเฉพาะที่จำเป็น (ไม่เอา recommends เพื่อลดแพ็กเกจพ่วง)
RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# ใช้ npm ci เพื่อ reproducible + ลดความเสี่ยง/ความต่างของแพ็กเกจ
RUN npm ci


############################################
# 2) build: สร้าง Prisma client + build Next
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

# ✅ ห้าม COPY ../.env เข้า image (เลี่ยงฝัง secrets)
# ให้ใช้ docker run -e ... หรือ docker compose env_file แทน

# Prisma generate ตอน build
RUN npx prisma generate

# build next
RUN npm run build


############################################
# 3) runner: runtime ที่เล็กและปลอดภัยกว่า
############################################
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# อัปเดตแพตช์ security ใน runtime ด้วย
RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# ใช้ user node (non-root) ลดความเสี่ยง
USER node

# คัดลอกเฉพาะสิ่งที่ต้องใช้รันจริง
COPY --chown=node:node --from=build /app/package.json ./package.json
COPY --chown=node:node --from=build /app/package-lock.json ./package-lock.json
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/.next ./.next
COPY --chown=node:node --from=build /app/public ./public
# ถ้าใช้ next.config.* runtime ให้ copy เพิ่มเอง
# COPY --chown=node:node --from=build /app/next.config.* ./

COPY --chown=node:node entrypoint.sh ./entrypoint.sh
COPY --chown=node:node wait-for-it.sh ./wait-for-it.sh
RUN chmod +x ./entrypoint.sh ./wait-for-it.sh

EXPOSE 3000
CMD ["./entrypoint.sh"]