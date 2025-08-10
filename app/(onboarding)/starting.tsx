import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import i18n from '../../utils/i18n';

export default function Starting() {
  const router = useRouter();

  const handleStart = () => {
    //router.push(`../../(tabs)`);
    router.push(`./onboard`);

  };

  const handleSkip = () => {
   // router.push(`../../(tabs)`);
    router.push(`./onboard`);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
            <Image
              source={require("../../assets/images/ordering.svg")}
              style={{ width: 350, height: 300, marginBottom: 20 , position: 'absolute' ,top: 170 }}
            />

          <View style={styles.textContainer}>
            <Text style={styles.mainTitle}>
              {i18n.t('onboarding_subtitle3')}
            </Text>
            
            <Text style={styles.description}>
              {i18n.t('onboarding_description3')}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleStart}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>
                {i18n.t('onboarding_start')}
              </Text>
            </TouchableOpacity>
            <View style={styles.underline} >
             <View style={styles.dot} />
             <View style={styles.dot} />
            <View style={styles.dotActive} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  underline: {
    flexDirection: 'row',
    alignItems: 'center',
    bottom: 24,
    position: 'absolute',
    right: 20
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCCCCCFF',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 30,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
    marginHorizontal: 4,
    color: '#0000004D',

  },
  logoContainer: {
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    position: 'absolute',
    bottom: 200,    
  },
  mainTitle: {
    fontSize: 42,
    color: '#000',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 50,
  },
  subTitle: {
    fontSize: 24,
    color: '#f0b745',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 30,
  },
  description: {
    fontSize: 18,
    color: '#4a5568',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
  },
  startButton: {
     backgroundColor: '#f0b745',
    padding: 10,
    paddingHorizontal: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000',
    position: 'absolute',
    bottom: 0,
    left:50,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skipButtonSecondary: {
    backgroundColor: '#fff',
    padding: 10,
    paddingHorizontal: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f0b745',
    position: 'absolute',
    bottom: 0,
    right: 50
  },
  skipText: {
     color: '#CFCFCFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
});
