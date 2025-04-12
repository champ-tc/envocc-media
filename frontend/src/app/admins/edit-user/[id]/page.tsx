"use client";

import React, { useEffect, useState, useCallback } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import Link from 'next/link';
import AlertModal from "@/components/AlertModal";


interface UserData {
  title: string;
  firstName: string;
  lastName: string;
  tel: string;
  email: string;
  department: string;
  position: string;
  role: string;
}

const departmentOptions = [
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

function EditUser() {
  const { session, isLoading } = useAuthCheck("admin");
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [userData, setUserData] = useState<UserData>({
    title: "",
    firstName: "",
    lastName: "",
    tel: "",
    email: "",
    department: "",
    position: "",
    role: "",
  });

  const [loading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error" | null>(null);

  // ฟังก์ชันแสดงข้อความแจ้งเตือน
  const showAlert = (message: string, type: "success" | "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage(null);
      setAlertType(null);
    }, 3000);
  };

  // ฟังก์ชันดึงข้อมูลผู้ใช้
  const fetchUserData = useCallback(
    async (url: string, setData: (data: UserData) => void, errorMessage: string) => {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        setData(data);
      } catch {
        showAlert(errorMessage, "error");
      }
    },
    [session] // ✅ ระบุ dependencies เท่าที่จำเป็น
  );


  useEffect(() => {
    if (session) {
      fetchUserData(`/api/users/${id}`, setUserData, "ไม่สามารถดึงข้อมูลส่วนตัวได้");
    }
  }, [session, id, fetchUserData]); // ✅ warning หาย


  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ตรวจสอบและเพิ่มค่า position หากไม่มีในข้อมูล
    const updatedData = {
      ...userData,
      position: userData.position ?? "",  // ถ้าไม่มี position ให้ใส่เป็นค่าว่าง
    };

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        throw new Error("Error updating user");
      }

      showAlert("อัปเดตข้อมูลสำเร็จ!", "success");
      setTimeout(() => {
        router.push("/admins/user-management");
      }, 3000);
    } catch {
      showAlert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล", "error");
    }
  };





  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <TopBar />

        <div className="flex-1 flex items-start justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
            <h1 className="text-2xl font-bold mb-4">แก้ไขข้อมูลผู้ใช้งาน</h1>

            {alertMessage && (
              <AlertModal
                isOpen={!!alertMessage}
                message={alertMessage}
                type={alertType ?? "error"}
                iconSrc={alertType === "success" ? "/images/check.png" : "/images/close.png"}
              />
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                <div className="w-full">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">สิทธิ์ผู้ใช้งาน</label>
                  <select
                    id="role"
                    name="role"
                    value={userData.role}
                    onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9063d2] sm:text-sm"
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-5">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 col-span-5">ชื่อ - นามสกุล</label>
                <div className="w-full col-span-5 md:col-span-1">
                  <select
                    id="title"
                    name="title"
                    value={userData.title}
                    onChange={(e) => setUserData({ ...userData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
                    required
                  >
                    <option value="">คำนำหน้า</option>
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>
                <div className="w-full col-span-5 md:col-span-2">
                  <input
                    type="text"
                    maxLength={20}
                    id="firstName"
                    name="firstName"
                    value={userData.firstName}
                    onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
                    required
                  />
                </div>
                <div className="w-full col-span-5 md:col-span-2">
                  <input
                    type="text"
                    maxLength={20}
                    id="lastName"
                    name="lastName"
                    value={userData.lastName}
                    onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 mt-4 sm:grid-cols-2">
                <div className="w-full mt-2 col-span-2 md:col-span-1">
                  <label htmlFor="tel" className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                  <input
                    type="tel"
                    maxLength={10}
                    id="tel"
                    name="tel"
                    value={userData.tel}
                    onChange={(e) => setUserData({ ...userData, tel: e.target.value })}
                    pattern="[0-9]*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
                    required
                  />
                </div>
                <div className="w-full mt-2 col-span-2 md:col-span-1">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    maxLength={30}
                    id="email"
                    name="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
                    required
                  />
                </div>

                <div className="w-full mt-2 col-span-2 md:col-span-1">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">เลือกประเภทผู้ใช้</label>
                  <select
                    id="department"
                    name="department"
                    value={userData.department || ''}
                    onChange={(e) => {
                      setUserData({
                        ...userData,
                        department: e.target.value,
                        position: ['8', '10'].includes(e.target.value) ? '' : userData.position
                      });
                    }}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9063d2] sm:text-sm"
                    required
                  >
                    <option value="">เลือกประเภทผู้ใช้</option>
                    {departmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full mt-2 col-span-2 md:col-span-1">
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง/อาชีพ</label>
                  {['1', '2'].includes(userData.department) ? (
                    <select
                      id="position"
                      name="position"
                      value={userData.position || ''}
                      onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                      className="block w-full py-2 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9063d2] sm:text-sm"
                      required
                    >
                      <option value="">เลือกตำแหน่ง</option>
                      {positionOptions[userData.department]?.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : ['3', '4', '5', '6', '7', '9'].includes(userData.department) ? (
                    <input
                      type="text"
                      maxLength={30}
                      id="position"
                      name="position"
                      value={userData.position || ''}
                      onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9063d2]"
                      required
                    />
                  ) : (
                    <input
                      type="hidden"
                      id="position"
                      name="position"
                      value={userData.position || ''}
                    />
                  )}
                </div>

              </div>

              <div className="flex justify-center mt-6 gap-2">
                <button type="submit" className="bg-[#9063d2] hover:bg-[#8753d5] text-white px-4 py-2 rounded-xl transition">ยืนยัน</button>

                <Link href="/admins/user-management" className="bg-[#f3e5f5] hover:bg-[#8753d5] text-gray-700 px-4 py-2 rounded-xl transition">
                  ย้อนกลับ
                </Link>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditUser;
