import React from 'react';

interface AlertModalProps {
    isOpen: boolean;
    message: string;
    type: 'success' | 'error';
    iconSrc: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, message, type, iconSrc }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
            <div className={`relative bg-white p-8 rounded-2xl shadow-xl w-96 h-70 max-w-5xl border-2 ${type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
                <div className="text-center">
                    <div className={`${type === 'success' ? 'text-green-500' : 'text-red-500'} mb-4`}>
                        <img src={iconSrc} alt="Alert Icon" className="h-28 w-28 mx-auto" />
                    </div>
                    <p className={`text-2xl font-semibold mt-10 ${type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
