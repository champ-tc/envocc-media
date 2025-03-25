"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from 'next/link';

const departmentOptions = [
  { value: '', label: 'เลือกประเภทผู้ใช้' },
  { value: '1', label: 'สำนักงานสาธารณสุขจังหวัด' },
  { value: '2', label: 'สำนักงานป้องกันควบคุมโรค' },
  { value: '3', label: 'โรงพยาบาล' },
  { value: '4', label: 'สถานประกอบการ' },
  { value: '5', label: 'มหาวิทยาลัย' },
  { value: '6', label: 'องค์กรอิสระ' },
  { value: '7', label: 'เจ้าหน้าที่ภาครัฐ/รัฐวิสาหกิจ' },
  { value: '8', label: 'เจ้าหน้าที่ EnvOcc' },
  { value: '9', label: 'นักเรียน/นักศึกษา' },
  { value: '10', label: 'ประชาชนทั่วไป' },
];

const positionOptions: Record<string, { value: string; label: string }[]> = {
  '1': [
    { value: '10', label: 'กรุงเทพมหานคร' },
    { value: '11', label: 'สมุทรปราการ' },
    { value: '12', label: 'นนทบุรี' },
    { value: '13', label: 'ปทุมธานี' },
    { value: '14', label: 'พระนครศรีอยุธยา' },
    { value: '15', label: 'อ่างทอง' },
    { value: '16', label: 'ลพบุรี' },
    { value: '17', label: 'สิงห์บุรี' },
    { value: '18', label: 'ชัยนาท' },
    { value: '19', label: 'สระบุรี' },
    { value: '20', label: 'ชลบุรี' },
    { value: '21', label: 'ระยอง' },
    { value: '22', label: 'จันทบุรี' },
    { value: '23', label: 'ตราด' },
    { value: '24', label: 'ฉะเชิงเทรา' },
    { value: '25', label: 'ปราจีนบุรี' },
    { value: '26', label: 'นครนายก' },
    { value: '27', label: 'สระแก้ว' },
    { value: '30', label: 'นครราชสีมา' },
    { value: '31', label: 'บุรีรัมย์' },
    { value: '32', label: 'สุรินทร์' },
    { value: '33', label: 'ศรีสะเกษ' },
    { value: '34', label: 'อุบลราชธานี' },
    { value: '35', label: 'ยโสธร' },
    { value: '36', label: 'ชัยภูมิ' },
    { value: '37', label: 'อำนาจเจริญ' },
    { value: '38', label: 'บึงกาฬ' },
    { value: '39', label: 'หนองบัวลำภู' },
    { value: '40', label: 'ขอนแก่น' },
    { value: '41', label: 'อุดรธานี' },
    { value: '42', label: 'เลย' },
    { value: '43', label: 'หนองคาย' },
    { value: '44', label: 'มหาสารคาม' },
    { value: '45', label: 'ร้อยเอ็ด' },
    { value: '46', label: 'กาฬสินธุ์' },
    { value: '47', label: 'สกลนคร' },
    { value: '48', label: 'นครพนม' },
    { value: '49', label: 'มุกดาหาร' },
    { value: '50', label: 'เชียงใหม่' },
    { value: '51', label: 'ลำพูน' },
    { value: '52', label: 'ลำปาง' },
    { value: '53', label: 'อุตรดิตถ์' },
    { value: '54', label: 'แพร่' },
    { value: '55', label: 'น่าน' },
    { value: '56', label: 'พะเยา' },
    { value: '57', label: 'เชียงราย' },
    { value: '58', label: 'แม่ฮ่องสอน' },
    { value: '60', label: 'นครสวรรค์' },
    { value: '61', label: 'อุทัยธานี' },
    { value: '62', label: 'กำแพงเพชร' },
    { value: '63', label: 'ตาก' },
    { value: '64', label: 'สุโขทัย' },
    { value: '65', label: 'พิษณุโลก' },
    { value: '66', label: 'พิจิตร' },
    { value: '67', label: 'เพชรบูรณ์' },
    { value: '70', label: 'ราชบุรี' },
    { value: '71', label: 'กาญจนบุรี' },
    { value: '72', label: 'สุพรรณบุรี' },
    { value: '73', label: 'นครปฐม' },
    { value: '74', label: 'สมุทรสาคร' },
    { value: '75', label: 'สมุทรสงคราม' },
    { value: '76', label: 'เพชรบุรี' },
    { value: '77', label: 'ประจวบคีรีขันธ์' },
    { value: '80', label: 'นครศรีธรรมราช' },
    { value: '81', label: 'กระบี่' },
    { value: '82', label: 'พังงา' },
    { value: '83', label: 'ภูเก็ต' },
    { value: '84', label: 'สุราษฎร์ธานี' },
    { value: '85', label: 'ระนอง' },
    { value: '86', label: 'ชุมพร' },
    { value: '90', label: 'สงขลา' },
    { value: '91', label: 'สตูล' },
    { value: '92', label: 'ตรัง' },
    { value: '93', label: 'พัทลุง' },
    { value: '94', label: 'ปัตตานี' },
    { value: '95', label: 'ยะลา' },
    { value: '96', label: 'นราธิวาส' },
  ],
  '2': [
    { value: '1', label: 'สำนักงานป้องกันควบคุมโรคที่ 1 เชียงใหม่' },
    { value: '2', label: 'สำนักงานป้องกันควบคุมโรคที่ 2 พิษณุโลก' },
    { value: '3', label: 'สำนักงานป้องกันควบคุมโรคที่ 3 นครสวรรค์' },
    { value: '4', label: 'สำนักงานป้องกันควบคุมโรคที่ 4 สระบุรี' },
    { value: '5', label: 'สำนักงานป้องกันควบคุมโรคที่ 5 ราชบุรี' },
    { value: '6', label: 'สำนักงานป้องกันควบคุมโรคที่ 6 ชลบุรี' },
    { value: '7', label: 'สำนักงานป้องกันควบคุมโรคที่ 7 ขอนแก่น' },
    { value: '8', label: 'สำนักงานป้องกันควบคุมโรคที่ 8 อุดรธานี' },
    { value: '9', label: 'สำนักงานป้องกันควบคุมโรคที่ 9 นครราชสีมา' },
    { value: '10', label: 'สำนักงานป้องกันควบคุมโรคที่ 10 อุบลราชธานี' },
    { value: '11', label: 'สำนักงานป้องกันควบคุมโรคที่ 11 นครศรีธรรมราช' },
    { value: '12', label: 'สำนักงานป้องกันควบคุมโรคที่ 12 สงขลา' },
    { value: '13', label: 'สถาบันป้องกันควบคุมโรคเขตเมือง' },
  ],
};

function RegisterPage() {
  const router = useRouter();

  // State สำหรับจัดการข้อมูลฟิลด์
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartment(e.target.value);
    setPosition(''); // Reset position when department changes
  };

  // การส่งข้อมูลไปยัง Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);



    // การตรวจสอบข้อมูล
    if (!username || !password || !title || !firstName || !lastName || !phoneNumber || !email || !department) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัว และประกอบด้วยตัวอักษรใหญ่ เล็ก และตัวเลข");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง");
      setEmail("");
      return;
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      setError("เบอร์โทรต้องเป็นตัวเลข 10 หลัก");
      setPhoneNumber("");
      return;
    }

    if (firstName.length > 20 || lastName.length > 20) {
      setError("ชื่อและนามสกุลต้องไม่เกิน 20 ตัวอักษร");
      setFirstName("");
      setLastName("");
      return;
    }

    if (position.length > 30) {
      setError("หน่วยงานต้องไม่เกิน 30 ตัวอักษร");
      setPosition("");
      return;
    }

    try {

      const checkResponse = await axios.post("/api/register", {
        username,
        email,
        checkOnly: true,
      });

      if (checkResponse.status === 400) {
        setError(checkResponse.data.error);
        return;
      }

      // ส่งข้อมูลไปยัง Backend ผ่าน Axios
      const response = await axios.post("/api/register", {
        username,
        email,
        password,
        title,
        firstName,
        lastName,
        phoneNumber,
        department,
        position,
      });


      if (response.status === 201) {
        setSuccessMessage("ลงทะเบียนสำเร็จ! กำลังไปที่หน้าเข้าสู่ระบบ...");
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        setError(error.response.data.error); // แสดงข้อความ Error สำหรับผู้ใช้
      } else {
        setError("เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่ภายหลัง"); // ข้อความทั่วไป
      }
    }
  };


  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-orange-500/10 px-2">
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-lg w-full max-w-2xl">
          <h2 className="text-orange-500 text-3xl font-bold text-center mb-4">ลงทะเบียน</h2>

          {successMessage && (
            <div className="bg-green-50 text-green-500 p-6 mb-10 text-sm rounded-2xl" role="alert">
              <span>&#10004; </span>
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-500 p-6 mb-10 text-sm rounded-2xl" role="alert">
              <span>&#10006; </span>
              <span>{error}</span>
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

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    maxLength={20}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                    required
                  />
                  <img
                    src={showPassword ? '/images/hide.png' : '/images/eye.png'}
                    alt="toggle password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-5 h-5 absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer"
                  />
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  ต้องมีความยาวอย่างน้อย 8 ตัว A-Z, a-z และตัวเลข
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-5">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 col-span-5">ชื่อ - นามสกุล</label>
              <div className="w-full col-span-5 md:col-span-1">
                <select id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                  <option value="">คำนำหน้า</option>
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
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
                <select
                  id="department"
                  name="department"
                  value={department}
                  onChange={handleDepartmentChange}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 sm:text-sm"
                  required
                >
                  {departmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {['1', '2'].includes(department) ? (
                <div className="w-full mt-2 col-span-2 md:col-span-1">
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">หน่วยงาน</label>
                  <select
                    id="position"
                    name="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">เลือกตำแหน่ง</option>
                    {positionOptions[department]?.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              ) : ['3', '4', '5', '6', '7', '9'].includes(department) ? (
                <div className="w-full mt-2 col-span-2 md:col-span-1">
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">หน่วยงาน</label>
                  <input
                    type="text"
                    maxLength={30}
                    id="position"
                    name="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              ) : null}
            </div>

            <div className="flex justify-center mt-6 gap-2">
              <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition">ยืนยัน</button>
              <Link href="/" className="bg-orange-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-orange-300 transition">
                ย้อนกลับ
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;
