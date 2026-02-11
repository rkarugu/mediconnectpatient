import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createNavigationContainerRef } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import socketService from '../services/socketService';
import { MedicAcceptedModal } from '../components/MedicAcceptedModal';

// Navigation ref for navigating from outside components
export const navigationRef = createNavigationContainerRef<any>();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface MedicData {
  request_id: number;
  medic_id: number;
  medic_name: string;
  medic_phone?: string;
  medic_email?: string;
  medic_photo?: string;
  specialty?: string;
  subspecialty?: string;
  years_of_experience?: string;
  rating?: number;
  estimated_arrival?: string;
}

interface NotificationContextType {
  isConnected: boolean;
  unreadCount: number;
  connect: () => void;
  disconnect: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  isConnected: false,
  unreadCount: 0,
  connect: () => {},
  disconnect: () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

interface Props {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: Props) {
  const { isAuthenticated, token, user } = useAuthStore();
  const [isConnected, setIsConnected] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [showMedicModal, setShowMedicModal] = useState(false);
  const [medicData, setMedicData] = useState<MedicData | null>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  const connect = useCallback(() => {
    if (!token || !user?.id) return;

    socketService.connect(token, 'patient', user.id);
  }, [token, user?.id]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id) {
      disconnect();
      return;
    }

    // Connect to socket
    connect();

    // Listen to connection status
    socketService.on('connected', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketService.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Listen to notification events
    const handleNotification = async (data: any) => {
      console.log('Notification received:', data);
      setUnreadCount(prev => prev + 1);

      // Show local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title || 'MediConnect',
          body: data.message || 'You have a new notification',
          data: data,
        },
        trigger: null, // Show immediately
      });
    };

    // Subscribe to patient-specific events
    socketService.on('medic.assigned', (data) => {
      handleNotification({
        title: 'Medic Assigned',
        message: `${data.medic_name || 'A medic'} has been assigned to your request`,
        ...data,
      });
    });

    socketService.on('medic.arrived', (data) => {
      handleNotification({
        title: '📍 Medic Arrived',
        message: data.message || 'Your medic has arrived at your location',
        ...data,
      });
    });

    socketService.on('treatment.started', (data) => {
      handleNotification({
        title: '💊 Treatment Started',
        message: data.message || 'Your treatment has started',
        ...data,
      });
    });

    socketService.on('service.completed', (data) => {
      handleNotification({
        title: '✅ Service Completed',
        message: data.message || 'Your medical service has been completed. Please rate your experience.',
        ...data,
      });
    });

    socketService.on('medic.completed', (data) => {
      handleNotification({
        title: 'Service Completed',
        message: 'Your medical service has been completed',
        ...data,
      });
    });

    socketService.on('payment.processed', (data) => {
      handleNotification({
        title: 'Payment Processed',
        message: `Your payment of ${data.amount || ''} has been processed`,
        ...data,
      });
    });

    socketService.on('notification', handleNotification);

    // Handle service request accepted by medic - show modal popup
    socketService.on('service_request.accepted', (data) => {
      console.log('Medic accepted request:', data);
      setMedicData(data);
      setShowMedicModal(true);
      
      // Also show a notification
      handleNotification({
        title: '🎉 Medic Accepted!',
        message: `${data.medic_name || 'A medic'} has accepted your request and is on the way`,
        ...data,
      });
    });

    socketService.on('service_request.declined', (data) => {
      handleNotification({
        title: 'Request Update',
        message: 'Your request is being reassigned to another medic',
        ...data,
      });
    });

    // Lab request created - patient needs to consent/pay
    socketService.on('lab_request.created', (data) => {
      const paymentMethod = data.payment_method || 'wallet';
      const paymentLabel = paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'wallet' ? 'Wallet' : paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'insurance' ? 'Insurance' : 'Wallet';

      handleNotification({
        title: '🧪 Lab Test Requested',
        message: data.message || 'Your doctor has ordered lab tests. Please review and confirm.',
        ...data,
      });
      
      // Show alert to navigate to consent screen
      Alert.alert(
        '🧪 Lab Tests Ordered',
        `${data.medic_name || 'Your doctor'} has ordered lab tests.\n\nTotal: KES ${data.total_amount?.toLocaleString() || '0'}\nPayment via: ${paymentLabel}\n\nPlease review and confirm payment to proceed with sample collection.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: `Review & Pay via ${paymentLabel}`,
            onPress: () => {
              // Navigate using the navigation service
              if (data.request_id) {
                navigationRef.current?.navigate('LabConsent', { requestId: data.request_id });
              }
            },
          },
        ]
      );
    });

    // Lab results ready notification
    socketService.on('lab_results.ready', (data) => {
      handleNotification({
        title: '🧪 Lab Results Ready',
        message: data.message || 'Your lab test results are ready to view',
        ...data,
      });
    });

    return () => {
      socketService.off('connected');
      socketService.off('disconnect');
      socketService.off('medic.assigned');
      socketService.off('medic.arrived');
      socketService.off('medic.completed');
      socketService.off('payment.processed');
      socketService.off('notification');
      socketService.off('service_request.accepted');
      socketService.off('service_request.declined');
      socketService.off('lab_results.ready');
      socketService.off('treatment.started');
      socketService.off('service.completed');
      socketService.off('lab_request.created');
      disconnect();
    };
  }, [isAuthenticated, token, user?.id, connect, disconnect]);

  // Set up notification listeners
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Handle notification tap - navigate to relevant screen
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const value = {
    isConnected,
    unreadCount,
    connect,
    disconnect,
  };

  const handleCloseMedicModal = () => {
    setShowMedicModal(false);
    setMedicData(null);
  };

  const handleViewRequest = () => {
    // TODO: Navigate to request details screen
    console.log('Navigate to request:', medicData?.request_id);
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <MedicAcceptedModal
        visible={showMedicModal}
        data={medicData}
        onClose={handleCloseMedicModal}
        onViewRequest={handleViewRequest}
      />
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
