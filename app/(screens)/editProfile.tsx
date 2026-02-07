import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,

} from 'react-native'
import { useState } from 'react'
import { useUser } from '@clerk/clerk-expo'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { toast } from "sonner-native";
import { useTheme } from '@/providers/ThemeProvider'
export default function EditProfile() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: 'بورتسودان ، حي الشاطئ ، شارع النصر'
  })
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (user && profileData.name) {
      const [firstName, ...rest] = profileData.name.split(' ');
      const lastName = rest.length > 0 ? rest.join(' ') : '';
      try {
        setIsEditing(true);
        await user?.update({
          firstName: firstName ?? null,
          lastName: lastName ?? null
        });
        toast.success('تم تغيير الأسم في');
      } catch {
        toast.error('فشل تغيير الأسم');
      }
      finally {
        setIsEditing(false);
      }
    }

  }

  const { user } = useUser();
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.surface }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.cardBackground, borderBottomColor: Colors.borderLight }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: Colors.surface }]} onPress={() => router.push('/profile')}>
          <Text style={[styles.backButtonText, { color: Colors.text.gray }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.text.gray }]}>تعديل الملف الشخصي</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Profile Image Section */}
      <View style={[styles.imageSection, { backgroundColor: Colors.surface }]}>
        <TouchableOpacity onPress={() => { }} style={styles.imageContainer}>
          <Image
            source={
              user?.imageUrl
                ? { uri: user.imageUrl }
                : require('../../assets/images/google.svg')
            }
            style={[styles.profileImage, { borderColor: Colors.primary }]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors.text.gray }]}>الاسم الكامل</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: Colors.cardBackground,
                borderColor: Colors.borderLight,
                color: Colors.text.gray
              }
            ]}
            value={profileData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholderTextColor={Colors.text.veryLightGray}
          />
        </View>

        {/* Email Field */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors.text.gray }]}>البريد الإلكتروني</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: Colors.cardBackground,
                borderColor: Colors.borderLight,
                color: Colors.text.gray
              }
            ]}
            value={user?.primaryEmailAddress?.emailAddress}
            placeholder="أدخل بريدك الإلكتروني"
            placeholderTextColor={Colors.text.veryLightGray}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
        </View>

        {/* Phone Field */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors.text.gray }]}>رقم الهاتف</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: Colors.cardBackground,
                borderColor: Colors.borderLight,
                color: Colors.text.gray
              }
            ]}
            value={profileData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            placeholder="أدخل رقم هاتفك"
            placeholderTextColor={Colors.text.veryLightGray}
            keyboardType="phone-pad"
            editable={false}
          />
        </View>
        {/* Location Field */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors.text.gray }]}>الموقع</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: Colors.cardBackground,
                borderColor: Colors.borderLight,
                color: Colors.text.gray
              }
            ]}
            value={profileData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            placeholder="أدخل موقعك"
            placeholderTextColor={Colors.text.veryLightGray}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: Colors.primary }]} onPress={handleSave}
          disabled={isEditing}
        >
          {isEditing ?
            (<ActivityIndicator size="small" color="#fff" />)
            :
            <Text style={styles.saveButtonText}>
              حفظ التغييرات
            </Text>
          }
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity style={[styles.deleteButton, { borderColor: Colors.error }]}>
          <Text style={[styles.deleteButtonText, { color: Colors.error }]}>حذف الحساب</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A90E2',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraText: {
    fontSize: 16,
  },
  changePhotoText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: 'right',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bioInput: {
    height: 100,
    paddingTop: 14,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'right',
    flex: 1,
  },
  optionArrow: {
    fontSize: 16,
    color: '#6C757D',
    marginLeft: 10,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
})