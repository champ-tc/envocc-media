# คู่มือการตั้งค่าและเปิดใช้งานระบบ Media Envocc (Development vs Production)

เอกสารฉบับนี้สรุปประวัติการแก้ไขปัญหา Docker Compose ของระบบ และแนะนำขั้นตอน/จุดที่ต้องปรับแต่งเมื่อต้องการเปิดใช้งานระบบในโหมด **พัฒนา (Development)** เทียบกับโหมด **ใช้งานจริงบนเซิร์ฟเวอร์ (Production)** ให้ทำงานได้จริงอย่างสมบูรณ์

---

## 📌 ส่วนที่ 1: สรุปรายการแก้ไขปัญหา Docker Compose (ประวัติการปรับปรุงโค้ด)

ในการแก้ปัญหาคอนเทนเนอร์ไม่สามารถรันและบิลด์ได้ก่อนหน้านี้ ได้ทำการปรับปรุงโค้ดไปทั้งหมด 3 ไฟล์ดังนี้:

1. **`docker-compose.yml`**
   - **แก้ปัญหาโหลดตัวแปร `.env` ไม่เจอ:** ปรับเส้นทาง `env_file` ให้ชี้ไปที่ไฟล์ระดับรากโปรเจกต์ `./.env` และรองรับ `frontend/.env`
   - **แก้ปัญหาชื่อคอนเทนเนอร์ซ้ำ (Name Conflict):** ลบบรรทัด `container_name: ...` ออกจากทุกบริการ เพื่อให้ Docker Compose ตั้งชื่อนำหน้าตามโฟลเดอร์โปรเจกต์อัตโนมัติ (เช่น `envocc-media-frontend-1`) ป้องกันการชนกับคอนเทนเนอร์เก่าในเครื่อง
   - **แก้ปัญหาเครือข่ายซ้ำซ้อน (Ambiguous Network):** เพิ่มคุณสมบัติ `name: media_app_net` ในส่วน `networks.internal_net` เพื่อบังคับสร้างเครือข่ายเดียวที่ชัดเจน

2. **`nginx/nginx.conf`**
   - **แก้ตำแหน่ง Proxy:** เปลี่ยนคำสั่ง `proxy_pass http://nextjs-app:3000;` เป็น `proxy_pass http://frontend:3000;` เพื่อให้ตรงกับชื่อบริการ (Service Name) ของ Docker Compose DNS

3. **`frontend/Dockerfile`**
   - **แก้ปัญหาสคริปต์รันไม่ได้บน Linux (`exec: ./entrypoint.sh: not found`):** เพิ่มคำสั่ง `sed -i 's/\r$//'` ก่อนขั้นตอน `chmod +x` เพื่อลบตัวอักษรจบบรรทัดของ Windows (`CRLF` หรือ `\r`) ออกจากสคริปต์ `.sh` โดยอัตโนมัติทุกครั้งที่ทำการ Build Image

---

## 🛠️ ส่วนที่ 2: การเปิดใช้งานโหมด Development (สำหรับการพัฒนา / แก้ไขโค้ด)

ในโหมด Development แนะนำให้ **เปิดใช้งาน Frontend ภายนอก Docker** ด้วยคำสั่ง `npm run dev` เพื่อให้ได้ฟีเจอร์ **Hot Reload** (แก้โค้ดแล้วหน้าเว็บอัปเดตทันทีโดยไม่ต้องบิลด์ใหม่) และใช้ฐานข้อมูล MySQL จาก Docker Compose

### 1. จุดที่ต้องแก้ไขในไฟล์ `.env` (หรือ `frontend/.env`)
เปลี่ยนค่า URL ให้เป็น `http://localhost:3000` และเปลี่ยน Host ของฐานข้อมูลให้เป็น `localhost`:

```env
# 1. URL สำหรับ Next.js Auth และ API
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 2. การเชื่อมต่อฐานข้อมูล MySQL จากเครื่อง host ไปยัง Docker
DB_HOST=localhost
DB_PORT=3307
DB_USER=myuser
DB_PASSWORD=d970s2QQvn43Kb7
DB_NAME=media
DATABASE_URL="mysql://myuser:d970s2QQvn43Kb7@localhost:3307/media"

DB_ROOT_PASSWORD=dE6pSKXR5rlJ689
```

### 2. ขั้นตอนการสตาร์ตโหมด Development
1. **เปิดฐานข้อมูล MySQL ใน Docker:**
   ```powershell
   docker compose up -d db
   ```
2. **เปิดเซิร์ฟเวอร์ Next.js ในโหมด Dev:**
   ```powershell
   cd frontend
   npm run dev
   ```
3. **ช่องทางการเข้าใช้งาน:**
   - เว็บแอปพลิเคชัน Next.js: [http://localhost:3000](http://localhost:3000)

---

## 🚀 ส่วนที่ 3: การเปิดใช้งานโหมด Production (สำหรับใช้งานจริงบนเซิร์ฟเวอร์)

ในโหมด Production ระบบทุกส่วนรวมถึง Next.js และ Nginx จะทำงานอยู่ภายใน Docker Compose ทั้งหมด โดยหน้าเว็บจะถูกคอมไพล์เป็น Static & Optimized Production Build พร้อมเปิดใช้งาน HTTPS ผ่าน Nginx Reverse Proxy

### 1. จุดที่ต้องแก้ไขในไฟล์ `.env` (และ `frontend/.env`)
เปลี่ยน URL ให้เป็นชื่อโดเมนจริง และกำหนดฐานข้อมูลให้ใช้ MySQL container ใน Docker Compose ด้วย `DB_HOST=db`:

```env
# 1. โดเมนจริงของระบบ (ต้องขึ้นต้นด้วย https://)
NEXTAUTH_URL=https://media-envocc.ddc.moph.go.th
NEXT_PUBLIC_BASE_URL=https://media-envocc.ddc.moph.go.th

# 2. การเชื่อมต่อฐานข้อมูล MySQL ใน Docker Network
DB_HOST=db
DB_PORT=3306
DB_USER=myuser
DB_PASSWORD=d970s2QQvn43Kb7
DB_NAME=media
DATABASE_URL="mysql://myuser:d970s2QQvn43Kb7@db:3306/media"
DB_ROOT_PASSWORD=dE6pSKXR5rlJ689

# 3. คีย์ความปลอดภัยและ Token การแจ้งเตือน
NEXTAUTH_SECRET="8828ceab96dfc1b0e42bb423f9c3308c3b121a1336decfe9da1702bd4522f01c"
LINE_TOKEN="<ใส่รหัส_LINE_Notify_Token>"
LINE_GROUP_ID="<ใส่รหัส_LINE_Group_ID>"
SMTP_HOST="<smtp_ของหน่วยงาน>"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_STARTTLS="true"
SMTP_USER="<username_หรือ_email_สำหรับ_SMTP>"
SMTP_PASS="<password_สำหรับ_SMTP>"
SMTP_FROM="Media Envocc <noreply@example.go.th>"
```

### 2. ตรวจสอบใบรับรอง SSL (SSL Certificates)
ตรวจสอบให้แน่ใจว่าได้นำไฟล์ใบรับรองจริงมาวางไว้ในโฟลเดอร์ `nginx/ssl/` ให้ตรงกับชื่อที่ระบุไว้ใน `nginx/nginx.conf`:
- `star_ddc_moph_go_th_and_ca.crt`
- `star_ddc_moph_go_th.key`

### 3. ขั้นตอนการสตาร์ตโหมด Production
สั่งบิลด์และรันระบบพร้อมฐานข้อมูล:
```powershell
docker compose up -d --build
```

ถ้ามี container เก่าที่ถูกลบ service ออกจาก compose แล้ว เช่น `media-phpmyadmin-1` ให้ล้าง orphan ก่อน:
```powershell
docker compose -p media down --remove-orphans
docker compose down --remove-orphans
docker compose up -d --build
```

ตรวจสอบ Log การเปิดเซิร์ฟเวอร์ของ Next.js ในคอนเทนเนอร์:
```powershell
docker compose logs -f frontend
```

### 4. วิธีอัปเดตโค้ดขึ้น Production ในอนาคต
เมื่อมีการแก้ไขโค้ดใหม่และต้องการอัปเดตบนเซิร์ฟเวอร์ ให้บังคับสร้างอิมเมจใหม่เฉพาะ frontend ด้วยคำสั่ง:
```powershell
docker compose up -d --build --force-recreate frontend nginx db
```

---

## ⚠️ สรุปจุดเปรียบเทียบที่ต้องเช็คก่อนเปิดใช้งาน (ตารางเปรียบเทียบ)

| รายการตั้งค่า | โหมด Development | โหมด Production | เหตุผลที่ต้องต่างกัน |
| :--- | :--- | :--- | :--- |
| **`DB_HOST`** | `localhost` | `db` | โหมด Dev เราเรียกจากนอก Docker เข้าไปหา DB แต่โหมด Production คอนเทนเนอร์ frontend เรียกหาคอนเทนเนอร์ db โดยตรง |
| **`DATABASE_URL`** | `...localhost:3306...` | `...db:3306...` | ใช้สำหรับ Prisma ORM ในการเชื่อมต่อฐานข้อมูล |
| **`NEXTAUTH_URL`** | `http://localhost:3000` | `https://media-envocc.ddc.moph.go.th` | ระบบ NextAuth ต้องรู้ URL ที่แท้จริงในการ Redirect หลังล็อกอิน |
| **พอร์ตเข้าใช้งาน** | พอร์ต `3000` | พอร์ต `80` และ `443` | โหมด Dev เข้า Next.js ตรงๆ แต่โหมด Production ต้องผ่าน Nginx Proxy |
| **การเปลี่ยนโค้ด** | เซฟไฟล์แล้วอัปเดตทันที | ต้องรัน `docker compose build` ใหม่ | โหมด Production โค้ดจะถูกบรรจุใน Image ตายตัวเพื่อประสิทธิภาพสูงสุด |
