"use client";

import React, { useEffect, useState } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ===================== Types ===================== */
interface LogItem {
    id: number;
    requested_quantity: number;
    approved_quantity?: number;
    requisition_date: string;
    status: string;
    requested_groupid: string;
    requisition: { requisition_name: string };
    user: {
        title: string;
        firstName: string;
        lastName: string;
        department: string;           // รหัสหน่วยงานหลัก (ตรงกับ departmentOptions.value)
        subDepartment?: string;       // ถ้ามี (รหัสหน่วยงานย่อย/เขต)
        // บางระบบอาจใช้ชื่ออื่น เช่น position / officeCode / office_code
    };
}

/* ===================== Page ===================== */
function AdminsReports_requisition() {
    const { isLoading } = useAuthCheck("admin");

    const [logs, setLogs] = useState<LogItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;

    /* ---------- หน่วยงานหลัก ---------- */
    const departmentOptions = [
        { value: "", label: "เลือกประเภทผู้ใช้" },
        { value: "1", label: "สำนักงานสาธารณสุขจังหวัด" },
        { value: "2", label: "สำนักงานป้องกันควบคุมโรค" },
        { value: "3", label: "โรงพยาบาล" },
        { value: "4", label: "สถานประกอบการ" },
        { value: "5", label: "มหาวิทยาลัย" },
        { value: "6", label: "องค์กรอิสระ" },
        { value: "7", label: "เจ้าหน้าที่ภาครัฐ/รัฐวิสาหกิจ" },
        { value: "8", label: "เจ้าหน้าที่ EnvOcc" },
        { value: "9", label: "นักเรียน/นักศึกษา" },
        { value: "10", label: "ประชาชนทั่วไป" },

        // เพิ่มใหม่
        { value: "11", label: "สำนักงานสาธารณสุขอำเภอ (สสอ.)" },
        { value: "12", label: "รพ.สต. / ศูนย์สุขภาพชุมชน" },
        { value: "13", label: "กรมควบคุมโรค (ส่วนกลาง)" },
        { value: "14", label: "สำนักโรคจากการประกอบอาชีพและสิ่งแวดล้อม (EnvOcc)" },
        { value: "15", label: "กรมอนามัย" },
        { value: "16", label: "กรมสุขภาพจิต" },
        { value: "17", label: "กรมการแพทย์" },
        { value: "18", label: "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)" },
        { value: "19", label: "องค์กรปกครองส่วนท้องถิ่น (อบต./เทศบาล)" },
        { value: "20", label: "โรงพยาบาลเอกชน" },
        { value: "21", label: "คลินิก" },
        { value: "22", label: "ร้านยา" },
        { value: "23", label: "สถานศึกษา (โรงเรียน/วิทยาลัย)" },
        { value: "24", label: "หน่วยงานอาชีวอนามัย/ความปลอดภัย (จป./HS/OSH)" },
        { value: "25", label: "กรมโรงงานอุตสาหกรรม" },
        { value: "26", label: "กรมควบคุมมลพิษ (คพ.)" },
        { value: "27", label: "กระทรวงแรงงาน/ประกันสังคม/กสร." },
        { value: "28", label: "สำนักงานคณะกรรมการการอาชีวศึกษา (อศจ.)" },
        { value: "29", label: "หน่วยงานวิชาการ/สถาบันวิจัย" },
        { value: "30", label: "อื่น ๆ" },
    ] as const;

    /* ---------- หน่วยงานย่อย (map กับ departmentOptions.value) ---------- */
    const positionOptions: Record<string, { value: string; label: string }[]> = {
        // 1) สสจ. — จังหวัด
        "1": [
            { value: "10", label: "กรุงเทพมหานคร" },
            { value: "11", label: "สมุทรปราการ" },
            { value: "12", label: "นนทบุรี" },
            { value: "13", label: "ปทุมธานี" },
            { value: "14", label: "พระนครศรีอยุธยา" },
            { value: "15", label: "อ่างทอง" },
            { value: "16", label: "ลพบุรี" },
            { value: "17", label: "สิงห์บุรี" },
            { value: "18", label: "ชัยนาท" },
            { value: "19", label: "สระบุรี" },
            { value: "20", label: "ชลบุรี" },
            { value: "21", label: "ระยอง" },
            { value: "22", label: "จันทบุรี" },
            { value: "23", label: "ตราด" },
            { value: "24", label: "ฉะเชิงเทรา" },
            { value: "25", label: "ปราจีนบุรี" },
            { value: "26", label: "นครนายก" },
            { value: "27", label: "สระแก้ว" },
            { value: "30", label: "นครราชสีมา" },
            { value: "31", label: "บุรีรัมย์" },
            { value: "32", label: "สุรินทร์" },
            { value: "33", label: "ศรีสะเกษ" },
            { value: "34", label: "อุบลราชธานี" },
            { value: "35", label: "ยโสธร" },
            { value: "36", label: "ชัยภูมิ" },
            { value: "37", label: "อำนาจเจริญ" },
            { value: "38", label: "บึงกาฬ" },
            { value: "39", label: "หนองบัวลำภู" },
            { value: "40", label: "ขอนแก่น" },
            { value: "41", label: "อุดรธานี" },
            { value: "42", label: "เลย" },
            { value: "43", label: "หนองคาย" },
            { value: "44", label: "มหาสารคาม" },
            { value: "45", label: "ร้อยเอ็ด" },
            { value: "46", label: "กาฬสินธุ์" },
            { value: "47", label: "สกลนคร" },
            { value: "48", label: "นครพนม" },
            { value: "49", label: "มุกดาหาร" },
            { value: "50", label: "เชียงใหม่" },
            { value: "51", label: "ลำพูน" },
            { value: "52", label: "ลำปาง" },
            { value: "53", label: "อุตรดิตถ์" },
            { value: "54", label: "แพร่" },
            { value: "55", label: "น่าน" },
            { value: "56", label: "พะเยา" },
            { value: "57", label: "เชียงราย" },
            { value: "58", label: "แม่ฮ่องสอน" },
            { value: "60", label: "นครสวรรค์" },
            { value: "61", label: "อุทัยธานี" },
            { value: "62", label: "กำแพงเพชร" },
            { value: "63", label: "ตาก" },
            { value: "64", label: "สุโขทัย" },
            { value: "65", label: "พิษณุโลก" },
            { value: "66", label: "พิจิตร" },
            { value: "67", label: "เพชรบูรณ์" },
            { value: "70", label: "ราชบุรี" },
            { value: "71", label: "กาญจนบุรี" },
            { value: "72", label: "สุพรรณบุรี" },
            { value: "73", label: "นครปฐม" },
            { value: "74", label: "สมุทรสาคร" },
            { value: "75", label: "สมุทรสงคราม" },
            { value: "76", label: "เพชรบุรี" },
            { value: "77", label: "ประจวบคีรีขันธ์" },
            { value: "80", label: "นครศรีธรรมราช" },
            { value: "81", label: "กระบี่" },
            { value: "82", label: "พังงา" },
            { value: "83", label: "ภูเก็ต" },
            { value: "84", label: "สุราษฎร์ธานี" },
            { value: "85", label: "ระนอง" },
            { value: "86", label: "ชุมพร" },
            { value: "90", label: "สงขลา" },
            { value: "91", label: "สตูล" },
            { value: "92", label: "ตรัง" },
            { value: "93", label: "พัทลุง" },
            { value: "94", label: "ปัตตานี" },
            { value: "95", label: "ยะลา" },
            { value: "96", label: "นราธิวาส" },
        ],

        // 2) สำนักงานป้องกันควบคุมโรค — เขต
        "2": [
            { value: "1", label: "สำนักงานป้องกันควบคุมโรคที่ 1 เชียงใหม่" },
            { value: "2", label: "สำนักงานป้องกันควบคุมโรคที่ 2 พิษณุโลก" },
            { value: "3", label: "สำนักงานป้องกันควบคุมโรคที่ 3 นครสวรรค์" },
            { value: "4", label: "สำนักงานป้องกันควบคุมโรคที่ 4 สระบุรี" },
            { value: "5", label: "สำนักงานป้องกันควบคุมโรคที่ 5 ราชบุรี" },
            { value: "6", label: "สำนักงานป้องกันควบคุมโรคที่ 6 ชลบุรี" },
            { value: "7", label: "สำนักงานป้องกันควบคุมโรคที่ 7 ขอนแก่น" },
            { value: "8", label: "สำนักงานป้องกันควบคุมโรคที่ 8 อุดรธานี" },
            { value: "9", label: "สำนักงานป้องกันควบคุมโรคที่ 9 นครราชสีมา" },
            { value: "10", label: "สำนักงานป้องกันควบคุมโรคที่ 10 อุบลราชธานี" },
            { value: "11", label: "สำนักงานป้องกันควบคุมโรคที่ 11 นครศรีธรรมราช" },
            { value: "12", label: "สำนักงานป้องกันควบคุมโรคที่ 12 สงขลา" },
            { value: "13", label: "สถาบันป้องกันควบคุมโรคเขตเมือง" },
        ],
    };

    /* ---------- สถานะ ---------- */
    const statusOptions = [
        { key: "all", label: "ทั้งหมด" },
        { key: "Pending", label: "รอพิจารณา" },
        { key: "Approved", label: "อนุมัติ" },
        { key: "NotApproved", label: "ไม่อนุมัติ" },
    ] as const;

    /* ---------- Helpers: type-safe (no any) ---------- */
    const readStr = (
        o: Partial<Record<string, unknown>>,
        k: string
    ): string | undefined => {
        const v = o[k];
        return typeof v === "string" && v.trim() !== "" ? v : undefined;
    };

    type UserPossibleSubs =
        LogItem["user"] &
        Partial<
            Record<"subDepartment" | "position" | "officeCode" | "office_code", string>
        >;

    const getUserSubCode = (u: UserPossibleSubs): string | undefined => {
        return (
            readStr(u, "subDepartment") ??
            readStr(u, "position") ??
            readStr(u, "officeCode") ??
            readStr(u, "office_code") ??
            undefined
        );
    };

    const getDepartmentLabel = (value: string) =>
        departmentOptions.find((opt) => opt.value === value)?.label || "-";

    const getSubDepartmentLabel = (deptValue: string, subValue?: string) => {
        if (!subValue) return "-";
        const list = positionOptions[deptValue];
        return list?.find((o) => o.value === subValue)?.label || "-";
    };

    /* ---------- Group logs ---------- */
    const groupedLogs = logs.reduce((acc, log) => {
        const groupId = log.requested_groupid;
        if (!acc[groupId]) acc[groupId] = [];
        acc[groupId].push(log);
        return acc;
    }, {} as Record<string, LogItem[]>);

    const groupArray = Object.entries(groupedLogs);
    const totalPages = Math.ceil(groupArray.length / itemsPerPage);
    const currentGroups = groupArray.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/report_requisition`, { cache: "no-store" });
                const json = await res.json();
                setLogs(json.items || []);
            } catch (err) {
                console.error("Failed to fetch requisition logs:", err);
                setLogs([]);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    /* ---------- Export Excel (มีคอลัมน์หน่วยงานย่อย/เขต) ---------- */
    const exportToExcel = () => {
        const dataForExcel = groupArray.map(([, groupLogs], index) => {
            const firstLog = groupLogs[0];

            const itemMap = new Map<string, { requested: number; approved: number }>();
            groupLogs.forEach((log) => {
                const name = log.requisition.requisition_name;
                const requested = log.requested_quantity;
                const approved = log.approved_quantity ?? 0;
                if (!itemMap.has(name)) itemMap.set(name, { requested: 0, approved: 0 });
                const current = itemMap.get(name)!;
                itemMap.set(name, {
                    requested: current.requested + requested,
                    approved: current.approved + approved,
                });
            });

            const requisitionText = Array.from(itemMap.entries())
                .map(
                    ([name, { requested, approved }]) =>
                        `${name} - ขอ ${requested} / อนุมัติ ${approved}`
                )
                .join("\n");

            const deptCode = firstLog.user.department;
            const subCode = getUserSubCode(firstLog.user);

            return {
                ลำดับ: index + 1,
                "ชื่อ - นามสกุล": [
                    ...new Set(
                        groupLogs.map(
                            (log) => `${log.user.title}${log.user.firstName} ${log.user.lastName}`
                        )
                    ),
                ].join(", "),
                หน่วยงาน: getDepartmentLabel(deptCode),
                "หน่วยงานย่อย/เขต": getSubDepartmentLabel(deptCode, subCode),
                "รายการที่เบิก": requisitionText,
                "วันที่เบิก": new Date(firstLog.requisition_date).toLocaleDateString("th-TH"),
                สถานะ:
                    statusOptions.find((s) => s.key === firstLog.status)?.label || "-",
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `รายงานการขอเบิก.xlsx`);
    };

    /* ---------- UI ---------- */
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-4 mt-4 lg:ml-52">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            รายงานการขอเบิก
                        </h2>

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-[#9063d2] hover:bg-[#8753d5] text-white rounded transition"
                            >
                                ส่งออก
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm">
                                <thead>
                                    <tr className="bg-[#9063d2] text-white">
                                        <th className="border px-4 py-2">ลำดับ</th>
                                        <th className="border px-4 py-2">ชื่อ - นามสกุล</th>
                                        <th className="border px-4 py-2">หน่วยงาน</th>
                                        <th className="border px-4 py-2">หน่วยงานย่อย/เขต</th>
                                        <th className="border px-4 py-2">รายการและจำนวนที่เบิก</th>
                                        <th className="border px-4 py-2">วันที่เบิก</th>
                                        <th className="border px-4 py-2">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentGroups.map(([groupId, groupLogs], index) => {
                                        const firstLog = groupLogs[0];
                                        const deptCode = firstLog.user.department;
                                        const subCode = getUserSubCode(firstLog.user);

                                        const itemMap = new Map<
                                            string,
                                            { requested: number; approved: number }
                                        >();
                                        groupLogs.forEach((log) => {
                                            const name = log.requisition.requisition_name;
                                            const requested = log.requested_quantity;
                                            const approved = log.approved_quantity ?? 0;
                                            if (!itemMap.has(name)) itemMap.set(name, { requested: 0, approved: 0 });
                                            const current = itemMap.get(name)!;
                                            itemMap.set(name, {
                                                requested: current.requested + requested,
                                                approved: current.approved + approved,
                                            });
                                        });

                                        return (
                                            <tr key={groupId} className="text-xs font-normal">
                                                <td className="border px-4 py-2">{startIndex + index + 1}</td>
                                                <td className="border px-4 py-2">
                                                    {[
                                                        ...new Set(
                                                            groupLogs.map(
                                                                (log) =>
                                                                    `${log.user.title}${log.user.firstName} ${log.user.lastName}`
                                                            )
                                                        ),
                                                    ].join(", ")}
                                                </td>
                                                <td className="border px-4 py-2">
                                                    {getDepartmentLabel(deptCode)}
                                                </td>
                                                <td className="border px-4 py-2">
                                                    {getSubDepartmentLabel(deptCode, subCode)}
                                                </td>
                                                <td className="border px-4 py-2 text-left">
                                                    {Array.from(itemMap.entries()).map(
                                                        ([name, { requested, approved }], idx) => (
                                                            <div key={idx}>
                                                                {name} - ขอ {requested} / อนุมัติ {approved}
                                                            </div>
                                                        )
                                                    )}
                                                </td>
                                                <td className="border px-4 py-2">
                                                    {new Date(firstLog.requisition_date).toLocaleDateString("th-TH")}
                                                </td>
                                                <td className="border px-4 py-2">
                                                    {statusOptions.find((s) => s.key === firstLog.status)?.label || "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                รายการที่ {groupArray.length === 0 ? 0 : startIndex + 1} ถึง{" "}
                                {Math.min(startIndex + itemsPerPage, groupArray.length)} จาก{" "}
                                {groupArray.length} รายการ
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
                                        className={`px-4 py-2 rounded-md ${currentPage === page
                                                ? "bg-[#9063d2] text-white"
                                                : "bg-gray-200 text-gray-600"
                                            } hover:bg-[#9063d2] hover:text-white transition`}
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

export default AdminsReports_requisition;
