import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../api/axiosClient';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,
  isLoading: false,

  initSocket: (userId) => {
    if (get().socket) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Connected to Notification Socket');
      socket.emit('join', userId);
    });

    socket.on('notification', (newNotif) => {
      set((state) => ({
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
      
      // Optional: Show browser notification or toast
      if (Notification.permission === 'granted') {
        new Notification('OIMS Update', { body: newNotif.message });
      }
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        const notifs = res.data.data;
        set({ 
          notifications: notifs,
          unreadCount: notifs.filter(n => !n.isRead).length,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      set((state) => ({
        notifications: state.notifications.map(n => 
          n._id === notifId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }
}));

export default useNotificationStore;
