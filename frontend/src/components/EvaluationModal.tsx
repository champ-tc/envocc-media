"use client";

import { useState } from "react";

interface EvaluationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EvaluationData) => void;
}

export interface EvaluationData {
    satisfaction: number;
    convenience: number;
    reuseIntention: string;
    recommend: string;
    suggestion: string;
}

export default function EvaluationModal({ isOpen, onClose, onSubmit }: EvaluationModalProps) {
    const [satisfaction, setSatisfaction] = useState<number>(5);
    const [convenience, setConvenience] = useState<number>(5);
    const [reuse, setReuse] = useState<string>("definitely");
    const [recommend, setRecommend] = useState<string>("yes");
    const [suggestion, setSuggestion] = useState<string>("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit({
            satisfaction,
            convenience,
            reuseIntention: reuse,
            recommend,
            suggestion
        });
    };

    // ตัวเลือกคะแนน 5 ระดับ
    const ratingOptions = [
        { value: 5, label: "มากที่สุด" },
        { value: 4, label: "มาก" },
        { value: 3, label: "ปานกลาง" },
        { value: 2, label: "น้อย" },
        { value: 1, label: "น้อยที่สุด" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-0 z-[9999]">
            {/* Backdrop with Blur */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative transform transition-all scale-100 z-10">

                {/* Header */}
                <div className="bg-[#9063d2] p-6 text-white flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {/* Star Icon (SVG) */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-yellow-300">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            แบบประเมินความพึงพอใจ
                        </h2>
                        <p className="text-purple-100 mt-1 text-sm opacity-90">
                            ความคิดเห็นของท่านมีความสำคัญต่อการพัฒนาการบริการของเรา
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1 transition"
                    >
                        {/* Close Icon (SVG) */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 sm:p-8 overflow-y-auto space-y-8 bg-gray-50/50">

                    {/* ข้อ 1 */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <p className="font-bold text-gray-800 text-lg mb-4 flex gap-2">
                            <span className="bg-purple-100 text-[#9063d2] w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">1</span>
                            ความพึงพอใจการใช้งานระบบในการเบิกสื่อประชาสัมพันธ์
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {ratingOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className={`
                                        cursor-pointer flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
                                        ${satisfaction === option.value
                                            ? 'bg-[#9063d2] text-white border-[#9063d2] shadow-md transform scale-105'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#9063d2] hover:bg-purple-50'}
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="satisfaction"
                                        value={option.value}
                                        checked={satisfaction === option.value}
                                        onChange={() => setSatisfaction(option.value)}
                                        className="hidden"
                                    />
                                    <span className="font-medium text-sm text-center">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* ข้อ 2 */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <p className="font-bold text-gray-800 text-lg mb-4 flex gap-2">
                            <span className="bg-purple-100 text-[#9063d2] w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">2</span>
                            ระบบนี้ช่วยให้ท่านสามารถดำเนินการได้สะดวกและรวดเร็วมากน้อยเพียงใด
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {ratingOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className={`
                                        cursor-pointer flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
                                        ${convenience === option.value
                                            ? 'bg-[#9063d2] text-white border-[#9063d2] shadow-md transform scale-105'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#9063d2] hover:bg-purple-50'}
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="convenience"
                                        value={option.value}
                                        checked={convenience === option.value}
                                        onChange={() => setConvenience(option.value)}
                                        className="hidden"
                                    />
                                    <span className="font-medium text-sm text-center">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* ข้อ 3 */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <p className="font-bold text-gray-800 text-lg mb-4 flex gap-2">
                            <span className="bg-purple-100 text-[#9063d2] w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">3</span>
                            ท่านจะกลับมาใช้งานระบบนี้อีกหรือไม่
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { val: "definitely", label: "กลับมาใช้งานแน่นอน" },
                                { val: "likely", label: "อาจกลับมาใช้งาน" },
                                { val: "unsure", label: "ไม่แน่ใจ" },
                                { val: "no", label: "ไม่กลับมาใช้งาน" }
                            ].map((item) => (
                                <label
                                    key={item.val}
                                    className={`
                                        flex items-center p-3 rounded-lg border cursor-pointer transition-all
                                        ${reuse === item.val
                                            ? 'border-[#9063d2] bg-purple-50 ring-1 ring-[#9063d2]'
                                            : 'border-gray-200 hover:bg-gray-50'}
                                    `}
                                >
                                    <div className={`
                                        w-5 h-5 rounded-full border flex items-center justify-center mr-3
                                        ${reuse === item.val ? 'border-[#9063d2] bg-[#9063d2]' : 'border-gray-300'}
                                    `}>
                                        {reuse === item.val && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <input
                                        type="radio"
                                        name="reuse"
                                        value={item.val}
                                        checked={reuse === item.val}
                                        onChange={() => setReuse(item.val)}
                                        className="hidden"
                                    />
                                    <span className={`text-sm ${reuse === item.val ? 'font-semibold text-[#9063d2]' : 'text-gray-700'}`}>
                                        {item.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* ข้อ 4 */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <p className="font-bold text-gray-800 text-lg mb-4 flex gap-2">
                            <span className="bg-purple-100 text-[#9063d2] w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">4</span>
                            ท่านจะแนะนำระบบนี้ต่อผู้อื่นหรือไม่
                        </p>
                        <div className="flex gap-4">
                            {[
                                { val: "yes", label: "แนะนำ", icon: "👍" },
                                { val: "no", label: "ไม่แนะนำ", icon: "👎" }
                            ].map((item) => (
                                <label
                                    key={item.val}
                                    className={`
                                        flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer transition-all
                                        ${recommend === item.val
                                            ? 'bg-[#9063d2] text-white border-[#9063d2] shadow-md'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="recommend"
                                        value={item.val}
                                        checked={recommend === item.val}
                                        onChange={() => setRecommend(item.val)}
                                        className="hidden"
                                    />
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="font-semibold">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* ข้อ 5 */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <p className="font-bold text-gray-800 text-lg mb-4 flex gap-2">
                            <span className="bg-purple-100 text-[#9063d2] w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">5</span>
                            ข้อเสนอแนะ
                        </p>
                        <div className="relative">
                            <textarea
                                className="textarea w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9063d2] focus:border-transparent min-h-[100px]"
                                placeholder="ระบุข้อเสนอแนะเพิ่มเติมเพื่อการปรับปรุง..."
                                value={suggestion}
                                onChange={(e) => setSuggestion(e.target.value)}
                            ></textarea>
                            {/* Paper Airplane Icon (SVG) */}
                            <div className="absolute bottom-3 right-3 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg text-gray-600 hover:bg-gray-200 transition font-medium"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-8 py-2.5 rounded-lg bg-[#9063d2] text-white hover:bg-[#7e4ec2] shadow-lg shadow-purple-200 transform transition hover:-translate-y-0.5 font-semibold"
                    >
                        ยืนยันและส่งข้อมูล
                    </button>
                </div>
            </div>
        </div>
    );
}