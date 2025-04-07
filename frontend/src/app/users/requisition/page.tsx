"use client";

import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavbarUser";
import React, { useState, useEffect } from "react";

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

function UsersRequisition() {

    const { session, isLoading } = useAuthCheck("user");
    const router = useRouter();

    // const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    // const [searchQuery, setSearchQuery] = useState("");
    // const [filterType, setFilterType] = useState("");
    // const [currentPage, setCurrentPage] = useState(1);
    // const itemsPerPage = 10;

    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchRequisitions = async () => {
        try {
            const response = await fetch("/api/requisitions");
            const data = await response.json();

            if (Array.isArray(data)) {
                console.log(data);
                setRequisitions(data);
            } else {
                console.error("ข้อมูลที่ดึงมาไม่ใช่อาเรย์:", data);
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูล requisitions:", error);
        }
    };

    useEffect(() => {
        if (!isLoading) {
            fetchRequisitions();
        }
    }, [isLoading]);

    useEffect(() => {
        const fetchRequisitions = async () => {
            try {
                const response = await fetch("/api/requisitions");
                const data: Requisition[] = await response.json();
                setRequisitions(data);
            } catch (error) {
                console.error("Error fetching requisitions:", error);
            }
        };

        fetchRequisitions();
    }, [session, router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    const filteredRequisitions = Array.isArray(requisitions)
        ? requisitions.filter((item) => {
            const matchesSearch = item.requisition_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesType = filterType ? item.type.name === filterType : true;
            return matchesSearch && matchesType;
        })
        : [];



    const totalPages = Math.ceil(filteredRequisitions.length / itemsPerPage);
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
        <div className="min-h-screen bg-[#f3e5f5]">
            <Navbar />
            <div className="relative  flex flex-col items-center">
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

                        <div className="grid grid-cols-1 gap-8 mt-6 sm:grid-cols-2 lg:grid-cols-4">
                            {currentRequisitions.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 transition-transform transform hover:scale-105 flex flex-col"
                                >
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
                                        className="mt-auto bg-[#9063d2] text-white py-2 px-4 rounded-lg w-full transition-colors"
                                        onClick={() => router.push(`/users/requisition/${item.id}`)}
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
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50"
                                >
                                    ก่อนหน้า
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-[#9063d2] text-white" : "bg-gray-200 text-gray-600"} hover:bg-[#9063d2] hover:text-white transition`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default UsersRequisition;