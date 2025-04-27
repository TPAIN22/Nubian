import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';

export default function Profile() {
  const { loaded, isSignedIn } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  const [isUserLoaded, setIsUserLoaded] = useState(false);

  // هذا الكود سيتحقق من حالة المستخدم بعد تحميل البيانات
  useEffect(() => {
    if (loaded && isSignedIn && user) {
      setIsUserLoaded(true); // تأكد من أن المستخدم تم تحميله بعد التحقق من حالة تسجيل الدخول
    } else {
      setIsUserLoaded(false);
    }
  }, [loaded, isSignedIn, user]);

  if (!loaded) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100%', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#A37E2C" />
      </View>
    );
  }

  // عرض شاشة تسجيل الدخول إذا لم يكن المستخدم قد سجل الدخول
  if (loaded && !isSignedIn) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100%', backgroundColor: '#fff' }}>
        <Image source={require('../../../assets/images/profilelogin.svg')} style={{ width: '80%', height: 300 }} />
        <Text>سجّل الدخول للمتابعة</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/signin')} style={{ width: 200, alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row', backgroundColor: '#9B7931DC', borderRadius: 15, padding: 10 }}>
          <Text style={{ color: '#fff' }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // إذا كان المستخدم مسجل دخول، عرض بياناته
  if (isUserLoaded) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100%', backgroundColor: '#fff' }}>
      <Text>خطأ في تحميل البيانات</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#A37E2C',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#777',
    marginBottom: 24,
  },
});
