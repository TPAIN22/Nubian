import {create} from 'zustand';

export default useItemStore = create((set) => ({
        item: null,
        setItem: (item) => set(() => ({ item })),
    }));
    