export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white px-4 text-center">
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <p className="text-lg mb-6">ขออภัย! ไม่พบหน้าที่คุณต้องการ หรือคุณอาจไม่มีสิทธิ์เข้าถึง</p>
            <a
                href="/"
                className="bg-[#9063d2] text-white py-2 px-4 rounded hover:bg-[#7a49c3] transition-colors"
            >
                กลับหน้าหลัก
            </a>
        </div>
    );
}
