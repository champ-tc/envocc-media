"use client";

import React, { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { useParams } from 'next/navigation';

function MediaDetailPage() {
  const params = useParams();
  const filename = params?.id;
  const [image, setImage] = useState<any | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasIncremented = useRef(false); // ใช้ useRef เพื่อตรวจสอบว่าทำการเพิ่ม viewCount แล้วหรือยัง

  useEffect(() => {
    if (filename) {
      fetchImageDetails();
    }
  }, [filename]);

  const fetchImageDetails = async () => {
    try {
      const response = await fetch(`/api/images/${filename}`);
      if (!response.ok) {
        throw new Error(`Image not found: ${response.statusText}`);
      }
      const data = await response.json();
      setImage(data);
      setViewCount(data.viewCount || 0);

      // ตรวจสอบและเพิ่ม viewCount ถ้ายังไม่ได้เพิ่ม
      if (!hasIncremented.current) {
        incrementViewCount();
        hasIncremented.current = true; // ตั้งค่าว่าเพิ่มแล้ว
      }
    } catch (error) {
      console.error('Error fetching image details:', error);
      setErrorMessage('ไม่พบข้อมูลรูปภาพ หรือเกิดข้อผิดพลาดในการดึงข้อมูล');
    }
  };

  const incrementViewCount = async () => {
    try {
      const response = await fetch(`/api/images/${filename}`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Failed to increment view count: ${response.statusText}`);
      }
      console.log('View count incremented successfully');
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  if (errorMessage) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className="text-red-600">{errorMessage}</p>
      </div>
    );
  }

  if (!filename) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p>Invalid Image ID</p>
      </div>
    );
  }

  if (!image) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center py-16 min-h-screen bg-[#f3e5f5]">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl">
          <Image
            src={`/uploads/${image.filename}`}
            alt={image.title}
            width={280}
            height={400}
            className="rounded-t-lg object-cover w-full h-full"
            priority
          />
          <div className="mb-4">
            <p className="text-gray-600 text-sm">
              วันที่เพิ่ม:{' '}
              {image.addedDate
                ? new Date(image.addedDate).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
                : 'วันที่ไม่ถูกต้อง'}
            </p>
            <h3 className="text-2xl font-bold mt-2 mb-2">{image.title}</h3>
            <p className="text-gray-800">จำนวนครั้งที่ดู: {viewCount}</p>
          </div>
          {image.filename && (
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = `/uploads/${image.filename}`;
                link.download = image.title;
                link.click();
              }}
              className="bg-[#9063d2] hover:bg-[#8753d5] text-white px-6 py-2 rounded-md transition"
            >
              ดาวน์โหลดรูป
            </button>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default MediaDetailPage;