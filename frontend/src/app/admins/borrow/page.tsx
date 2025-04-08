"use client";

import React, { useState, useEffect } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import Image from 'next/image';

interface Borrow {
    id: number;
    borrow_name: string;
    type: {
        name: string;
    };
    quantity: number;
    reserved_quantity: number;
    borrow_images?: string;
    unit: string;
}

function AdminsBorrow() {
    const { session, isLoading } = useAuthCheck("admin");

    const [borrows, setBorrows] = useState<Borrow[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchBorrows = async () => {
            try {
                const response = await fetch(`/api/borrows?page=${currentPage}&limit=${itemsPerPage}`);
                const data = await response.json();

                if (data.items && Array.isArray(data.items)) {
                    setBorrows(data.items);
                    setTotalPages(data.totalPages);
                    setTotalRecords(data.totalRecords);
                } else {
                    console.error("API did not return expected data:", data);
                    setBorrows([]);
                    setTotalRecords(0);
                }
            } catch (error) {
                console.error("Error fetching borrows:", error);
                setBorrows([]);
                setTotalRecords(0);
            }
        };

        if (session) {
            fetchBorrows();
        }
    }, [session, currentPage]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }


    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
    const currentBorrows = borrows || [];

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
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-2">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">ยืม</h2>
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                            <input
                                type="text"
                                placeholder="ค้นหาจากชื่อ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-4 py-2 border rounded-md w-full md:w-1/2 mb-2 md:mb-0"
                            />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border rounded-md w-full md:w-1/4"
                            >
                                <option value="">ทั้งหมด</option>
                                {Array.isArray(borrows) &&
                                    Array.from(
                                        new Set(borrows.map((item) => item.type?.name))
                                    ).map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 gap-8 mt-6 sm:grid-cols-2 lg:grid-cols-4">
                            {currentBorrows.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white p-4 rounded-xl shadow-lg border transition-transform transform hover:scale-105 flex flex-col"
                                >
                                    {item.borrow_images ? (
                                        <Image
                                            src={`/borrows/${item.borrow_images}`}
                                            alt={item.borrow_name}
                                            width={24}
                                            height={24}
                                            className="w-full h-60 object-cover rounded-lg mb-4" // ใช้ Tailwind ได้ตามปกติ
                                        />
                                    ) : (
                                        <div className="w-full h-60 bg-gray-200 flex items-center justify-center rounded-lg mb-4">
                                            <span className="text-gray-600">ไม่มีรูปภาพ</span>
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                                        {item.borrow_name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-2">
                                        ประเภท: {item.type?.name || "ไม่มีประเภท"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        คงเหลือ:{" "}
                                        <span className="text-[#fb8124] font-bold">
                                            {item.quantity - (item.reserved_quantity || 0)} {item.unit}
                                        </span>
                                    </p>

                                    <button
                                        className="mt-auto bg-[#9063d2] text-white py-2 px-4 rounded-lg w-full transition-colors"
                                        onClick={() => {
                                            window.location.assign(`/admins/borrow/${item.id}`);
                                        }}
                                    >
                                        เลือก
                                    </button>
                                </div>
                            ))}
                        </div>



                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                รายการที่ {totalRecords === 0 ? 0 : startIndex + 1} ถึง {totalRecords === 0 ? 0 : endIndex} จาก {totalRecords} รายการ
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

export default AdminsBorrow;