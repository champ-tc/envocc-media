"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

function MediaPage() {
  const [images, setImages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const data = await response.json();
        console.log("Fetched images:", data); // ตรวจสอบข้อมูลที่ดึงจาก API
        const sortedData = data.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
        setImages(sortedData);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };
    fetchImages();
  }, []);

  const handleImageClick = (imageId) => {
    router.push(`/media/${imageId}`);
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-full max-w-7xl px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-lg shadow-lg p-4 cursor-pointer" onClick={() => handleImageClick(image.filename)}>
              <Image
                src={`/uploads/${image.filename}`}
                alt={image.title}
                width={400}
                height={600}
                className="rounded-lg"
                unoptimized // เพิ่ม unoptimized เพื่อทดสอบว่ารูปแสดงหรือไม่
              />
              <div className="mt-4">
                <p className="text-gray-600 text-sm">{new Date(image.addedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <h3 className="text-lg font-bold mt-2">{image.title}</h3>
                <p className="text-blue-600 mt-1">กองโครงการการประกอบอาชีพและสิ่งแวดล้อม</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default MediaPage;
