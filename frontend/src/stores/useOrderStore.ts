import { create } from "zustand";

interface OrderState {
    orderCount: number;
    setOrderCount: (count: number) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
    orderCount: 0,
    setOrderCount: (count) => set({ orderCount: count }),
}));
