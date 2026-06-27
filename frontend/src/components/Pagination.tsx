"use client";

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

function getVisiblePages(currentPage: number, totalPages: number) {
    const safeTotal = Math.max(1, totalPages);
    const safeCurrent = Math.min(Math.max(currentPage, 1), safeTotal);
    const maxVisible = 3;

    if (safeTotal <= maxVisible) {
        return Array.from({ length: safeTotal }, (_, index) => index + 1);
    }

    let start = safeCurrent - 1;
    let end = safeCurrent + 1;

    if (start < 1) {
        start = 1;
        end = maxVisible;
    }

    if (end > safeTotal) {
        end = safeTotal;
        start = safeTotal - maxVisible + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const safeTotal = Math.max(1, totalPages);
    const safeCurrent = Math.min(Math.max(currentPage, 1), safeTotal);
    const visiblePages = getVisiblePages(safeCurrent, safeTotal);
    const firstVisiblePage = visiblePages[0] ?? 1;
    const lastVisiblePage = visiblePages[visiblePages.length - 1] ?? 1;

    const goToPage = (page: number) => {
        onPageChange(Math.min(Math.max(page, 1), safeTotal));
    };

    const buttonClass = (active = false) =>
        `px-3 py-2 rounded-md text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${active
            ? "bg-[#9063d2] text-white"
            : "bg-gray-200 text-gray-600 hover:bg-[#9063d2] hover:text-white"
        }`;

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            <button
                type="button"
                onClick={() => goToPage(1)}
                disabled={safeCurrent === 1}
                className={buttonClass()}
            >
                แรกสุด
            </button>
            <button
                type="button"
                onClick={() => goToPage(safeCurrent - 1)}
                disabled={safeCurrent === 1}
                className={buttonClass()}
            >
                ก่อนหน้า
            </button>

            {firstVisiblePage > 1 && <span className="px-1 text-gray-500">...</span>}

            {visiblePages.map((page) => (
                <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={buttonClass(safeCurrent === page)}
                >
                    {page}
                </button>
            ))}

            {lastVisiblePage < safeTotal && <span className="px-1 text-gray-500">...</span>}

            <button
                type="button"
                onClick={() => goToPage(safeCurrent + 1)}
                disabled={safeCurrent === safeTotal}
                className={buttonClass()}
            >
                ถัดไป
            </button>
            <button
                type="button"
                onClick={() => goToPage(safeTotal)}
                disabled={safeCurrent === safeTotal}
                className={buttonClass()}
            >
                หลังสุด
            </button>
        </div>
    );
}
