"use client";

import React, { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

type ImageData = {
  id: string;
  filename: string;
  title: string;
  addedDate: string;
};

export default function Home() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isSecurityOpen, setIsSecurityOpen] = useState(true);
  const securityDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = securityDialogRef.current;
    if (!isSecurityOpen || !dialog) return;

    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
    };
  }, [isSecurityOpen]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/images");

        if (!response.ok) {
          console.error("API responded with error:", response.status);
          return;
        }

        const raw = await response.json();

        if (!Array.isArray(raw)) {
          console.error("Expected array but got:");
          return;
        }

        const sortedData = raw.sort(
          (a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );

        setImages(sortedData.slice(0, 3));
      } catch (error) {
        console.error("❌ Error fetching images:", error);
      }
    };

    fetchImages();
  }, []);


  return (
    <>
      <dialog
        ref={securityDialogRef}
        aria-label="ประกาศด้านความปลอดภัย"
        onCancel={(event) => {
          event.preventDefault();
          setIsSecurityOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setIsSecurityOpen(false);
          }
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-6xl max-h-[90dvh] overflow-y-auto rounded-xl bg-white p-0 shadow-2xl backdrop:bg-black/70"
      >
        <div className="relative">
          <div className="flex justify-end p-2">
            <button
              type="button"
              autoFocus
              onClick={() => setIsSecurityOpen(false)}
              className="rounded-md bg-[#9063d2] px-4 py-2 text-white hover:bg-[#8753d5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9063d2]"
            >
              ปิด ×
            </button>
          </div>
          <Image
            src="/images/Security.jpg"
            alt="ประกาศด้านความปลอดภัย"
            width={1920}
            height={1080}
            sizes="(max-width: 1184px) calc(100vw - 2rem), 1152px"
            className="h-auto max-h-[calc(90dvh-4rem)] w-full object-contain"
            priority
          />
        </div>
      </dialog>

      <Navbar />

      {/* ✅ priority image */}
      <div className="block bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2]">
        <Image
          src="/images/banner_media.png"
          alt="banner"
          width={1920}
          height={500}
          className="w-full h-auto"
          priority
          loading="eager"
        />
      </div>

      <div className="block bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2]">
        <Image
          src="/images/WhyEnvocc.png"
          alt="banner"
          width={1920}
          height={500}
          className="w-full h-auto"
          priority
          loading="eager"
        />
      </div>

      <div className="block bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2]">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mt-2 mb-5 text-4xl font-bold text-white">โหลดสื่อ</div>
          <div className="flex flex-col sm:flex-row items-center justify-center w-full px-4 gap-6">
            {images.map((image) => (
              <div key={image.id} className="w-full sm:w-auto">
                <Image
                  src={`/uploads/${image.filename}`}
                  alt={image.title}
                  width={400}
                  height={600}
                  className="rounded-lg shadow-md w-full sm:w-auto h-[400px] object-cover"
                  priority
                  loading="eager"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <Link
              href="/media"
              className="bg-[#9063d2] text-white px-6 py-2 rounded-md hover:bg-[#8753d5] transition"
            >
              ดูเพิ่มเติม
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
