import React, { useState } from 'react';
import Link from 'next/link';

function Sidebar() {
    const [isHovered, setIsHovered] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    return (
        <div>
            {/* Hamburger Icon for Mobile */}
            <div className="md:hidden p-4 fixed top-0 left-0 z-50">
                <button onClick={toggleSidebar}>
                    <img src="/images/hamburger.png" alt="menu" className="h-8 w-8" />
                </button>
            </div>
            {/* Sidebar */}
            <div 
                className={`h-screen ${isSidebarVisible ? 'w-64' : 'w-0'} md:${isHovered ? 'w-64' : 'w-20'} bg-gradient-to-r from-orange-600 to-orange-500 text-white fixed transition-all duration-300 shadow-lg overflow-hidden z-40 md:block`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="p-4 flex justify-center">
                    <img src="/images/icon_media.png" alt="icon" className={`transition-transform duration-300 ${isHovered || isSidebarVisible ? 'h-10' : 'h-6'}`} />
                </div>
                <ul className='mt-4 space-y-3'>
                    <li className="p-2 hover:bg-orange-400 rounded-lg transition-colors duration-300 flex items-center">
                        <Link href="/admins/dashboard" className="flex items-center text-white w-full">
                            <img src="/images/dashboard.png" style={{ filter: 'brightness(0) invert(1)' }} alt="icon" className={`transition-transform duration-300 ${isHovered || isSidebarVisible ? 'h-5 mr-4 scale-110 ml-0' : 'h-5 scale-110 mx-auto'}`} />
                            {(isHovered || isSidebarVisible) && <span className="font-semibold ml-2">Dashboard</span>}
                        </Link>
                    </li>
                    <li className="p-2 hover:bg-orange-400 rounded-lg transition-colors duration-300 flex items-center">
                        <Link href="/admins/requisition" className="flex items-center text-white w-full">
                            <img src="/images/requisition.png" style={{ filter: 'brightness(0) invert(1)' }} alt="icon" className={`transition-transform duration-300 ${isHovered || isSidebarVisible ? 'h-5 mr-4 scale-110 ml-0' : 'h-5 scale-110 mx-auto'}`} />
                            {(isHovered || isSidebarVisible) && <span className="font-semibold ml-2">เบิกสื่อ</span>}
                        </Link>
                    </li>
                    <li className="p-2 hover:bg-orange-400 rounded-lg transition-colors duration-300 flex items-center">
                        <Link href="/admins/borrow" className="flex items-center text-white w-full">
                            <img src="/images/borrow.png" style={{ filter: 'brightness(0) invert(1)' }} alt="icon" className={`transition-transform duration-300 ${isHovered || isSidebarVisible ? 'h-5 mr-4 scale-110 ml-0' : 'h-5 scale-110 mx-auto'}`} />
                            {(isHovered || isSidebarVisible) && <span className="font-semibold ml-2">ยืม/คืน สื่อ</span>}
                        </Link>
                    </li>
                    <li className="p-2 hover:bg-orange-400 rounded-lg transition-colors duration-300 flex items-center">
                        <Link href="/admins/category_management" className="flex items-center text-white w-full">
                            <img src="/images/type.png" style={{ filter: 'brightness(0) invert(1)' }} alt="icon" className={`transition-transform duration-300 ${isHovered || isSidebarVisible ? 'h-5 mr-4 scale-110 ml-0' : 'h-5 scale-110 mx-auto'}`} />
                            {(isHovered || isSidebarVisible) && <span className="font-semibold ml-2">จัดการสื่อ ประเภท / สื่อ</span>}
                        </Link>
                    </li>
                    <li className="p-2 hover:bg-orange-400 rounded-lg transition-colors duration-300 flex items-center">
                        <Link href="/admins/reports" className="flex items-center text-white w-full">
                            <img src="/images/reports.png" style={{ filter: 'brightness(0) invert(1)' }} alt="icon" className={`transition-transform duration-300 ${isHovered || isSidebarVisible ? 'h-5 mr-4 scale-110 ml-0' : 'h-5 scale-110 mx-auto'}`} />
                            {(isHovered || isSidebarVisible) && <span className="font-semibold ml-2">รายงาน</span>}
                        </Link>
                    </li>
                    <li className="p-2 hover:bg-orange-400 rounded-lg transition-colors duration-300 flex items-center">
                        <Link href="/admins/user-management" className="flex items-center text-white w-full">
                            <img src="/images/user.png" style={{ filter: 'brightness(0) invert(1)' }} alt="icon" className={`transition-transform duration-300 ${isHovered || isSidebarVisible ? 'h-5 mr-4 scale-110 ml-0' : 'h-5 scale-110 mx-auto'}`} />
                            {(isHovered || isSidebarVisible) && <span className="font-semibold ml-2">จัดการผู้ใช้งาน</span>}
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default Sidebar;