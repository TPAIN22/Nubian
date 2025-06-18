import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Platform, 
  ActivityIndicator
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-expo'
import { Image } from 'expo-image'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Toast from 'react-native-toast-message'


export default function EditProfile() {
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
      // split into first and last
      const [firstName, ...rest] = profileData.name.split(' ');
      const lastName = rest.length > 0 ? rest.join(' ') : '';
      try {
        setIsEditing(true);
        await user?.update({ firstName, lastName });
        Toast.show({ type:'success', text1:'تم تغيير الأسم في' });
      } catch (err) {
        console.error(err);
        Toast.show({ type:'error', text1:'فشل تغيير الأسم' });
      }
      finally {
        setIsEditing(false);
      }
    }

  }

  const handleImagePicker = () => {
   
  }

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: `${user?.firstName || ''} ${user?.lastName || ''}`,
        phone: '',
        location:'بورتسودان ، حي الشاطئ ، شارع النصر'
      }))
    }
  }, [user]);


  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor='#fff' />

    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(onboarding)")}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Profile Image Section */}
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={()=>{}} style={styles.imageContainer}>
          <Image
            source={user?.imageUrl}
            style={styles.profileImage}
          />
         
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>الاسم الكامل</Text>
          <TextInput
            style={styles.input}
            value={profileData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {/* Email Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput
            style={styles.input}
            value={user?.primaryEmailAddress?.emailAddress}
            placeholder="أدخل بريدك الإلكتروني"
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
        </View>

        {/* Phone Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <TextInput
            style={styles.input}
            value={profileData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            placeholder="أدخل رقم هاتفك"
            placeholderTextColor="#A0A0A0"
            keyboardType="phone-pad"
            editable={false}
          />
        </View>
        {/* Location Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>الموقع</Text>
          <TextInput
            style={styles.input}
            value={profileData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            placeholder="أدخل موقعك"
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}
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
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>حذف الحساب</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
    </SafeAreaView>
  </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#495057',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#F9F9F9FF',
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
    borderColor: '#4A90E2',
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
    color: '#212529',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212529',
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
    color: '#212529',
    textAlign: 'right',
    flex: 1,
  },
  optionArrow: {
    fontSize: 16,
    color: '#6C757D',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#30a1a7',
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
    borderColor: '#DC3545',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  deleteButtonText: {
    color: '#DC3545',
    fontSize: 16,
    fontWeight: '500',
  },
})