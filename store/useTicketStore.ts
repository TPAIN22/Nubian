import { create } from 'zustand';
import axios from 'axios';
import { resolveApiBaseUrl } from '@/services/api/baseUrl';

const API_URL = resolveApiBaseUrl().replace(/\/$/, '');

interface Ticket {
    _id: string;
    ticketNumber: string;
    type: string;
    category: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    slaDeadline?: string;
}

interface TicketStore {
    tickets: Ticket[];
    currentTicket: any | null;
    isLoading: boolean;
    error: string | null;
    pagination: { page: number; limit: number; total: number; totalPages: number } | null;
    isLoadingMore: boolean;

    fetchTickets: (token: string, filters?: any) => Promise<void>;
    loadMore: (token: string, filters?: any) => Promise<void>;
    getTicketDetails: (id: string, token: string) => Promise<void>;
    createTicket: (data: any, token: string) => Promise<void>;
    sendMessage: (ticketId: string, message: string, token: string, attachments?: any[]) => Promise<void>;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
    tickets: [],
    currentTicket: null,
    isLoading: false,
    error: null,
    pagination: null,
    isLoadingMore: false,

    fetchTickets: async (token: string, filters?: any) => {
        set({ isLoading: true, error: null });
        try {
            const page = filters?.page ?? 1;
            const limit = filters?.limit ?? 20;
            const params = new URLSearchParams();
            if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
            if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
            params.append('page', page.toString());
            params.append('limit', limit.toString());

            console.log(`Fetching tickets from: ${API_URL}/tickets`);

            const response = await axios.get(`${API_URL}/tickets?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000 // 10s timeout
            });
            set({
                tickets: response.data.data || [],
                pagination: response.data.pagination || null,
                isLoading: false,
            });
        } catch (error: any) {
            console.error('Fetch tickets error:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    loadMore: async (token: string, filters?: any) => {
        const { isLoadingMore, pagination, tickets } = get();
        if (isLoadingMore) return;
        if (!pagination) return;
        if (pagination.page >= pagination.totalPages) return;

        set({ isLoadingMore: true });
        try {
            const nextPage = pagination.page + 1;
            const limit = pagination.limit;
            const params = new URLSearchParams();
            if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
            if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
            params.append('page', nextPage.toString());
            params.append('limit', limit.toString());

            const response = await axios.get(`${API_URL}/tickets?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000
            });

            const incoming: Ticket[] = response.data.data || [];
            const existingIds = new Set(tickets.map((t) => t._id));
            const merged = [...tickets, ...incoming.filter((t) => !existingIds.has(t._id))];

            set({
                tickets: merged,
                pagination: response.data.pagination || null,
            });
        } catch (error: any) {
            console.error('Load more tickets error:', error);
            set({ error: error.message });
        } finally {
            set({ isLoadingMore: false });
        }
    },

    getTicketDetails: async (id: string, token: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/tickets/${id}`, {
                 headers: { Authorization: `Bearer ${token}` },
                 timeout: 10000
            });
            set({ currentTicket: response.data.data, isLoading: false });
        } catch (error: any) {
             console.error('Fetch ticket details error:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    createTicket: async (data: any, token: string) => {
        set({ isLoading: true, error: null });
        try {
            await axios.post(`${API_URL}/tickets`, data, {
                 headers: { Authorization: `Bearer ${token}` },
                 timeout: 10000
            });
            // Refresh list
            await get().fetchTickets(token);
            set({ isLoading: false });
        } catch (error: any) {
            console.error('Create ticket error:', error);
            const validationErrors = error.response?.data?.errors;
            let errorMessage: string;
            if (Array.isArray(validationErrors) && validationErrors.length > 0) {
                errorMessage = validationErrors
                    .map((e: any) => e?.msg || e?.message)
                    .filter(Boolean)
                    .join(', ');
            } else {
                errorMessage = error.response?.data?.message || error.message;
            }
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    sendMessage: async (ticketId: string, message: string, token: string, attachments?: any[]) => {
         try {
            await axios.post(`${API_URL}/tickets/${ticketId}/messages`, { message, attachments }, {
                 headers: { Authorization: `Bearer ${token}` },
                 timeout: 10000
            });
            // Refresh detailed view
            await get().getTicketDetails(ticketId, token);
        } catch (error: any) {
            console.error('Send message error:', error);
            throw error;
        }
    }
}));
