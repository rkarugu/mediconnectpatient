import { apiClient } from '../config/api';

export interface Conversation {
  id: number;
  service_request_id: number | null;
  patient_id: number;
  medical_worker_id: number;
  status: 'active' | 'closed';
  last_message_at: string | null;
  created_at: string;
  patient?: { id: number; name: string; first_name?: string; phone?: string };
  medical_worker?: { id: number; name: string; first_name?: string; phone?: string };
  latest_message?: ChatMessage | null;
  unread_count?: number;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_type: 'patient' | 'medical_worker';
  sender_id: number;
  body: string;
  type: 'text' | 'image' | 'system';
  read_at: string | null;
  created_at: string;
}

class ChatService {
  async getConversations(page = 1): Promise<any> {
    const response = await apiClient.get('/chat/conversations', { params: { page } });
    return response.data.data;
  }

  async getTotalUnread(): Promise<number> {
    try {
      const response = await apiClient.get('/chat/conversations', { params: { page: 1 } });
      const paginator = response.data.data;
      const list = Array.isArray(paginator) ? paginator : (paginator?.data ?? []);
      return list.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
    } catch {
      return 0;
    }
  }

  async getMessages(conversationId: number, page = 1): Promise<any> {
    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`, { params: { page } });
    return { ...response.data.data, conversation_status: response.data.conversation_status };
  }

  async sendMessage(conversationId: number, body: string, type: 'text' | 'image' = 'text'): Promise<ChatMessage> {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, { body, type });
    return response.data.data;
  }

  async markRead(conversationId: number): Promise<void> {
    await apiClient.post(`/chat/conversations/${conversationId}/read`);
  }

  async reopenConversation(conversationId: number): Promise<any> {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/reopen`);
    return response.data;
  }

  async createConversation(patientId: number, medicalWorkerId: number, serviceRequestId?: number): Promise<Conversation> {
    const response = await apiClient.post('/chat/conversations', {
      patient_id: patientId,
      medical_worker_id: medicalWorkerId,
      service_request_id: serviceRequestId,
    });
    return response.data.data;
  }
}

export default new ChatService();
