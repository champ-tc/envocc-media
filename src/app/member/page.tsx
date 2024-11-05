"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar_User';

const MemberPage: React.FC = () => {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 p-6">
                <h1 className="text-3xl font-bold">Welcome to the Member Page</h1>
                <p>This is the main content area.</p>
            </div>
        </div>
    );
};

export default MemberPage;
