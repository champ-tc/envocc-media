"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type ImageData = {
  id: string;
  filename: string;
  addedDate: string;
  title: string;
};

function MediaPage() {
  const router = useRouter();
  const [images, setImages] = useState<ImageData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const data: ImageData[] = await response.json();
        const sortedData = data.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
        setImages(sortedData);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };
    fetchImages();
  }, []);

  const handleImageClick = (imageId: string) => {
    router.push(`/media/${imageId}`);
  };


  const indexOfLastImage = currentPage * itemsPerPage;
  const indexOfFirstImage = indexOfLastImage - itemsPerPage;

  const filteredImages = images.filter((image) =>
    image.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentImages = filteredImages.slice(indexOfFirstImage, indexOfLastImage);

  // Change page
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center bg-[#f3e5f5] p-10 min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-gray-700">สื่อเผยแพร่</h1>

        <div className="w-full ml-20 px-4 mb-6 flex justify-start">
          <input
            type="text"
            placeholder="ค้นหาจากชื่อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>



        <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 justify-center">
          {currentImages.map((image) => (
            <div
              key={image.id}
              className="relative bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer border border-pink-200 transform transition duration-300 hover:scale-105 mx-auto"
              onClick={() => handleImageClick(image.filename)}
              style={{ width: '280px' }}
            >
              <div className="relative w-full h-auto">
                <Image
                  src={`/uploads/${image.filename}`}
                  alt={image.title}
                  width={280}
                  height={400}
                  className="rounded-t-lg object-cover w-full h-full"
                  priority
                />
              </div>

              <div className="p-4">
                <p className="text-gray-600 text-sm mb-2">
                  {new Date(image.addedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h3 className="text-md font-semibold text-black leading-tight text-left">
                  {image.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center mt-8 space-x-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md bg-[#9063d2] text-white hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50" ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            ก่อนหน้า
          </button>
          <span className="text-gray-700 font-medium">หน้า {currentPage}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={indexOfLastImage >= images.length}
            className={`px-4 py-2 rounded-md bg-[#9063d2] text-white hover:bg-[#9063d2] hover:text-white transition disabled:opacity-50" ${indexOfLastImage >= images.length ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            ถัดไป
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default MediaPage;
