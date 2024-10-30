import React from 'react';
import { useSession, signOut } from 'next-auth/react';

function TopBar() {
    const { data: session } = useSession();

    return (
        <div className="w-full bg-white text-black py-4 px-8 flex justify-between items-center">
            <h2 className="text-lg font-semibold">My Dashboard</h2>
            <div className="flex items-center space-x-4">
                <span className="text-sm">{session?.user?.name || "User"}</span>
                <button
                    className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

export default TopBar;
