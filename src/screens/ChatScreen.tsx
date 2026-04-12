import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import chatService, { ChatMessage } from '../services/chatService';
import { useAuthStore } from '../store/authStore';

interface Props {
  route: any;
  navigation: any;
}

export default function ChatScreen({ route, navigation }: Props) {
  const { conversationId, title } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [conversationStatus, setConversationStatus] = useState<'active' | 'closed'>('active');
  const flatListRef = useRef<FlatList>(null);

  const user = useAuthStore((s) => s.user);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioReady = useRef(false);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).then(() => {
      audioReady.current = true;
    }).catch(() => {});
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const playNotificationSound = useCallback(async () => {
    try {
      if (!audioReady.current) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        audioReady.current = true;
      }
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
      console.log('Sound error:', e);
      Vibration.vibrate(300);
    }
  }, []);

  const loadMessages = useCallback(async (pageNum = 1) => {
    try {
      const result = await chatService.getMessages(conversationId, pageNum);
      const raw: ChatMessage[] = result.data ?? result;
      // Track conversation status from API
      if (result.conversation_status) {
        setConversationStatus(result.conversation_status);
      }
      if (pageNum === 1) {
        // Sort all messages oldest-first (ascending by created_at)
        const sorted = [...raw].sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sorted);
      } else {
        // Older messages merge and re-sort everything
        setMessages((prev) => {
          const merged = [...prev, ...raw];
          const unique = merged.filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);
          return unique.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
      setHasMore(raw.length >= 50);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Simple polling: fetch messages every 3s and merge new ones
  useEffect(() => {
    // Initial load
    loadMessages(1);
    chatService.markRead(conversationId).catch(() => {});

    // Poll every 3 seconds for new messages
    const poll = setInterval(async () => {
      try {
        const result = await chatService.getMessages(conversationId, 1);
        console.log('[POLL] raw result type:', typeof result, Array.isArray(result), 'keys:', result ? Object.keys(result).slice(0, 5) : 'null');

        // Handle different response shapes
        let raw: ChatMessage[];
        if (Array.isArray(result)) {
          raw = result;
        } else if (result && Array.isArray(result.data)) {
          raw = result.data;
        } else {
          console.log('[POLL] unexpected result shape, skipping');
          return;
        }

        console.log('[POLL] got', raw.length, 'messages, first id:', raw[0]?.id, 'last id:', raw[raw.length - 1]?.id);

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = raw.filter((m) => !existingIds.has(m.id) && typeof m.id === 'number' && m.id < 1000000000);
          console.log('[POLL] existing:', prev.length, 'new:', newMsgs.length);

          if (newMsgs.length === 0) return prev;

          // Play notification for incoming messages
          const hasIncoming = newMsgs.some((m) => m.sender_type !== 'patient');
          console.log('[POLL] NEW MESSAGES FOUND:', newMsgs.length, 'incoming:', hasIncoming);
          if (hasIncoming) {
            playNotificationSound();
          }
          Vibration.vibrate(500);

          const merged = [...prev, ...newMsgs];
          return merged.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        chatService.markRead(conversationId).catch(() => {});
      } catch (e) {
        console.log('[POLL] error:', e);
      }
    }, 3000);

    return () => {
      clearInterval(poll);
    };
  }, [conversationId]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setText('');

    const optimistic: ChatMessage = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_type: 'patient',
      sender_id: user?.id ?? 0,
      body,
      type: 'text',
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const saved = await chatService.sendMessage(conversationId, body);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? saved : m))
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadMessages(nextPage);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMine = item.sender_type === 'patient';
    const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateLabel = formatDate(item.created_at);
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDate = !prevMsg || formatDate(prevMsg.created_at) !== dateLabel;

    if (item.type === 'system') {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemText}>{item.body}</Text>
        </View>
      );
    }

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{dateLabel}</Text>
          </View>
        )}
        <View style={[styles.messageBubbleRow, isMine ? styles.myRow : styles.theirRow]}>
          <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
            <Text style={[styles.messageText, isMine && styles.myMessageText]}>
              {item.body}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.timeText, isMine && styles.myTimeText]}>{time}</Text>
              {isMine && item.read_at && (
                <Ionicons name="checkmark-done" size={14} color="#A8D5FF" style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>
        </View>
      </>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Chat'}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onScroll={({ nativeEvent }) => {
          if (nativeEvent.contentOffset.y < 50 && hasMore && !loading) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          </View>
        }
      />

      {/* Archived Banner or Input */}
      {conversationStatus === 'closed' ? (
        <View style={styles.archivedContainer}>
          <View style={styles.archivedBanner}>
            <Ionicons name="archive-outline" size={18} color="#92400E" />
            <Text style={styles.archivedText}>This conversation has been archived</Text>
          </View>
          <Text style={styles.archivedSubtext}>The session has ended. Only your medic can reopen this conversation.</Text>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={5000}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!text.trim() || sending}>
            <Ionicons name="send" size={22} color={text.trim() ? '#0B3D6B' : '#ccc'} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    backgroundColor: '#0B3D6B',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600', flex: 1 },
  messagesList: { padding: 12, flexGrow: 1 },
  messageBubbleRow: { marginBottom: 8 },
  myRow: { alignItems: 'flex-end' },
  theirRow: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: { backgroundColor: '#0B3D6B', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, color: '#1a1a1a', lineHeight: 20 },
  myMessageText: { color: '#fff' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'flex-end' },
  timeText: { fontSize: 11, color: '#999' },
  myTimeText: { color: 'rgba(255,255,255,0.7)' },
  systemMessage: { alignItems: 'center', marginVertical: 8 },
  systemText: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },
  sendBtn: { marginLeft: 8, padding: 8, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
  archivedContainer: {
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderTopColor: '#F59E0B',
    padding: 12,
    alignItems: 'center',
  },
  archivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  archivedText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  archivedSubtext: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
