// import React from 'react';
// import Image from 'next/image';

// interface AlertModalProps {
//     isOpen: boolean;
//     message: string;
//     type: 'success' | 'error' | 'warning'; // ✅ เพิ่ม warning
//     iconSrc: string;
//     onConfirm?: () => void;
//     onCancel?: () => void;
// }

// const AlertModal: React.FC<AlertModalProps> = ({ isOpen, message, type, iconSrc }) => {
//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
//             <div className={`relative bg-white p-8 rounded-2xl shadow-xl w-96 h-70 max-w-5xl border-2 ${type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
//                 <div className="text-center">
//                     <div className={`${type === 'success' ? 'text-green-500' : 'text-red-500'} mb-4`}>
//                         <Image src={iconSrc} alt="Alert Icon" width={112} height={112} className="mx-auto" />
//                     </div>
//                     <p className={`text-2xl font-semibold mt-10 ${type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
//                         {message}
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default AlertModal;



import React from 'react';
import Image from 'next/image';

interface AlertModalProps {
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'warning'; // ✅ รองรับ warning แบบปลอดภัย
    iconSrc: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

// ✅ ใช้ฟังก์ชันรวมสีแบบปลอดภัย
const getColorClass = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
        case 'success':
            return 'text-green-500 border-green-500';
        case 'error':
            return 'text-red-500 border-red-500';
        case 'warning':
            return 'text-yellow-500 border-yellow-500';
        default:
            return 'text-gray-500 border-gray-300';
    }
};

const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    message,
    type,
    iconSrc,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const colorClass = getColorClass(type);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
            <div className={`relative bg-white p-8 rounded-2xl shadow-xl w-96 max-w-5xl border-2 ${colorClass}`}>
                <div className="text-center">
                    <div className={`mb-4 ${colorClass}`}>
                        <Image src={iconSrc} alt="Alert Icon" width={112} height={112} className="mx-auto" />
                    </div>
                    <p className={`text-lg font-semibold mb-6 ${colorClass}`}>
                        {message}
                    </p>

                    {(onConfirm || onCancel) && (
                        <div className="flex justify-center space-x-4 mt-6">
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
                                >
                                    ยกเลิก
                                </button>
                            )}
                            {onConfirm && (
                                <button
                                    onClick={onConfirm}
                                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md"
                                >
                                    ลบ
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
