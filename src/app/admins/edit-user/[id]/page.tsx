"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function EditUser({ params }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userData, setUserData] = useState({ name: '', email: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated" || (session && session.user.role !== 'admin')) {
      router.push(session ? "/users/dashboard" : "/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [status, session, router, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!res.ok) throw new Error("Error updating user");
      router.push('/admins/user-management');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Edit User</h1>
        <form onSubmit={handleSubmit}>
          {['name', 'email'].map((field) => (
            <div className="mb-4" key={field}>
              <label className="block text-gray-700 font-bold mb-2" htmlFor={field}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                id={field}
                name={field}
                type={field === 'email' ? 'email' : 'text'}
                value={userData[field]}
                onChange={(e) => setUserData({ ...userData, [field]: e.target.value })}
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
              value={userData.role}
              onChange={(e) => setUserData({ ...userData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
            Update User
          </button>
        </form>
      </div>
    </div>
  );
}
