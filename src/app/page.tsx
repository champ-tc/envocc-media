"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const pathname = usePathname();
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Fetch the latest 3 images from the backend API, sorted by addedDate in descending order
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const data = await response.json();
        const sortedData = data.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
        setImages(sortedData.slice(0, 3));
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };
    fetchImages();
  }, []);

  return (
    <>
      <Navbar />
      <Link href="/">
        <img src="/images/banner_media.png" alt="banner" className="w-full" />
      </Link>
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-yellow-600 text-4xl font-bold mb-16">ทำไมต้อง <span className="text-orange-600">Media Envocc?</span></h2>
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mb-16">
          <div className="w-full md:w-1/2 flex flex-col items-center p-8">
            <Image src="/images/product.png" alt="check" width={200} height={200} className="mb-4" />
            <p className="text-2xl font-bold">เบิกสื่อ</p>
          </div>
          <div className="w-full md:w-1/2 flex flex-col items-center p-8">
            <Image src="/images/media.png" alt="check" width={200} height={200} className="mb-4" />
            <p className="text-2xl font-bold">ดาวน์โหลดสื่อ</p>
          </div>
        </div>

        <div className="flex items-center justify-center w-full px-10 m-10">
          {images.map((image) => (
            <div key={image.id} className="mx-4">
              <Image
                src={`/uploads/${image.filename}`}
                alt={image.title}
                width={400}
                height={600}
                className="rounded-lg shadow-md w-auto h-[400px] object-cover"
              />

            </div>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <Link href="/media" className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition">
            ดูเพิ่มเติม
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}