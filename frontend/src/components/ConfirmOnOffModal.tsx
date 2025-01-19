import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    iconSrc: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, iconSrc }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
            <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-80 h-80 max-w-5xl text-center border-2 border-orange-500">
                <div className="text-red-500 mb-4">
                    <img src={iconSrc} alt="Confirm Icon" className="h-40 w-40 mx-auto" />
                </div>
                <h2 className="text-lg font-semibold mb-4">{title}</h2>
                <div className="flex justify-center space-x-4">
                    <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
                        onClick={onClose}
                    >
                        ยกเลิก
                    </button>
                    <button
                        className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                        onClick={onConfirm}
                    >
                        
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;