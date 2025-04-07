"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

type ImageData = {
  id: string;
  filename: string;
  title: string;
  addedDate: string;
};


export default function Home() {
  const pathname = usePathname();
  const [images, setImages] = useState<ImageData[]>([]);


  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const data: ImageData[] = await response.json();
        const sortedData = data.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
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

      <div
        className="block bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2]"
      >
        <img src="/images/banner_media.png" alt="banner" className="w-full" />
      </div>



      <div
        className="block bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2]"
      >
        <img src="/images/WhyEnvocc.png" alt="banner" className="w-full" />
      </div>

      <div className="flex flex-col items-center justify-center py-16 bg-[#f3e5f5]">
        <div className="flex flex-col sm:flex-row items-center justify-center w-full px-4 gap-6">
          {images.map((image) => (
            <div key={image.id} className="w-full sm:w-auto">
              <Image
                src={`/uploads/${image.filename}`}
                alt={image.title}
                width={400}
                height={600}
                priority
                className="rounded-lg shadow-md w-full sm:w-auto h-[400px] object-cover"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <Link href="/media" className="bg-[#9063d2] text-white px-6 py-2 rounded-md hover:bg-[#8753d5] transition">
            ดูเพิ่มเติม
          </Link>
        </div>
      </div>


      <Footer />
    </>
  );
}