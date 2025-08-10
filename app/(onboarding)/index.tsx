import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import i18n from "../../utils/i18n";
import { Image } from "expo-image";


export default function index() {
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Onboarding screen
 * This screen is shown when the user first opens the app
 * It provides a brief introduction to the app and allows the user to skip the onboarding process
 * @returns {JSX.Element} The onboarding screen component
 */
/*******  abe69220-3771-4f71-a99b-0a6ebb644a30  *******/  const router = useRouter();

  const handleSkip = () => {
    // Navigate to main app or login screen
    router.push("./onboard"); // Adjust path as needed
  };

  const handleStart = () => {
    router.push("./welcom");
  };
  return (   
    <View style={styles.container}>
        <View style={styles.skipContainer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{i18n.t('onboarding_skip')}</Text>
          </TouchableOpacity>
        </View>
        <Image source={require('../../assets/images/onboard1.svg')} style={{ width: 350, height: 300, marginBottom: 20 , position: 'absolute' ,top: 200 }} />            
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.subTitle}>
              {i18n.t('onboarding_subtitle')}
            </Text>
            <Text style={styles.description}>
              {i18n.t('onboarding_description1')}
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
              <View style={styles.dotActive} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        </View>
        </View>
      
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
  skipContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  skipText: {
    color: '#000',
    fontSize:24,
    fontWeight: '600',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  textContainer: {
    bottom: 200 ,
    position: 'absolute',
      alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  subTitle: {
    fontSize: 40,
    color: '#000',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 30,
  },
  description: {
    fontSize: 16,
    color: '#0000004D',
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
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
  skipbButton: {
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
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  skipbButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  skipButtonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    width: '90%',
  },
  skipButtonSecondaryText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});