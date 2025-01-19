# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# คัดลอกไฟล์ .env จาก root
COPY ../.env .env

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
