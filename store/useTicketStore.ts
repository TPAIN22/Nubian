import { create } from 'zustand';
import axios from 'axios';
import { Platform } from 'react-native';

// Configure Base URL based on environment (simplified for now, ideally use env vars)
// Assuming running on emulator/device. 
// Android Emulator uses 10.0.2.2 for localhost. iOS uses localhost.
const getBaseUrl = () => {
    // Basic check, might need adjustment based on user's setup
    // Use local network IP for physical devices/emulators to ensure connectivity
    return 'http://192.168.0.115:5000/api';
};

const API_URL = getBaseUrl();

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

interface Message {
    _id: string;
    senderRole: string;
    message: string;
    createdAt: string;
}

interface TicketStore {
    tickets: Ticket[];
    currentTicket: any | null;
    isLoading: boolean;
    error: string | null;
    
    fetchTickets: (token: string, filters?: any) => Promise<void>;
    getTicketDetails: (id: string, token: string) => Promise<void>;
    createTicket: (data: any, token: string) => Promise<void>;
    sendMessage: (ticketId: string, message: string, token: string, attachments?: any[]) => Promise<void>;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
    tickets: [],
    currentTicket: null,
    isLoading: false,
    error: null,

    fetchTickets: async (token: string, filters?: any) => {
        set({ isLoading: true, error: null });
        try {
            const params = new URLSearchParams();
            if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
            if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());
            
            console.log(`Fetching tickets from: ${API_URL}/tickets`);

            const response = await axios.get(`${API_URL}/tickets?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000 // 10s timeout
            });
            set({ tickets: response.data.data || [], isLoading: false });
        } catch (error: any) {
            console.error('Fetch tickets error:', error);
            set({ error: error.message, isLoading: false });
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
            // Enhanced error handling for backend validation errors
            const errorMessage = error.response?.data?.message || error.message;
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
