"use client";

import useAuthCheck from "@/hooks/useAuthCheck";
import Navbar from "@/components/NavbarUser";
import Link from "next/link";
import Image from "next/image";

function MainPage() {
    const { isLoading } = useAuthCheck("user");

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f3e5f5]">
                <p className="text-gray-700 text-lg">กำลังโหลด...</p>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#f3e5f5] pb-10">
                <div className="flex flex-col items-center">
                    <div className="w-full bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2] shadow-md">
                        <Image
                            src="/images/banner_media.png"
                            alt="banner"
                            width={1920}
                            height={500}
                            className="h-auto w-full object-cover"
                            priority
                        />
                    </div>

                    <div className="relative -mt-16 w-full px-4 md:px-20 lg:px-32">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <Link href="/users/requisition" className="block">
                                <div className="flex h-48 flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-100 transform hover:rotate-1">
                                    <h3 className="text-3xl font-extrabold text-[#9063d2] mb-2 drop-shadow-sm">
                                        เบิก
                                    </h3>
                                    <p className="text-lg text-gray-700 mt-1 max-w-xs leading-relaxed">
                                        จัดการคำขอเบิกสิ่งของต่างๆ ของคุณ
                                    </p>
                                </div>
                            </Link>

                            <Link href="/users/borrow" className="block">
                                <div className="flex h-48 flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-100 transform hover:-rotate-1">
                                    <h3 className="text-3xl font-extrabold text-[#c78ee8] mb-2 drop-shadow-sm">
                                        ยืม/คืน
                                    </h3>
                                    <p className="text-lg text-gray-700 mt-1 max-w-xs leading-relaxed">
                                        บันทึกและติดตามการยืมคืนสิ่งของ
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default MainPage;