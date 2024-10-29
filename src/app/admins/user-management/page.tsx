"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";

export default function UserManagement() {
    const { data: session } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "user" });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState(null);

    const [successMessage, setSuccessMessage] = useState(null);


    useAuth('admin');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users');
                const data = await res.json();
                setUsers(data);
            } catch {
                setError("Error fetching users");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete user");
            setUsers(users.filter(user => user.id !== id));

            // แสดงข้อความแจ้งเตือนว่าสำเร็จ
            setSuccessMessage("User delect successfully!");

            // ลบข้อความแจ้งเตือนหลังจาก 5 วินาที
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000); // 5000ms = 5 วินาที
        } catch {
            setError("Error deleting user");
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            if (!res.ok) throw new Error("Error adding user");
            const addedUser = await res.json();
            setUsers([...users, addedUser]);
            setIsModalOpen(false);
            setNewUser({ name: "", email: "", password: "", role: "user" });

            // แสดงข้อความแจ้งเตือนว่าสำเร็จ
            setSuccessMessage("User added successfully!");

            // ลบข้อความแจ้งเตือนหลังจาก 5 วินาที
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000); // 5000ms = 5 วินาที
        } catch {
            setError("Error adding user");
        }
    };



    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">

            {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
                    <p>{successMessage}</p>
                </div>
            )}

            <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl w-full">
                <h1 className="text-2xl font-bold mb-4">User Management</h1>
                <button onClick={() => setIsModalOpen(true)} className="mb-4 bg-green-500 text-white py-2 px-4 rounded-md">
                    Add New User
                </button>
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="py-2 px-4 text-left">ID</th>
                            <th className="py-2 px-4 text-left">Name</th>
                            <th className="py-2 px-4 text-left">Email</th>
                            <th className="py-2 px-4 text-left">Role</th>
                            <th className="py-2 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="border-b py-2 px-4">{user.id}</td>
                                <td className="border-b py-2 px-4">{user.name}</td>
                                <td className="border-b py-2 px-4">{user.email}</td>
                                <td className="border-b py-2 px-4">{user.role}</td>
                                <td className="border-b py-2 px-4">
                                    <button className="text-blue-500 hover:underline" onClick={() => router.push(`/admins/edit-user/${user.id}`)}>Edit</button>
                                    <button className="text-red-500 hover:underline ml-4" onClick={() => handleDelete(user.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Add New User</h2>
                        <form onSubmit={handleAddUser}>
                            {['name', 'email', 'password'].map(field => (
                                <div className="mb-4" key={field}>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor={field}>
                                        {field.charAt(0).toUpperCase() + field.slice(1)}
                                    </label>
                                    <input
                                        id={field}
                                        name={field}
                                        type={field === 'password' ? 'password' : 'text'}
                                        value={newUser[field]}
                                        onChange={(e) => setNewUser({ ...newUser, [field]: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            ))}
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="role">Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
                                Add User
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="ml-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600">
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
