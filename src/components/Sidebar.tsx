import React from 'react';
import Link from 'next/link';

const Sidebar: React.FC = () => {
  return (
    <div className="h-screen w-64 bg-gray-800 text-white">
      <div className="p-4">
        <h2 className="text-xl font-bold">My Sidebar</h2>
      </div>
      <ul>
        <li className="p-2 hover:bg-gray-700">
          <Link href="/dashboard">Dashboard</Link>
        </li>
        <li className="p-2 hover:bg-gray-700">
          <Link href="/profile">Profile</Link>
        </li>
        <li className="p-2 hover:bg-gray-700">
          <Link href="/settings">Settings</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
