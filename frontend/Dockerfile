FROM node:18

WORKDIR /app

# ✅ ติดตั้ง openssl และ mysql client
RUN apt-get update && apt-get install -y libssl-dev default-mysql-client

COPY package.json package-lock.json ./
RUN npm install

COPY . .

COPY ../.env .env

RUN find ./node_modules/.bin -type f -exec chmod +x {} \;

RUN npx prisma generate
RUN npm run build

COPY entrypoint.sh .
COPY wait-for-it.sh .
RUN chmod +x ./entrypoint.sh ./wait-for-it.sh

EXPOSE 3000

CMD ["./entrypoint.sh"]
