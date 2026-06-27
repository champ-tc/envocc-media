"use client";

import React, { useState, useEffect } from "react";
import useAuthCheck from "@/hooks/useAuthCheck";
import Navbar from "@/components/NavbarUser";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Pagination from "@/components/Pagination";

type ImageData = {
    id: string;
    filename: string;
    addedDate: string;
    title: string;
};



function UsersBorrow() {
    const { session, isLoading } = useAuthCheck("user");
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
    }, [session]);

    const handleImageClick = (imageId: string) => {
        router.push(`/users/media/${imageId}`);
    };


    const filteredImages = images.filter((image) =>
        image.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredImages.length / itemsPerPage));
    const indexOfLastImage = currentPage * itemsPerPage;
    const indexOfFirstImage = indexOfLastImage - itemsPerPage;
    const currentImages = filteredImages.slice(indexOfFirstImage, indexOfLastImage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Change page
    const handlePageChange = (newPage: number) => {
        setCurrentPage(Math.min(Math.max(newPage, 1), totalPages));
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>กำลังโหลด...</p>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-[#f3e5f5]">
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

                <div className="mt-8 flex justify-center">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
            </div>
        </div>
    );
}

export default UsersBorrow;
