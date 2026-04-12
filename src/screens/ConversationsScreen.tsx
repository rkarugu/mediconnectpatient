import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import chatService, { Conversation } from '../services/chatService';

interface Props {
  navigation: any;
}

export default function ConversationsScreen({ navigation }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const prevUnreadRef = useRef<number>(-1);
  const soundRef = useRef<Audio.Sound | null>(null);

  const playSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/message.wav'),
          { shouldPlay: true, volume: 1.0 }
        );
        soundRef.current = sound;
      }
      Vibration.vibrate(300);
    } catch (e) {
      Vibration.vibrate(300);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const result = await chatService.getConversations();
      const list = Array.isArray(result) ? result : (result?.data ?? []);
      setConversations(list);

      // Check if unread count increased → play notification
      const totalUnread = list.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
      if (prevUnreadRef.current >= 0 && totalUnread > prevUnreadRef.current) {
        playSound();
      }
      prevUnreadRef.current = totalUnread;
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [playSound]);

  useEffect(() => {
    loadConversations();

    // Poll every 5 seconds
    const poll = setInterval(loadConversations, 5000);

    return () => {
      clearInterval(poll);
      soundRef.current?.unloadAsync();
    };
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const medicName = item.medical_worker?.first_name || item.medical_worker?.name || 'Medic';
    const preview = item.latest_message?.body || 'No messages yet';
    const unread = item.unread_count || 0;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.id,
            title: medicName,
          })
        }
      >
        <View style={styles.avatar}>
          <Ionicons name="person-circle" size={48} color="#0B3D6B" />
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {medicName}
            </Text>
            <Text style={styles.conversationTime}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>
          <View style={styles.conversationFooter}>
            <Text style={styles.conversationPreview} numberOfLines={1}>
              {preview}
            </Text>
            {item.status === 'closed' ? (
              <View style={styles.archivedBadge}>
                <Text style={styles.archivedBadgeText}>Archived</Text>
              </View>
            ) : unread > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B3D6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      {conversations.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Chats will appear here once a medic accepts your request.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B3D6B']} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    backgroundColor: '#0B3D6B',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: { marginRight: 12 },
  conversationContent: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  conversationName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  conversationTime: { fontSize: 12, color: '#999', marginLeft: 8 },
  conversationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  conversationPreview: { fontSize: 14, color: '#666', flex: 1 },
  badge: {
    backgroundColor: '#0B3D6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  archivedBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  archivedBadgeText: { color: '#92400E', fontSize: 11, fontWeight: '600' },
  emptyText: { fontSize: 18, color: '#666', marginTop: 12, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 6, textAlign: 'center' },
});
