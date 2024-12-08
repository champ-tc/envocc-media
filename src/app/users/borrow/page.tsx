"use client";


import Navbar from "@/components/NavbarUser";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useAuthCheck from "@/hooks/useAuthCheck";

interface Requisition {
    id: number;
    requisitions: string;
    requisition_name: string;
    unit: string;
    type: {
        name: string;
    };
    quantity: number;
    reserved_quantity: number;
    requisition_images?: string;
}

function UsersBorrow() {
    const { data: status } = useSession();
    const router = useRouter();
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [searchQuery, setSearchQuery] = useState(""); // State สำหรับการค้นหา
    const [filterType, setFilterType] = useState(""); // State สำหรับการกรองประเภท
    const [currentPage, setCurrentPage] = useState(1); // หน้าแรก
    const itemsPerPage = 10; // แสดงข้อมูล 4 รายการต่อหน้า

    const fetchRequisitions = async () => {
        try {
            const response = await fetch("/api/requisitions");
            const data = await response.json();

            // ตรวจสอบว่า data เป็นอาเรย์
            if (Array.isArray(data)) {
                console.log(data); // ดูข้อมูลที่ได้รับมา
                setRequisitions(data);
            } else {
                console.error("ข้อมูลที่ดึงมาไม่ใช่อาเรย์:", data);
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูล requisitions:", error);
        }
    };



    useEffect(() => {

        // Fetch requisitions data from API
        const fetchRequisitions = async () => {
            try {
                const response = await fetch("/api/requisitions");
                const data: Requisition[] = await response.json(); // ใช้ชนิดข้อมูลที่กำหนดไว้
                setRequisitions(data);
            } catch (error) {
                console.error("Error fetching requisitions:", error);
            }
        };

        fetchRequisitions();
    }, [status, router]);

    const filteredRequisitions = Array.isArray(requisitions)
        ? requisitions.filter((item) => {
            const matchesSearch = item.requisition_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesType = filterType ? item.type.name === filterType : true;
            return matchesSearch && matchesType;
        })
        : [];

        const { session, isLoading } = useAuthCheck("user");

        if (isLoading) {
            return <p>Loading...</p>;
        }
    
        if (!session) {
            return null;
        }

    const totalPages = Math.ceil(filteredRequisitions.length / itemsPerPage);

    // คำนวณดัชนีเริ่มต้นและสิ้นสุดของข้อมูลในหน้าปัจจุบัน
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequisitions = filteredRequisitions.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };


    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navbar */}
            <Navbar />

            {/* Main Content */}
            <div className="relative -mt-16 flex flex-col items-center">


            <div className="flex-1 flex items-start justify-center p-2">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">เบิกสื่อ</h2>
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                            <input
                                type="text"
                                placeholder="ค้นหาจากชื่อ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/2 mb-2 md:mb-0"
                            />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/4"
                            >
                                <option value="">ทั้งหมด</option>
                                {Array.isArray(requisitions) && requisitions.length > 0 ? (
                                    Array.from(new Set(requisitions.map((item) => item.type?.name))) // ใช้ optional chaining
                                        .map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))
                                ) : (
                                    <option disabled>ไม่พบข้อมูล</option>
                                )}
                            </select>


                        </div>
                        {/* แสดงรายการ */}


                        <div className="grid grid-cols-1 gap-8 mt-6 sm:grid-cols-2 lg:grid-cols-4">
                            {currentRequisitions.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 transition-transform transform hover:scale-105"
                                >
                                    {/* แสดงรูปภาพ */}
                                    {item.requisition_images ? (
                                        <img
                                            src={`/requisitions/${item.requisition_images}`}
                                            alt={item.requisition_name}
                                            className="w-full h-60 object-cover rounded-lg mb-4"
                                        />
                                    ) : (
                                        <div className="w-full h-60 bg-gray-200 flex items-center justify-center rounded-lg mb-4">
                                            <span className="text-gray-600">ไม่มีรูปภาพ</span>
                                        </div>
                                    )}
                                    {/* รายละเอียด */}
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">{item.requisition_name}</h3>
                                    <p className="text-sm text-gray-500 mb-1">ประเภท: {item.type?.name || 'ไม่มีประเภท'}</p>
                                    <p className="text-sm text-gray-500 mb-2">
                                        คงเหลือ:{" "}
                                        <span className="text-[#fb8124] font-bold">
                                            {item.quantity} {item.unit}
                                        </span>
                                    </p>

                                    <button
                                        className="mt-4 bg-[#fb8124] text-white py-2 px-4 rounded-lg w-full transition-colors"
                                        onClick={() => router.push(`/admins/requisition/${item.id}`)}
                                    >
                                        เลือก
                                    </button>
                                </div>
                            ))}
                        </div>



                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                            รายการที่ {startIndex + 1} ถึง {Math.min(endIndex, filteredRequisitions.length)} จาก {filteredRequisitions.length} รายการ
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#fb8124] hover:text-white transition disabled:opacity-50"
                                >
                                    ก่อนหน้า
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-[#fb8124] text-white" : "bg-gray-200 text-gray-600"} hover:bg-[#fb8124] hover:text-white transition`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#fb8124] hover:text-white transition disabled:opacity-50"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full px-4">

                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Turnover</h2>
                        <p className="text-4xl font-bold text-orange-500">$7,133.4</p>
                        <p className="text-gray-600">Estimated weekly profit</p>
                        <div className="mt-4">
                            <img src="/images/graph-example.png" alt="Graph" className="w-full h-32" />
                        </div>
                        <button className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow hover:bg-orange-600">
                            View All
                        </button>
                    </div>


                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">User Activity</h2>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 border-b">Name</th>
                                    <th className="px-4 py-2 border-b">Role</th>
                                    <th className="px-4 py-2 border-b">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-4 py-2">M. Jonathan</td>
                                    <td className="px-4 py-2">Business Analyst</td>
                                    <td className="px-4 py-2">Active</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">Jenny Mills</td>
                                    <td className="px-4 py-2">Software Engineer</td>
                                    <td className="px-4 py-2">Offline</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div> */}
            </div>
        </div>
    );
}

export default UsersBorrow;
