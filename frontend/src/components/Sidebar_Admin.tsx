import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activePath, setActivePath] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setActivePath(window.location.pathname);
        }
    }, []);

    const menuItems = [
        { href: '/admins/dashboard', src: '/images/dashboard.png', label: 'Dashboard' },
        { href: '/admins/requisition', src: '/images/requisition.png', label: 'เบิกสื่อ' },
        { href: '/admins/confirm_requisition', src: '/images/app_requisition.png', label: 'อนุมัติเบิกสื่อ' },
        { href: '/admins/borrow', src: '/images/borrow.png', label: 'ยืม/คืน สื่อ' },
        { href: '/admins/confirm_borrow', src: '/images/approv_borrow.png', label: 'อนุมัติยืม/คืน สื่อ' },
        { isDropdown: true, label: 'จัดการสื่อ', src: '/images/type.png' },
        { href: '/admins/reports_requisition', src: '/images/reports.png', label: 'รายงานการขอเบิก' },
        { href: '/admins/reports_borrow', src: '/images/reports.png', label: 'รายงานการยืม' },
        { href: '/admins/user-management', src: '/images/user.png', label: 'จัดการผู้ใช้งาน' },
    ];


    return (
        <>
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Menu">
                    <Image src="/images/hamburger.png" alt="menu" width={32} height={32} priority />
                </button>
            </div>

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-screen w-52 bg-[#9063d2] text-white shadow-lg z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 transition-transform duration-300`}

            >
                <div className="p-4 flex justify-center">
                    <Image 
                    src="/images/icon_media.png" 
                    alt="icon" 
                    width={100} 
                    height={100} 
                    className="w-20 h-10"
                    priority/>
                </div>

                <ul className="mt-4 space-y-3">
                    {menuItems.map((item, index) => (
                        item.isDropdown ? (
                            // Dropdown menu for จัดการสื่อ
                            <React.Fragment key={index}>
                                <li
                                    className={`p-2 rounded-lg transition-colors duration-300 flex items-center cursor-pointer ${activePath.includes('/admins/type_management') ||
                                        activePath.includes('/admins/media_management') ||
                                        activePath.includes('/admins/borrow_management') ||
                                        activePath.includes('/admins/imagse') ? 'bg-[#b8a0f5]' : 'hover:bg-[#b8a0f5]'
                                        }`}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <Image src={item.src} alt="จัดการสื่อ" width={20} height={20} className="mr-4" priority/>
                                    <span className="font-semibold">{item.label}</span>
                                </li>
                                {isDropdownOpen && (
                                    <ul className="ml-8 space-y-2">
                                        <li className={`p-2 rounded-lg transition-colors duration-300 flex items-center ${activePath === '/admins/type_management' ? 'bg-[#b8a0f5]' : 'hover:bg-[#b8a0f5]'
                                            }`}>
                                            <Link href="/admins/type_management" className="flex items-center text-white w-full" prefetch={false}>
                                                <span>จัดการประเภท</span>
                                            </Link>
                                        </li>
                                        <li className={`p-2 rounded-lg transition-colors duration-300 flex items-center ${activePath === '/admins/media_management' ? 'bg-[#b8a0f5]' : 'hover:bg-[#b8a0f5]'
                                            }`}>
                                            <Link href="/admins/media_management" className="flex items-center text-white w-full" prefetch={false}>
                                                <span>จัดการเบิกสื่อ</span>
                                            </Link>
                                        </li>
                                        <li className={`p-2 rounded-lg transition-colors duration-300 flex items-center ${activePath === '/admins/borrow_management' ? 'bg-[#b8a0f5]' : 'hover:bg-[#b8a0f5]'
                                            }`}>
                                            <Link href="/admins/borrow_management" className="flex items-center text-white w-full" prefetch={false}>
                                                <span>จัดการยืม/คืน</span>
                                            </Link>
                                        </li>
                                        <li className={`p-2 rounded-lg transition-colors duration-300 flex items-center ${activePath === '/admins/image' ? 'bg-[#b8a0f5]' : 'hover:bg-[#b8a0f5]'
                                            }`}>
                                            <Link href="/admins/image" className="flex items-center text-white w-full" prefetch={false}>
                                                <span>จัดการสื่อดาวน์โหลด</span>
                                            </Link>
                                        </li>
                                    </ul>
                                )}
                            </React.Fragment>
                        ) : (
                            <li
                                key={index}
                                className={`p-2 rounded-lg transition-colors duration-300 flex items-center ${activePath === item.href ? 'bg-[#b8a0f5]' : 'hover:bg-[#b8a0f5]'
                                    }`}
                            >
                                <Link href={item.href ?? '#'} className="flex items-center text-white w-full" prefetch={false}>
                                    <Image
                                        src={item.src}
                                        alt="icon"
                                        width={20}
                                        height={20}
                                        className="mr-4"
                                        style={{ filter: 'brightness(0) invert(1)' }}
                                        priority
                                    />
                                    <span className="font-semibold">{item.label}</span>
                                </Link>
                            </li>
                        )
                    ))}
                </ul>
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </>
    );
};

export default Sidebar;
