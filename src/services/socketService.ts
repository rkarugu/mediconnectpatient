/**
 * Socket service — now delegates to Pusher.
 * Maintains the same public API (on/off/connect/disconnect) so existing
 * screens that import socketService continue to work without changes.
 */
import pusherService from './pusherService';

class SocketService {
  private patientId: number | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  async connect(token: string, userType: 'patient' | 'medical_worker', userId: number) {
    this.patientId = userId;
    pusherService.connect(token, userType, userId);

    // Bind all known patient events on the private channel
    const privateChannel = `private-patient.${userId}`;
    const events = [
      'medic.assigned',
      'medic.arrived',
      'medic.completed',
      'medic.location_updated',
      'service_request.accepted',
      'service_request.declined',
      'service_request.cancelled',
      'service_request.status_changed',
      'treatment.started',
      'service.completed',
      'payment.processed',
      'review.requested',
      'lab_request.created',
      'lab_result.completed',
      'lab_results.ready',
      'notification',
      'new.message',
    ];

    events.forEach((event) => {
      pusherService.on(privateChannel, `.${event}`, (data: any) => {
        console.log(`[Pusher] ${event}:`, data);
        this.triggerHandlers(event, data);
      });
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
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * Subscribe to an additional Pusher private channel (e.g. service-request.{id})
   */
  subscribe(channels: string[]) {
    channels.forEach((ch) => pusherService.subscribePrivate(ch));
  }

  unsubscribe(channels: string[]) {
    channels.forEach((ch) => pusherService.unsubscribe(`private-${ch}`));
  }

  disconnect() {
    pusherService.disconnect();
    this.eventHandlers.clear();
    this.patientId = null;
    console.log('Socket/Pusher disconnected');
  }

  isConnected(): boolean {
    return pusherService.isConnected();
  }

  emit(_event: string, _data: any) {
    console.warn('emit() is deprecated with Pusher. Use API calls instead.');
  }

  ping() {
    console.log('Pusher connection state:', pusherService.isConnected() ? 'connected' : 'disconnected');
  }
}

export default new SocketService();
