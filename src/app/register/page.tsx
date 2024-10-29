"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const saveToDatabase = async (userData) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "การบันทึกข้อมูลล้มเหลว");
      }

      setSuccessMessage("ลงทะเบียนสำเร็จ! กำลังไปที่หน้าเข้าสู่ระบบ...");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      console.error(error);
      setError(error.message || "มีข้อผิดพลาดในการบันทึกข้อมูล");
      setTimeout(() => setError(null), 5000); // แสดงข้อผิดพลาด 5 วิ แล้วลบ
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
  
    // ตรวจสอบข้อมูลพื้นฐาน
    if (!username || !password || !title || !firstName || !lastName || !phoneNumber || !email || !department || !position) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
  
    // ตรวจสอบรูปแบบอีเมล
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง");
      setEmail("");
      return;
    }
  
    // ตรวจสอบเบอร์โทรให้เป็นตัวเลขและมีความยาว 10 หลัก
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError("เบอร์โทรต้องเป็นตัวเลข 10 หลัก");
      setPhoneNumber("");
      return;
    }
  
    // ตรวจสอบความยาวของชื่อและนามสกุล
    if (firstName.length > 20 || lastName.length > 20) {
      setError("ชื่อและนามสกุลต้องไม่เกิน 20 ตัวอักษร");
      setFirstName("");
      setLastName("");
      return;
    }
  
    // ตรวจสอบความยาวของตำแหน่ง/อาชีพ
    if (position.length > 30) {
      setError("ตำแหน่ง/อาชีพต้องไม่เกิน 30 ตัวอักษร");
      setPosition("");
      return;
    }
  
    // ตรวจสอบความซ้ำของ username และ email ในระบบ
    try {
      const checkResponse = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, checkOnly: true }),
      });
  
      const checkResult = await checkResponse.json();
      if (!checkResponse.ok) {
        setError(checkResult.error);
        if (checkResult.error.includes("Username")) setUsername("");
        if (checkResult.error.includes("Email")) setEmail("");
        return;
      }
    } catch (error) {
      setError("มีข้อผิดพลาดในการตรวจสอบข้อมูล");
      return;
    }
  
    // เตรียมข้อมูลเพื่อบันทึกลงฐานข้อมูล
    const userData = {
      username,
      password,
      title,
      firstName,
      lastName,
      phoneNumber,
      email,
      department,
      position,
    };
  
    // เรียกใช้ฟังก์ชันบันทึกข้อมูล
    await saveToDatabase(userData);
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-pink-100 my-2 px-4">
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-lg w-full max-w-2xl">
          <h2 className="text-orange-600 text-3xl font-bold text-center mb-4">ลงทะเบียน</h2>
          
          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
              <p>{successMessage}</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-500 p-4 mb-4" role="alert">
              <p>{error}</p>
            </div>
          )}
          

          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
              <div className="w-full">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" maxLength={20} id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
              </div>
              <div className="w-full">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" maxLength={20} id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-5">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 col-span-5">ชื่อ - นามสกุล</label>
              <div className="w-full col-span-5 md:col-span-1">
                <select id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                  <option value="">คำนำหน้า</option>
                  <option value="Mr">นาย</option>
                  <option value="Ms">นางสาว</option>
                  <option value="Mrs">นาง</option>
                </select>
              </div>
              <div className="w-full col-span-5 md:col-span-2">
                <input type="text" maxLength={20} id="firstName" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
              </div>
              <div className="w-full col-span-5 md:col-span-2">
                <input type="text" maxLength={20} id="lastName" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-4 sm:grid-cols-2">
              <div className="w-full mt-2 col-span-2 md:col-span-1">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                <input type="tel" maxLength={10} id="phoneNumber" name="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} pattern="[0-9]*" className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
              </div>
              <div className="w-full mt-2 col-span-2 md:col-span-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" maxLength={30} id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
              </div>
              <div className="w-full mt-2 col-span-2 md:col-span-1">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">เลือกประเภทผู้ใช้</label>
                <select id="department" name="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 sm:text-sm" required>
                  <option value="">เลือกประเภทผู้ใช้</option>
                  <option value="1">เจ้าหน้าที่ envocc</option>
                  <option value="2">สคร.</option>
                  <option value="3">โรงพยาบาล</option>
                  <option value="4">สถานะประกอบการ</option>
                  <option value="5">มหาวิทยาลัย</option>
                  <option value="6">นักเรียน/นักศึกษา</option>
                  <option value="7">ประชาชนทั่วไป</option>
                </select>
              </div>
              <div className="w-full mt-2 col-span-2 md:col-span-1">
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง/อาชีพ</label>
                <input type="text" maxLength={30} id="position" name="position" value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required />
              </div>
            </div>

            <div className="flex justify-center mt-6 gap-2">
              <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition">ยืนยัน</button>
              <button type="button" className="bg-orange-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-orange-300 transition">ยกเลิก</button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default RegisterPage;
