"use client";

import React, { useState, useEffect } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";

interface BorrowLog {
    id: number;
    borrow_name: string;
    quantity: number;
    returned_quantity: number;
    borrow_date: string;
    return_due_date: string;
    status: string;
    user: string;
}

export default function ReportsBorrow() {
    const { session, isLoading } = useAuthCheck("admin");
    const router = useRouter();
    const [borrowLogs, setBorrowLogs] = useState<BorrowLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchBorrowLogs = async () => {
            try {
                const response = await fetch("/api/reports/borrow");
                if (!response.ok) {
                    throw new Error("Failed to fetch borrow logs");
                }
                const data = await response.json();
                setBorrowLogs(data);
            } catch (error) {
                console.error("Error fetching borrow logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBorrowLogs();
    }, []);

    if (isLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">รายงานการยืมอุปกรณ์</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">#</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">ชื่ออุปกรณ์</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">จำนวน</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">คืนแล้ว</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">ผู้ขอยืม</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">วันที่ยืม</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">กำหนดคืน</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {borrowLogs.map((log, index) => (
                                        <tr key={log.id}>
                                            <td className="px-4 py-2 text-sm">{index + 1}</td>
                                            <td className="px-4 py-2 text-sm">{log.borrow_name}</td>
                                            <td className="px-4 py-2 text-sm">{log.quantity}</td>
                                            <td className="px-4 py-2 text-sm">{log.returned_quantity}</td>
                                            <td className="px-4 py-2 text-sm">{log.user}</td>
                                            <td className="px-4 py-2 text-sm">{new Date(log.borrow_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 text-sm">{new Date(log.return_due_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 text-sm">
                                                <span className={`px-2 py-1 rounded ${log.status === "pending" ? "bg-yellow-300" : log.status === "approved" ? "bg-green-300" : "bg-red-300"}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {borrowLogs.length === 0 && (
                                <p className="text-center mt-4 text-gray-500">ไม่มีข้อมูลการยืม</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
