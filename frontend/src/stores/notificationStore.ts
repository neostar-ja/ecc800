import { create } from 'zustand';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface NotificationStore {
  notification: Notification | null;
  showNotification: (message: string, type?: Notification['type']) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notification: null,
  
  showNotification: (message: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    set({ notification: { id, message, type } });
  },
  
  hideNotification: () => {
    set({ notification: null });
  },
}));
