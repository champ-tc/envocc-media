/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true, // ปิดการตรวจสอบ ESLint ระหว่าง build
    },
    images: {
        unoptimized: true, // ปิดการเพิ่มประสิทธิภาพของ Next.js (เมื่อใช้ <img>)
    },
};

export default nextConfig;