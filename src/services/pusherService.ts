import 'react-native-get-random-values';
// pusher-js react-native build uses named export
import PusherModule from 'pusher-js';
const Pusher = (PusherModule as any).Pusher || PusherModule;
type Channel = any;
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../config/api';

const PUSHER_APP_KEY = '0822de758396f0268f95';
const PUSHER_CLUSTER = 'mt1';

class PusherService {
  private pusher: any | null = null;
  private channels: Map<string, Channel> = new Map();
  private eventHandlers: Map<string, Map<string, Function[]>> = new Map();

  connect(token: string, userType: 'patient' | 'medical_worker', userId: number) {
    if (this.pusher) {
      console.log('Pusher already connected');
      return;
    }

    // Build auth endpoint from API base URL
    const authEndpoint = API_BASE_URL.replace('/api', '') + '/api/broadcasting/auth';

    this.pusher = new Pusher(PUSHER_APP_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
      authEndpoint,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    });

    this.pusher.connection.bind('connected', () => {
      console.log('Pusher connected');
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('Pusher disconnected');
    });

    this.pusher.connection.bind('error', (err: any) => {
      console.error('Pusher connection error:', err);
    });

    // Auto-subscribe to the patient's private channel
    this.subscribePrivate(`patient.${userId}`);
  }

  subscribePrivate(channelName: string): Channel | null {
    if (!this.pusher) {
      console.warn('Pusher not connected');
      return null;
    }

    const fullName = `private-${channelName}`;
    if (this.channels.has(fullName)) {
      return this.channels.get(fullName)!;
    }

    const channel = this.pusher.subscribe(fullName);
    this.channels.set(fullName, channel);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log(`Subscribed to private channel: ${channelName}`);
    });

    channel.bind('pusher:subscription_error', (err: any) => {
      console.error(`Subscription error for ${channelName}:`, err);
    });

    // Bind any handlers that were registered before subscription
    const channelHandlers = this.eventHandlers.get(fullName);
    if (channelHandlers) {
      channelHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          channel.bind(event, handler as any);
        });
      });
    }

    return channel;
  }

  subscribePublic(channelName: string): Channel | null {
    if (!this.pusher) {
      console.warn('Pusher not connected');
      return null;
    }

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log(`Subscribed to public channel: ${channelName}`);
    });

    const channelHandlers = this.eventHandlers.get(channelName);
    if (channelHandlers) {
      channelHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          channel.bind(event, handler as any);
        });
      });
    }

    return channel;
  }

  /**
   * Listen for an event on a channel.
   * Events from Laravel broadcastAs() are prefixed with '.' by Pusher.
   */
  on(channelName: string, event: string, handler: Function) {
    const fullName = this.channels.has(channelName) ? channelName : channelName;

    if (!this.eventHandlers.has(fullName)) {
      this.eventHandlers.set(fullName, new Map());
    }
    const channelHandlers = this.eventHandlers.get(fullName)!;
    if (!channelHandlers.has(event)) {
      channelHandlers.set(event, []);
    }
    channelHandlers.get(event)!.push(handler);

    const channel = this.channels.get(fullName);
    if (channel) {
      channel.bind(event, handler as any);
    }
  }

  /**
   * Convenience: listen on patient's private channel
   */
  onPrivate(channelName: string, event: string, handler: Function) {
    this.on(`private-${channelName}`, event, handler);
  }

  /**
   * Convenience: listen on a public channel
   */
  onPublic(channelName: string, event: string, handler: Function) {
    this.on(channelName, event, handler);
  }

  off(channelName: string, event: string, handler?: Function) {
    const channel = this.channels.get(channelName);
    if (channel) {
      if (handler) {
        channel.unbind(event, handler as any);
      } else {
        channel.unbind(event);
      }
    }

    const channelHandlers = this.eventHandlers.get(channelName);
    if (channelHandlers) {
      if (handler) {
        const handlers = channelHandlers.get(event);
        if (handlers) {
          const idx = handlers.indexOf(handler);
          if (idx > -1) handlers.splice(idx, 1);
        }
      } else {
        channelHandlers.delete(event);
      }
    }
  }

  unsubscribe(channelName: string) {
    if (!this.pusher) return;

    this.pusher.unsubscribe(channelName);
    this.channels.delete(channelName);
    this.eventHandlers.delete(channelName);
    console.log(`Unsubscribed from: ${channelName}`);
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.channels.clear();
      this.eventHandlers.clear();
      console.log('Pusher disconnected');
    }
  }

  isConnected(): boolean {
    return this.pusher?.connection?.state === 'connected';
  }

  getChannel(channelName: string): Channel | undefined {
    return this.channels.get(channelName);
  }
}

export default new PusherService();
