import { useState } from 'react';
import { View, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { toast } from 'sonner-native';
import { Text } from '@/components/ui/text';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useTicketStore } from '@/store/useTicketStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker'; // Check specific package if installed, or use standard UI
// Assuming standard Picker or building simple select if not available. 
// Package json had @react-native-picker/picker.

export default function CreateTicketScreen() {
  const router = useRouter();
  const createTicket = useTicketStore((state) => state.createTicket);
  const isLoading = useTicketStore((state) => state.isLoading);
  const { getToken } = useAuth();

  const [type, setType] = useState('support');
  const [category, setCategory] = useState('order_issue');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  // const [orderId, setOrderId] = useState(''); // Could select from list

  const handleSubmit = async () => {
    if (!subject || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error('You must be logged in to create a ticket');
        return;
      }

      await createTicket({
        type,
        category,
        subject,
        description,
        // relatedOrderId: orderId
      }, token);
      toast.success('Ticket created successfully');
      router.back();
    } catch (error: any) {
      const storeError = useTicketStore.getState().error;
      toast.error(storeError || error.message || 'Failed to create ticket');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'New Request', headerBackTitle: 'Cancel' }} />

      <ScrollView className="flex-1 p-5">

        {/* Type Selection */}
        <Text className="text-sm font-bold text-gray-700 mb-2">Ticket Type</Text>
        <View className="flex-row mb-4 space-x-3">
          <Pressable
            onPress={() => setType('support')}
            className={`flex-1 py-3 rounded-lg border items-center ${type === 'support' ? 'bg-black border-black' : 'bg-white border-gray-300'}`}            accessibilityRole="button"
            accessibilityLabel="General Support"
            accessibilityState={{ selected: type === 'support' }}
          >
            <Text className={type === 'support' ? 'text-white font-medium' : 'text-gray-700'}>General Support</Text>
          </Pressable>
          <Pressable
            onPress={() => setType('complaint')}
            className={`flex-1 py-3 rounded-lg border items-center ${type === 'complaint' ? 'bg-black border-black' : 'bg-white border-gray-300'}`}            accessibilityRole="button"
            accessibilityLabel="Complaint / Dispute"
            accessibilityState={{ selected: type === 'complaint' }}
          >
            <Text className={type === 'complaint' ? 'text-white font-medium' : 'text-gray-700'}>Complaint / Dispute</Text>
          </Pressable>
        </View>

        {/* Category Selection */}
        <Text className="text-sm font-bold text-gray-700 mb-2">Category</Text>
        <View className="border border-gray-300 rounded-lg mb-4 overflow-hidden">
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
          >
            <Picker.Item label="Order Issue" value="order_issue" />
            <Picker.Item label="Payment Issue" value="payment_issue" />
            <Picker.Item label="Merchant Complaint" value="merchant_complaint" />
            <Picker.Item label="Product Quality (Dispute)" value="product_report" />
            <Picker.Item label="Fraud / Scams" value="fraud" />
            <Picker.Item label="Health Risk" value="health_risk" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        {/* Subject */}
        <Text className="text-sm font-bold text-gray-700 mb-2">Subject</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 mb-4 text-base"
          placeholder="Brief summary of the issue"
          value={subject}
          onChangeText={setSubject}
        />

        {/* Description */}
        <Text className="text-sm font-bold text-gray-700 mb-2">Description</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 mb-6 text-base h-32"
          placeholder="Provide detailed information..."
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        {/* Attachments Placeholder */}
        <Pressable
          className="border-dashed border-2 border-gray-300 rounded-lg p-4 items-center mb-6"          onPress={() => toast('Photo attachments will be supported in a future update.')}
          accessibilityRole="button"
          accessibilityLabel="Tap to upload images (proof)"
        >
          <Text className="text-gray-500">Tap to upload images (proof)</Text>
        </Pressable>

        {/* Submit Button */}
        <Pressable
          className={`py-4 rounded-lg items-center ${isLoading ? 'bg-gray-400' : 'bg-black'}`}          onPress={handleSubmit}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Submit Request"
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Submit Request</Text>
          )}
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}
