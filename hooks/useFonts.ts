import { useFonts as useExpoFonts } from 'expo-font';

// Font loading for Cairo fonts
// IMPORTANT: The keys ('Cairo-Regular', 'Cairo-Bold') must match exactly 
// what we use as fontFamily in components
export const useFonts = () => {
  const [fontsLoaded, fontError] = useExpoFonts({
    'Cairo-Regular': require('../assets/fonts/Cairo/Cairo-Regular.ttf'),
    'Cairo-Bold': require('../assets/fonts/Cairo/Cairo-Bold.ttf'),
  });
  
  if (__DEV__) {
    if (fontError) {
      console.error('❌ Font loading error:', fontError);
    }
    if (fontsLoaded) {
      console.log('✅ Cairo fonts loaded successfully');
      console.log('📝 Registered fonts: Cairo-Regular, Cairo-Bold');
    } else {
      console.log('⏳ Loading Cairo fonts...');
    }
  }
  
  return { fontsLoaded, fontError };
};
