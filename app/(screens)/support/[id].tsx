import { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useTicketStore } from '@/store/useTicketStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TicketDetailScreen() {
    const { id } = useLocalSearchParams();
    const getTicketDetails = useTicketStore((state) => state.getTicketDetails);
    const currentTicket = useTicketStore((state) => state.currentTicket);
    const isLoading = useTicketStore((state) => state.isLoading);
    const sendMessage = useTicketStore((state) => state.sendMessage);
    const { getToken } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const loadTicket = async () => {
            if (id) {
                const token = await getToken();
                if (token) {
                    getTicketDetails(id as string, token);
                }
            }
        };
        loadTicket();
    }, [id]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        setSending(true);
        try {
            const token = await getToken();
            if (token) {
                await sendMessage(id as string, newMessage, token);
                setNewMessage('');
            }
        } catch (error) {
            // error handled in store
        } finally {
            setSending(false);
        }
    };

    if (isLoading && !currentTicket) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (!currentTicket) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text>Ticket not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: `Ticket #${currentTicket.ticketNumber || currentTicket._id?.substring(0, 8)}`,
                    headerBackTitle: 'Back'
                }}
            />

            {/* Ticket Info Header */}
            <View className="bg-white p-4 border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-900 mb-1">{currentTicket.subject}</Text>
                <View className="flex-row items-center mb-2">
                    <View className={`px-2 py-0.5 rounded mr-2 bg-gray-200`}>
                        <Text className="text-xs font-bold text-gray-700">{currentTicket.status.toUpperCase()}</Text>
                    </View>
                    <Text className="text-xs text-gray-500">{new Date(currentTicket.createdAt).toLocaleDateString('ar-EG')}</Text>
                </View>
                <View className="bg-blue-50 p-2 rounded">
                    <Text className="text-xs text-blue-700">ℹ️ We aim to respond within 24 hours.</Text>
                </View>
            </View>

            {/* Messages */}
            <FlatList
                data={currentTicket.messages || []} // Assuming messages are populated
                keyExtractor={(item, index) => item._id || index.toString()}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => {
                    const isUser = item.senderRole === 'user';
                    return (
                        <View className={`mb-4 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {!isUser && (
                                <View className="w-8 h-8 rounded-full bg-gray-300 items-center justify-center mr-2">
                                    <Text className="text-xs font-bold text-gray-600">SP</Text>
                                </View>
                            )}
                            <View className={`max-w-[80%] p-3 rounded-2xl ${isUser ? 'bg-black rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'
                                }`}>
                                <Text className={`text-base ${isUser ? 'text-white' : 'text-gray-800'}`}>
                                    {item.message}
                                </Text>
                                <Text className={`text-[10px] mt-1 text-right ${isUser ? 'text-gray-400' : 'text-gray-400'}`}>
                                    {new Date(item.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View className="items-center py-10">
                        <Text className="text-gray-400 mb-2">No messages yet.</Text>
                        <Text className="text-gray-500 text-center px-10">
                            {currentTicket.description}
                        </Text>
                    </View>
                }
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <View className="bg-white p-3 border-t border-gray-200 flex-row items-center">
                    <TouchableOpacity className="p-2 mr-2">
                        <Ionicons name="attach" size={24} color="#666" />
                    </TouchableOpacity>
                    <TextInput
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 max-h-24"
                        placeholder="Type a message..."
                        multiline
                        value={newMessage}
                        onChangeText={setNewMessage}
                    />
                    <TouchableOpacity
                        className={`p-2 rounded-full ${!newMessage.trim() ? 'bg-gray-200' : 'bg-black'}`}
                        onPress={handleSend}
                        disabled={sending || !newMessage.trim()}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons name="arrow-up" size={20} color={!newMessage.trim() ? '#999' : 'white'} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
