"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_Admin";
import TopBar from "@/components/TopBar";
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function AdminsDashboard() {
  useAuth('admin');

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && session.user?.role !== 'admin') {
      router.push("/admins/dashboard");
    }
  }, [status, session]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  const cardData = [
    { label: "รายการทั้งหมด", value: 15000 },
    { label: "คำขอที่ทั้งหมด", value: 15000 },
    { label: "คำขออนุมัติทั้งหมด", value: 15000 },
    { label: "อนุมัติทั้งหมด", value: 15000 }
  ];

  const barData = {
    labels: ["Feb", "Mar", "Apr"],
    datasets: [
      {
        label: "ประเภทการเบิก",
        backgroundColor: "#F97316", // ใช้รหัสสีแทนชื่อสี
        data: [3000, 4000, 5000]
      }
    ]
  };


  const doughnutData = {
    labels: ["หมวด A", "หมวด B"],
    datasets: [
      {
        data: [150, 50],
        backgroundColor: ["#FF5733", "#F97316"]
      }
    ]
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-start justify-center p-2">
        <div className="rounded-lg max-w-6xl w-full p-8 mt-4 lg:ml-52">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full mb-6 max-w-full">
              {cardData.map((card, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-2xl font-semibold">{card.value.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{card.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
              <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
                <h3 className="text-lg font-semibold mb-4">ประเภทการเบิก</h3>
                <Bar data={barData} />
              </div>
              <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
                <h3 className="text-lg font-semibold mb-4">ตำแหน่ง/อาชีพ</h3>
                <Doughnut data={doughnutData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminsDashboard;
