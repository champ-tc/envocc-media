"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";


function AdminsType_management() {
    useAuth('admin');

    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (session && session.user.role !== 'admin') {
            router.push("/admins/dashboard");
        }
    }, [status, session]);

    if (status === "loading") {
        return <p>Loading...</p>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar is fixed on the left */}
            <Sidebar />

            {/* Content Area (TopBar + Main Content) */}
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 flex items-start justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">รายงาน</h2>
                        <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                            <div className="w-full">
                                test
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminsType_management;