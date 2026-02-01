import { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { useAuthStore } from '../store/authStore';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface NotificationData {
  id: string;
  event: string;
  title: string;
  message: string;
  data: any;
  timestamp: string;
  read: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (user && token) {
      connectSocket();
      setupNotificationHandlers();
    }

    return () => {
      socketService.disconnect();
    };
  }, [user, token]);

  const connectSocket = async () => {
    if (!user || !token) return;

    try {
      await socketService.connect(user.id, 'patient', token);
      console.log('Socket service connected for patient');
    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  };

  const setupNotificationHandlers = () => {
    socketService.on('medic.assigned', handleMedicAssigned);
    socketService.on('medic.arrived', handleMedicArrived);
    socketService.on('medic.completed', handleServiceCompleted);
    socketService.on('payment.processed', handlePaymentProcessed);
    socketService.on('review.requested', handleReviewRequested);
  };

  const handleMedicAssigned = (data: any) => {
    const notification: NotificationData = {
      id: `medic-assigned-${Date.now()}`,
      event: 'medic.assigned',
      title: 'Medic Assigned',
      message: `${data.medic.name} has been assigned to your request`,
      data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    addNotification(notification);
    showLocalNotification(notification.title, notification.message);
  };

  const handleMedicArrived = (data: any) => {
    const notification: NotificationData = {
      id: `medic-arrived-${Date.now()}`,
      event: 'medic.arrived',
      title: 'Medic Arrived',
      message: 'Your medic has arrived at your location',
      data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    addNotification(notification);
    showLocalNotification(notification.title, notification.message);
  };

  const handleServiceCompleted = (data: any) => {
    const notification: NotificationData = {
      id: `service-completed-${Date.now()}`,
      event: 'medic.completed',
      title: 'Service Completed',
      message: 'Your medical service has been completed',
      data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    addNotification(notification);
    showLocalNotification(notification.title, notification.message);
  };

  const handlePaymentProcessed = (data: any) => {
    const notification: NotificationData = {
      id: `payment-processed-${Date.now()}`,
      event: 'payment.processed',
      title: 'Payment Processed',
      message: `Payment of $${data.payment.amount} has been processed`,
      data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    addNotification(notification);
    showLocalNotification(notification.title, notification.message);
  };

  const handleReviewRequested = (data: any) => {
    const notification: NotificationData = {
      id: `review-requested-${Date.now()}`,
      event: 'review.requested',
      title: 'Review Requested',
      message: 'Please rate your experience with the medic',
      data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    addNotification(notification);
    showLocalNotification(notification.title, notification.message);
  };

  const addNotification = (notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const showLocalNotification = async (title: string, body: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isConnected: socketService.isConnected(),
  };
};
