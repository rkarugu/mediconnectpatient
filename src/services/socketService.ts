import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers: Map<string, Function[]> = new Map();

  async connect(token: string, userType: 'patient' | 'medical_worker', userId: number) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    // Use your local IP for mobile device access
    const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://10.210.19.13:3000';

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
        userId,
        userType,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('connected', (data) => {
      console.log('Connected to notification server:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Patient-specific events
    this.socket.on('medic.assigned', (data) => {
      console.log('Medic assigned:', data);
      this.triggerHandlers('medic.assigned', data);
    });

    this.socket.on('medic.arrived', (data) => {
      console.log('Medic arrived:', data);
      this.triggerHandlers('medic.arrived', data);
    });

    this.socket.on('medic.completed', (data) => {
      console.log('Service completed:', data);
      this.triggerHandlers('medic.completed', data);
    });

    this.socket.on('payment.processed', (data) => {
      console.log('Payment processed:', data);
      this.triggerHandlers('payment.processed', data);
    });

    this.socket.on('review.requested', (data) => {
      console.log('Review requested:', data);
      this.triggerHandlers('review.requested', data);
    });

    // Service request events
    this.socket.on('service_request.accepted', (data) => {
      console.log('Service request accepted by medic:', data);
      this.triggerHandlers('service_request.accepted', data);
    });

    this.socket.on('service_request.declined', (data) => {
      console.log('Service request declined:', data);
      this.triggerHandlers('service_request.declined', data);
    });

    this.socket.on('service_request.cancelled', (data) => {
      console.log('Service request cancelled:', data);
      this.triggerHandlers('service_request.cancelled', data);
    });

    // Treatment and service events
    this.socket.on('treatment.started', (data) => {
      console.log('Treatment started:', data);
      this.triggerHandlers('treatment.started', data);
    });

    this.socket.on('service.completed', (data) => {
      console.log('Service completed:', data);
      this.triggerHandlers('service.completed', data);
    });

    // Lab request events
    this.socket.on('lab_request.created', (data) => {
      console.log('Lab request created:', data);
      this.triggerHandlers('lab_request.created', data);
    });

    this.socket.on('lab_results.ready', (data) => {
      console.log('Lab results ready:', data);
      this.triggerHandlers('lab_results.ready', data);
    });

    // Medic location update for live tracking
    this.socket.on('medic.location_update', (data) => {
      console.log('Medic location update:', data);
      this.triggerHandlers('medic.location_update', data);
    });

    // Generic notification event
    this.socket.on('notification', (data) => {
      console.log('Generic notification:', data);
      this.triggerHandlers('notification', data);
    });
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
  }

  off(event: string, handler?: Function) {
    if (!handler) {
      this.eventHandlers.delete(event);
      return;
    }
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private triggerHandlers(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  subscribe(channels: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe', channels);
    }
  }

  unsubscribe(channels: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', channels);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventHandlers.clear();
      console.log('Socket disconnected manually');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
      this.socket.once('pong', (data) => {
        console.log('Pong received:', data);
      });
    }
  }
}

export default new SocketService();
