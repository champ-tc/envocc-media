import React from 'react';
import Link from 'next/link';

function Sidebar() {
  return (
    <div className="h-screen w-64 bg-orange-600 text-white fixed">
      <div className="m-4">
        <img src="/images/icon_media.png" alt="icon" className="h-10" />
      </div>
      <ul className=''>
        <li className="p-2 hover:bg-orange-300 mt-2 mb-2">
          <Link href="/users/requisition" className="flex items-center text-white">
            <img src="/images/requisition.png" alt="icon" className="h-6 mr-2 invert brightness-0" />
            เบิกสื่อ
          </Link>


        </li>
        <li className="p-2 hover:bg-orange-300 mt-2 mb-2">
          <Link href="/users/borrow" className="flex items-center text-white">
            <img src="/images/borrow.png" alt="icon" className="h-6 mr-2 invert brightness-0" />
            ยืม/คืน สื่อ
          </Link>
        </li>
        <li className="p-2 hover:bg-orange-300 mt-2 mb-2">
          <Link href="/users/personal" className="flex items-center text-white">
            <img src="/images/user.png" alt="icon" className="h-6 mr-2 invert brightness-0" />
            ข้อมูลส่วนตัว
          </Link>
        </li>
      </ul>
    </div>
  )
}

export default Sidebar;
