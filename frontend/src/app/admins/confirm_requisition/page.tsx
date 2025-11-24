"use client";

import React, { useState, useEffect, useMemo } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import axios from "axios";
import AlertModal from "@/components/AlertModal";
import ConfirmEditModal from "@/components/ConfirmEditModal";

/* ===================== ตัวเลือกหน่วยงาน/ตำแหน่ง (mapping) ===================== */
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
];

const positionOptions: Record<string, { value: string; label: string }[]> = {
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

/* ===== ฟังก์ชันแปลงรหัส -> ชื่อหน่วยงาน ===== */
const DEPT_MAP = new Map(departmentOptions.map((o) => [o.value, o.label]));
const POS_MAP: Record<string, Map<string, string>> = Object.fromEntries(
    Object.entries(positionOptions).map(([k, arr]) => [k, new Map(arr.map((o) => [o.value, o.label]))])
);

/** แสดงชื่อหน่วยงานจาก department (และ position ถ้ามี) */
function getDepartmentDisplay(deptCode?: string | null, posCode?: string | null): string {
    if (!deptCode) return "—";
    const deptLabel = DEPT_MAP.get(deptCode) ?? "—";
    const posName = posCode ? POS_MAP[deptCode]?.get(posCode) : undefined;

    // กติกา:
    // dept=1 สสจ. => "สำนักงานสาธารณสุขจังหวัด{จังหวัด}"
    if (deptCode === "1" && posName) return `${deptLabel}${posName}`;
    // dept=2 สคร. => ใช้ชื่อสคร.จาก pos โดยตรงถ้ามี
    if (deptCode === "2" && posName) return posName;

    // กรณีอื่น ๆ แสดงชื่อประเภทหลัก
    return deptLabel;
}

/* ===================== Types ===================== */
type StatusKey = "all" | "Pending" | "Approved" | "NotApproved";

interface Log {
    id: number;
    requisition: { requisition_name: string };
    requested_quantity: number;
    approved_quantity: number;
    reason?: { reason_name: string };
    customUsageReason?: string;
}

interface Group {
    requested_groupid: string;
    status: string;
    logs: Log[];
    user?: {
        title: string;
        firstName: string;
        lastName: string;
        department?: string; // เก็บรหัส เช่น "1" | "2" | ...
        position?: string;   // เก็บรหัสย่อย เช่น รหัสจังหวัด/สคร.
    };
    reason?: { id: number; reason_name: string };
    customUsageReason?: string;
    delivery_address?: string;
}

interface ApprovedGroup extends Group { logs: Log[] }
interface PendingGroup extends Group { logs: Log[] }

/* ===================== Filters ===================== */
const FILTERS: ReadonlyArray<{ key: StatusKey; label: string }> = [
    { key: "all", label: "ทั้งหมด" },
    { key: "Pending", label: "รอพิจารณา" },
    { key: "Approved", label: "อนุมัติ" },
    { key: "NotApproved", label: "ไม่อนุมัติ" },
];

/* ===================== Page Component ===================== */
function ConfirmRequisition() {
    const { isLoading } = useAuthCheck("admin");

    const [statusFilter, setStatusFilter] = useState<StatusKey>("all");
    const [selectedApprovedGroup, setSelectedApprovedGroup] = useState<ApprovedGroup | null>(null);
    const [selectedPendingGroup, setSelectedPendingGroup] = useState<PendingGroup | null>(null);

    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);

    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);

    const [pendingModalOpen, setPendingModalOpen] = useState(false);
    const [approvedModalOpen, setApprovedModalOpen] = useState(false);

    const [requisitionGroups, setRequisitionGroups] = useState<Group[]>([]);

    // 🔎 ค้นหา (ฝั่งหน้า)
    const [searchTerm, setSearchTerm] = useState("");

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    useEffect(() => { setCurrentPage(1); }, [statusFilter]);

    useEffect(() => {
        const fetchRequisitionLogs = async () => {
            try {
                const url =
                    statusFilter === "all"
                        ? `/api/requisition_log?page=${currentPage}&limit=${itemsPerPage}`
                        : `/api/requisition_log?page=${currentPage}&limit=${itemsPerPage}&status=${statusFilter}`;

                const response = await axios.get(url);

                if (response.status === 200 && response.data.items) {
                    setRequisitionGroups(response.data.items);
                    setTotalPages(response.data.totalPages);
                    setTotalItems(response.data.totalItems);

                    if (currentPage > response.data.totalPages && response.data.totalPages > 0) {
                        setCurrentPage(response.data.totalPages);
                    }
                }
            } catch (e) {
                console.log("Error fetching requisition logs:", e);
            }
        };

        fetchRequisitionLogs();
    }, [statusFilter, currentPage]);

    const startIndex = (currentPage - 1) * itemsPerPage;

    const handlePageChange = (page: number) => setCurrentPage(page);
    const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
    const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

    const getPageItems = (current: number, total: number, delta = 10) => {
        if (total <= 1) return [1];
        const left = Math.max(1, current - delta);
        const right = Math.min(total, current + delta);
        const pages: (number | string)[] = [];
        if (left > 1) { pages.push(1); if (left > 2) pages.push("…"); }
        for (let p = left; p <= right; p++) pages.push(p);
        if (right < total) { if (right < total - 1) pages.push("…"); pages.push(total); }
        return pages;
    };

    const statusMapping: Record<string, string> = {
        Pending: "รอพิจารณา",
        Approved: "อนุมัติ",
        NotApproved: "ไม่อนุมัติ",
    };

    const closeModal = () => {
        setSelectedPendingGroup(null);
        setPendingModalOpen(false);
        setSelectedApprovedGroup(null);
        setApprovedModalOpen(false);
    };

    const openModal = async (group: Group, type: "pending" | "approved") => {
        try {
            const response = await fetch(`/api/requisition_log?groupid=${group.requested_groupid}`);
            if (!response.ok) throw new Error("Fetch failed");
            const data = await response.json().catch(() => null);

            if (!Array.isArray(data.items)) {
                console.error("Unexpected response format:", data);
                return;
            }

            const logs = data.items.map((log: Log) => ({
                ...log,
                approved_quantity: log.approved_quantity ?? 0,
            }));

            if (type === "pending") {
                setSelectedPendingGroup({ ...group, logs });
                setPendingModalOpen(true);
            } else {
                setSelectedApprovedGroup({ ...group, logs });
                setApprovedModalOpen(true);
            }
        } catch (e) {
            console.log("Error fetching group details:", e);
        }
    };

    const handleQuantityChange = (index: number, value: number) => {
        if (!selectedPendingGroup) return;
        setSelectedPendingGroup((prev) => {
            if (!prev) return null;
            const updated = [...prev.logs];
            const safe = Math.max(0, Math.min(Number(value) || 0, updated[index].requested_quantity));
            updated[index].approved_quantity = safe;
            return { ...prev, logs: updated };
        });
    };

    const handleReject = async (group: Group) => {
        if (!group?.requested_groupid) {
            setAlertMessage("ไม่สามารถดำเนินการได้: ไม่พบรหัสคำขอ");
            setAlertType("error");
            setTimeout(() => { setAlertMessage(null); setAlertType(null); }, 3000);
            return;
        }
        setGroupToEdit(group);
        setIsEditConfirmOpen(true);
        setPendingModalOpen(false);
    };

    const handleEditConfirm = async () => {
        if (!groupToEdit) return;
        setIsEditConfirmOpen(false);

        try {
            const response = await axios.post("/api/requisition_log/notapproved", {
                id: groupToEdit.requested_groupid,
            });

            if (response.status === 200) {
                setAlertMessage("สำเร็จ");
                setAlertType("success");
                setRequisitionGroups((prev) =>
                    prev.map((g) => (g.requested_groupid === groupToEdit.requested_groupid ? { ...g, status: "NotApproved" } : g))
                );
                closeModal();
            } else {
                setAlertMessage("เกิดข้อผิดพลาด: ไม่สามารถเปลี่ยนสถานะได้");
                setAlertType("error");
            }
        } catch {
            setAlertMessage("ไม่สามารถแก้ไขสถานะได้ในขณะนี้! โปรดลองอีกครั้ง");
            setAlertType("error");
        } finally {
            setTimeout(() => { setAlertMessage(null); setAlertType(null); }, 3000);
        }
    };

    const handleApprove = async () => {
        if (!selectedPendingGroup) {
            setAlertMessage("ไม่พบคำขอที่เลือก");
            setAlertType("error");
            setTimeout(() => { setAlertMessage(null); setAlertType(null); }, 3000);
            return;
        }

        const totalApprovedQuantity = selectedPendingGroup.logs.reduce(
            (sum, log) => sum + (log.approved_quantity || 0),
            0
        );
        if (totalApprovedQuantity < 1) {
            setAlertMessage("จำนวนที่อนุมัติต้องไม่น้อยกว่า 1");
            setAlertType("error");
            setTimeout(() => { setAlertMessage(null); setAlertType(null); }, 3000);
            return;
        }

        try {
            const response = await axios.put(
                "/api/requisition_log/approve",
                {
                    groupId: selectedPendingGroup.requested_groupid,
                    logs: selectedPendingGroup.logs,
                },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            );

            if (response.status === 200) {
                setAlertMessage("สำเร็จ! คำขอได้รับการอนุมัติ");
                setAlertType("success");
                setRequisitionGroups((prev) =>
                    prev.map((g) =>
                        g.requested_groupid === selectedPendingGroup.requested_groupid ? { ...g, status: "Approved" } : g
                    )
                );
                closeModal();
            } else {
                setAlertMessage("เกิดข้อผิดพลาดในการอนุมัติคำขอ");
                setAlertType("error");
            }
        } catch (e) {
            console.error("❌ Error approving:", e);
            setAlertMessage("ไม่สามารถอนุมัติคำขอได้ในขณะนี้");
            setAlertType("error");
        } finally {
            setTimeout(() => { setAlertMessage(null); setAlertType(null); }, 3000);
        }
    };

    // ฟิลเตอร์ฝั่งหน้า (ไม่กระทบเลขรวมจาก backend)
    const visibleGroups = useMemo(() => {
        if (!searchTerm.trim()) return requisitionGroups;
        const q = searchTerm.trim().toLowerCase();
        return requisitionGroups.filter((g) => {
            const name = g.user ? `${g.user.title}${g.user.firstName} ${g.user.lastName}` : "";
            const dept = getDepartmentDisplay(g.user?.department, g.user?.position);
            const groupId = g.requested_groupid ?? "";
            return (
                name.toLowerCase().includes(q) ||
                dept.toLowerCase().includes(q) ||
                groupId.toLowerCase().includes(q)
            );
        });
    }, [requisitionGroups, searchTerm]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1">
                <TopBar />

                <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full p-8 mt-4 lg:ml-56">
                    <h1 className="text-2xl font-bold mb-6">อนุมัติเบิกสื่อ</h1>

                    {/* ===== ฟิลเตอร์ + ค้นหา ===== */}
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-2">
                            {FILTERS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={`py-2 px-4 rounded ${statusFilter === key ? "bg-[#9063d2] text-white" : "bg-gray-200"}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="ค้นหา: ชื่อผู้ขอ / หน่วยงาน / Group ID"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* ===== ตาราง ===== */}
                    <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-[#9063d2] text-white text-left text-sm uppercase font-semibold tracking-wider">
                                <th className="border py-3 px-4 text-left">ลำดับ</th>
                                <th className="border py-3 px-4 text-left">ชื่อผู้ขอ</th>
                                <th className="border py-3 px-4 text-left">หน่วยงาน</th>
                                <th className="border py-3 px-4 text-left">สถานะ</th>
                                <th className="border py-3 px-4 text-left">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleGroups.length > 0 ? (
                                visibleGroups.map((group, index) => (
                                    <tr key={group.requested_groupid} className="border-b text-xs font-normal">
                                        <td className="py-3 px-4">คำขอที่ {startIndex + index + 1}</td>
                                        <td className="py-3 px-4">
                                            {group.user
                                                ? `${group.user.title}${group.user.firstName} ${group.user.lastName}`
                                                : "ไม่ระบุข้อมูลผู้ใช้"}
                                        </td>
                                        <td className="py-3 px-4">
                                            {getDepartmentDisplay(group.user?.department, group.user?.position)}
                                        </td>
                                        <td className="py-3 px-4">{statusMapping[group.status] || group.status}</td>
                                        <td className="py-3 px-4">
                                            {group.status === "Pending" && (
                                                <button
                                                    onClick={() => openModal(group, "pending")}
                                                    className="px-4 py-2 rounded bg-[#fb8124] text-white"
                                                >
                                                    ดูคำขอ
                                                </button>
                                            )}
                                            {group.status === "Approved" && (
                                                <button
                                                    onClick={() => openModal(group, "approved")}
                                                    className="px-4 py-2 rounded bg-[#9063d2] text-white"
                                                >
                                                    รายละเอียด
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                                        {requisitionGroups.length === 0
                                            ? "ไม่มีข้อมูลคำขอในสถานะนี้"
                                            : "ไม่พบผลลัพธ์ตามคำค้นหา"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* ===== เพจจิเนชัน ===== */}
                    <div className="flex items-center justify-between mt-6">
                        <span className="text-sm text-gray-600">
                            {totalItems > 0
                                ? `รายการที่ ${startIndex + 1} ถึง ${Math.min(startIndex + 10, totalItems)} จาก ${totalItems} รายการ`
                                : "ไม่มีรายการ"}
                        </span>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50"
                            >
                                ก่อนหน้า
                            </button>

                            {getPageItems(currentPage, totalPages, 10).map((item, idx) =>
                                typeof item === "number" ? (
                                    <button
                                        key={idx}
                                        onClick={() => handlePageChange(item)}
                                        className={`px-3 py-2 rounded-md ${currentPage === item
                                                ? "bg-[#9063d2] text-white"
                                                : "bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white"
                                            } transition`}
                                    >
                                        {item}
                                    </button>
                                ) : (
                                    <span key={idx} className="px-3 py-2 text-gray-400 select-none">…</span>
                                )
                            )}

                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-4 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                </div>

                {/* ===== Modal: Pending ===== */}
                {pendingModalOpen && selectedPendingGroup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-2 text-center">รายละเอียดคำขอที่รอพิจารณา</h2>

                            {selectedPendingGroup.user && (
                                <p className="text-sm text-gray-600">
                                    หน่วยงาน: {getDepartmentDisplay(selectedPendingGroup.user.department, selectedPendingGroup.user.position)}
                                </p>
                            )}

                            {selectedPendingGroup.logs.length > 0 && (
                                <p className="text-sm text-gray-600">
                                    เหตุผลการใช้งาน:{" "}
                                    {selectedPendingGroup.logs[0].reason?.reason_name ||
                                        selectedPendingGroup.logs[0].customUsageReason ||
                                        "ไม่ระบุ"}
                                </p>
                            )}

                            <p className="mt-1 text-sm text-gray-600">
                                ที่อยู่จัดส่ง:{" "}
                                {selectedPendingGroup.delivery_address?.trim()
                                    ? selectedPendingGroup.delivery_address
                                    : "รับของที่กอง EnvOcc"}
                            </p>

                            <ul className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto pr-2">
                                {selectedPendingGroup.logs.map((log, index) => (
                                    <li key={log.id} className="py-4">
                                        <p className="font-semibold text-gray-700">ชื่อสื่อ: {log.requisition.requisition_name}</p>
                                        <p className="text-sm text-gray-600">จำนวนที่ขอ: {log.requested_quantity}</p>
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm font-medium text-gray-600">จำนวนที่ให้เบิก:</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={log.requested_quantity}
                                                value={log.approved_quantity ?? 0}
                                                onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                                                className="block w-20 px-2 py-1 border rounded-md text-gray-700 text-sm"
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6 flex justify-between items-center space-x-4">
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 bg-[#9063d2] hover:bg-[#8753d5] text-white py-2 px-4 rounded-lg font-semibold"
                                >
                                    อนุมัติ
                                </button>
                                <button
                                    onClick={() => handleReject(selectedPendingGroup)}
                                    className="flex-1 bg-[#f3e5f5] hover:bg-[#8753d5] text-white py-2 px-4 rounded-lg font-semibold"
                                >
                                    ไม่อนุมัติ
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="flex-1 bg-[#f3e5f5] hover:bg-[#8753d5] text-white py-2 px-4 rounded-lg font-semibold"
                                >
                                    ปิด
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== Modal: Approved ===== */}
                {approvedModalOpen && selectedApprovedGroup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4 text-center">รายละเอียดคำขอที่อนุมัติแล้ว</h2>

                            {selectedApprovedGroup.user && (
                                <p className="text-sm text-gray-600">
                                    หน่วยงาน: {getDepartmentDisplay(selectedApprovedGroup.user.department, selectedApprovedGroup.user.position)}
                                </p>
                            )}

                            {selectedApprovedGroup.logs?.length > 0 && (
                                <p className="text-sm text-gray-600">
                                    เหตุผลการใช้งาน:{" "}
                                    {selectedApprovedGroup.logs[0].reason?.reason_name ||
                                        selectedApprovedGroup.logs[0].customUsageReason ||
                                        "ไม่ระบุ"}
                                </p>
                            )}

                            <p className="mt-1 text-sm text-gray-600">
                                ที่อยู่จัดส่ง:{" "}
                                {selectedApprovedGroup.delivery_address?.trim()
                                    ? selectedApprovedGroup.delivery_address
                                    : "รับของที่กอง EnvOcc"}
                            </p>

                            {selectedApprovedGroup.logs?.length ? (
                                <ul className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto pr-2">
                                    {selectedApprovedGroup.logs.map((log) => (
                                        <li key={log.id} className="py-4">
                                            <p className="font-semibold text-gray-700">ชื่อสื่อ: {log.requisition.requisition_name}</p>
                                            <p className="text-sm text-gray-700">จำนวนที่ขอ: {log.requested_quantity}</p>
                                            <p className="text-sm text-gray-700">จำนวนที่ให้: {log.approved_quantity}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-600 text-center">ไม่มีข้อมูลสำหรับคำขอที่อนุมัติ</p>
                            )}

                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={closeModal}
                                    className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded-lg font-semibold"
                                >
                                    ปิด
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== Modals: Confirm + Alert ===== */}
                {isEditConfirmOpen && (
                    <ConfirmEditModal
                        isOpen={isEditConfirmOpen}
                        onClose={() => setIsEditConfirmOpen(false)}
                        onConfirm={handleEditConfirm}
                        title="ไม่อนุมัติรายการนี้หรือไม่?"
                        iconSrc="/images/alert.png"
                    />
                )}

                {alertMessage && (
                    <AlertModal
                        isOpen={!!alertMessage}
                        message={alertMessage}
                        type={alertType ?? "error"}
                        iconSrc={alertType === "success" ? "/images/check.png" : "/images/close.png"}
                    />
                )}
            </div>
        </div>
    );
}

export default ConfirmRequisition;
