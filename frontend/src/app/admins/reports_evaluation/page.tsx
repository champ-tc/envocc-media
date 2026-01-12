"use client";

import React, { useState, useEffect } from "react";
import useAuthCheck from '@/hooks/useAuthCheck';
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface EvaluationItem {
    id: number;
    actionType: string;
    satisfaction: number;
    convenience: number;
    reuseIntention: string;
    recommend: string;
    suggestion: string | null;
    createdAt: string;
    user: {
        title: string;
        firstName: string;
        lastName: string;
        department: string;
    };
}

function AdminsReports_Evaluation() {
    const { isLoading } = useAuthCheck("admin");

    const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;

    // ... (ส่วน departmentOptions และ Helper functions อื่นๆ เหมือนเดิม) ...
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

    const getDepartmentLabel = (value: string) => departmentOptions.find((opt) => opt.value === value)?.label || "-";

    const getActionTypeLabel = (type: string) => {
        if (type === "requisition") return "การเบิก";
        if (type === "borrow") return "การยืม";
        return type;
    };

    const getReuseLabel = (val: string) => {
        const map: Record<string, string> = {
            "definitely": "กลับมาแน่นอน", "likely": "อาจจะกลับมา", "unsure": "ไม่แน่ใจ", "no": "ไม่กลับมา",
            "sure": "กลับมาแน่นอน", "maybe": "ไม่แน่ใจ"
        };
        return map[val] || val;
    };

    const getRecommendLabel = (val: string) => {
        const map: Record<string, string> = { "yes": "แนะนำ", "no": "ไม่แนะนำ" };
        return map[val] || val;
    };

    // ✅ ฟังก์ชันช่วยจัดรูปแบบวันที่ (เพิ่มใหม่)
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("th-TH", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Pagination
    const totalPages = Math.ceil(evaluations.length / itemsPerPage);
    const currentItems = evaluations.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/report_evaluation`);
                const json = await res.json();
                setEvaluations(json.items || []);
            } catch (err) {
                console.error("Failed to fetch evaluations:", err);
                setEvaluations([]);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><p>กำลังโหลด...</p></div>;
    }

    // Export Excel
    const exportToExcel = () => {
        const dataForExcel = evaluations.map((item, index) => ({
            ลำดับ: index + 1,
            "วันที่ประเมิน": formatDate(item.createdAt), // ✅ ใช้วันที่แบบเต็ม
            "ชื่อ - นามสกุล": `${item.user.title}${item.user.firstName} ${item.user.lastName}`,
            หน่วยงาน: getDepartmentLabel(item.user.department),
            "ประเภทรายการ": getActionTypeLabel(item.actionType),
            "ความพึงพอใจ (เต็ม 5)": item.satisfaction,
            "ความสะดวก (เต็ม 5)": item.convenience,
            "กลับมาใช้ซ้ำ": getReuseLabel(item.reuseIntention),
            "แนะนำต่อ": getRecommendLabel(item.recommend),
            "ข้อเสนอแนะ": item.suggestion || "-"
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "EvaluationReport");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `รายงานการประเมินผล.xlsx`);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-4 mt-4 lg:ml-52">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">รายงานการประเมินผลความพึงพอใจ</h2>

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-[#9063d2] hover:bg-[#8753d5] text-white rounded transition"
                            >
                                ส่งออก Excel
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                                <thead>
                                    <tr className="bg-[#9063d2] text-white text-center">
                                        <th className="border px-2 py-2 w-12">ลำดับ</th>
                                        <th className="border px-4 py-2">วันที่</th>
                                        <th className="border px-4 py-2">ชื่อ - นามสกุล</th>
                                        {/* ... หัวตารางอื่นๆ ... */}
                                        <th className="border px-4 py-2">หน่วยงาน</th>
                                        <th className="border px-2 py-2">ประเภท</th>
                                        <th className="border px-2 py-2">พอใจ</th>
                                        <th className="border px-2 py-2">สะดวก</th>
                                        <th className="border px-2 py-2">ใช้ซ้ำ</th>
                                        <th className="border px-2 py-2">แนะนำ</th>
                                        <th className="border px-4 py-2 w-1/5">ข้อเสนอแนะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length > 0 ? (
                                        currentItems.map((item, index) => (
                                            <tr key={item.id} className="text-xs font-normal hover:bg-gray-50 text-center">
                                                <td className="border px-2 py-2">{startIndex + index + 1}</td>
                                                <td className="border px-2 py-2 text-left whitespace-nowrap">
                                                    {formatDate(item.createdAt)} {/* ✅ ใช้วันที่แบบเต็ม */}
                                                </td>
                                                <td className="border px-2 py-2 text-left">
                                                    {`${item.user.title}${item.user.firstName} ${item.user.lastName}`}
                                                </td>
                                                {/* ... ข้อมูลอื่นๆ เหมือนเดิม ... */}
                                                <td className="border px-2 py-2 text-left">{getDepartmentLabel(item.user.department)}</td>
                                                <td className="border px-2 py-2">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] ${item.actionType === 'requisition' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {getActionTypeLabel(item.actionType)}
                                                    </span>
                                                </td>
                                                <td className="border px-2 py-2">{item.satisfaction}</td>
                                                <td className="border px-2 py-2">{item.convenience}</td>
                                                <td className="border px-2 py-2">{getReuseLabel(item.reuseIntention)}</td>
                                                <td className="border px-2 py-2">{getRecommendLabel(item.recommend)}</td>
                                                <td className="border px-2 py-2 text-left text-gray-600 break-words">{item.suggestion || "-"}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={10} className="text-center py-4 text-gray-500">ไม่มีข้อมูลการประเมิน</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Section (เหมือนเดิม) */}
                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                รายการที่ {evaluations.length === 0 ? 0 : startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, evaluations.length)} จาก {evaluations.length} รายการ
                            </span>
                            <div className="flex space-x-2">
                                <button onClick={goToPreviousPage} disabled={currentPage === 1} className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50">ก่อนหน้า</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button key={page} onClick={() => handlePageChange(page)} className={`px-4 py-2 rounded-md ${currentPage === page ? "bg-[#9063d2] text-white" : "bg-gray-200 text-gray-600"} hover:bg-[#9063d2] hover:text-white transition`}>{page}</button>
                                ))}
                                <button onClick={goToNextPage} disabled={currentPage === totalPages} className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50">ถัดไป</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminsReports_Evaluation;