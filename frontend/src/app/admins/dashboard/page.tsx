'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar_Admin';
import TopBar from '@/components/TopBar';
import useAuthCheck from "@/hooks/useAuthCheck";
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface StatItem {
  name: string;
  count: number;
}

interface TopItem {
  name: string;
  used: number;
  remaining: number;
}

interface DashboardData {
  totalRequisitionLogs: number;
  approvedRequisitionLogs: number;
  totalBorrowLogs: number;
  returnedCount: number;
  userTypeStats: StatItem[];
  usagePurposeStatsRequisition: StatItem[];
  usagePurposeStatsBorrow: StatItem[];
  topRequisitions: TopItem[];
  topBorrows: TopItem[];
}



function AdminsDashboard() {
  const { isLoading } = useAuthCheck("admin");
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  if (!data) return <div className="p-4">กำลังโหลด...</div>;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  const cardData = [
    { label: 'รายการขอเบิกทั้งหมด', value: data.totalRequisitionLogs },
    { label: 'อนุมัติขอเบิกทั้งหมด', value: data.approvedRequisitionLogs },
    { label: 'รายการขอยืม/คืนทั้งหมด', value: data.totalBorrowLogs },
    { label: 'อนุมัติยืมคืน', value: data.returnedCount },
  ];

  const doughnutOptions: ChartOptions<'doughnut'> = {
    plugins: {
      datalabels: {
        color: '#ffffff',
        font: {
          weight: 'bold',
          size: 14,
        },
        formatter: (value: number) => value,
      },
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          color: '#374151',
          boxWidth: 16,
          padding: 10,
          font: {
            size: 14,
          },
        },
      },
    },
    layout: {
      padding: 0,
    },
  };

  const doughnutUserType = {
    labels: data.userTypeStats.map((u: StatItem) => u.name),
    datasets: [
      {
        data: data.userTypeStats.map((u: StatItem) => u.count),
        backgroundColor: ['#9063d2', '#5ef5bf', '#FFCE56', '#4BC0C0', '#91a7ff', '#f06292'],
      },
    ],
  };


  const doughnutPurposeRequisition = {
    labels: data.usagePurposeStatsRequisition.map((r: StatItem) => r.name),
    datasets: [
      {
        data: data.usagePurposeStatsRequisition.map((r: StatItem) => r.count),
        backgroundColor: ['#9063d2', '#5ef5bf', '#FFCE56', '#4BC0C0'],
      },
    ],
  };


  const doughnutPurposeBorrow = {
    labels: data.usagePurposeStatsBorrow.map((r: StatItem) => r.name),
    datasets: [
      {
        data: data.usagePurposeStatsBorrow.map((r: StatItem) => r.count),
        backgroundColor: ['#9063d2', '#5ef5bf', '#FFCE56', '#4BC0C0'],
      },
    ],
  };


  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 p-6 lg:ml-52 space-y-6">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cardData.map((card, i) => (
              <div
                key={i}
                className="bg-white hover:shadow-lg transition-shadow duration-300 rounded-2xl p-6 text-center shadow-md"
              >
                <p className="text-3xl font-bold text-[#9063d2]">{card.value.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* แถวที่ 1: สัดส่วนประเภทผู้ใช้ + TOP5 เบิก + TOP5 ยืม */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">สัดส่วนประเภทผู้ใช้</h3>
              <Doughnut data={doughnutUserType} options={doughnutOptions} plugins={[ChartDataLabels]} />
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">TOP 5 รายการเบิก</h3>
                <table className="w-full text-sm">
                  <thead className="text-left border-b text-gray-600">
                    <tr>
                      <th className="py-2">รายการ</th>
                      <th>จำนวนที่เบิก</th>
                      <th>คงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topRequisitions.map((item: TopItem, idx: number) => (
                      <tr key={idx} className="border-b text-gray-700">
                        <td className="py-2">{item.name}</td>
                        <td>{item.used}</td>
                        <td>{item.remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">TOP 5 รายการยืม/คืน</h3>
                <table className="w-full text-sm">
                  <thead className="text-left border-b text-gray-600">
                    <tr>
                      <th className="py-2">รายการ</th>
                      <th>จำนวนที่ยืม</th>
                      <th>คงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topBorrows.map((item: TopItem, idx: number) => (
                      <tr key={idx} className="border-b text-gray-700">
                        <td className="py-2">{item.name}</td>
                        <td>{item.used}</td>
                        <td>{item.remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* แถวที่ 2: เหตุผลการเบิกและยืม */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">เบิกสำหรับใช้ประโยชน์</h3>
              <Doughnut data={doughnutPurposeRequisition} options={doughnutOptions} plugins={[ChartDataLabels]} />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">ยืมสำหรับใช้ประโยชน์</h3>
              <Doughnut data={doughnutPurposeBorrow} options={doughnutOptions} plugins={[ChartDataLabels]} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminsDashboard