import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import i18n from "../../utils/i18n";
import { Image } from "expo-image";

const { width, height } = Dimensions.get('window');

export default function index() {
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Onboarding screen
 * This screen is shown when the user first opens the app
 * It provides a brief introduction to the app and allows the user to skip the onboarding process
 * @returns {JSX.Element} The onboarding screen component
 */
/*******  abe69220-3771-4f71-a99b-0a6ebb644a30  *******/  
  const router = useRouter();

  const handleSkip = () => {
    // Navigate to main app or login screen
    router.push("./onboard"); // Adjust path as needed
  };

  const handleStart = () => {
    router.push("./welcom");
  };
  
  return (   
    <View style={styles.container}>
      {/* Skip Button - Top Right */}
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{i18n.t('onboarding_skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Image - Center */}
      <View style={styles.imageContainer}>
        <Image 
          source={require('../../assets/images/onboard1.svg')} 
          style={styles.onboardImage}
        />
      </View>
      
      {/* Text Content - Below Image */}
      <View style={styles.textContainer}>
        <Text style={styles.subTitle}>
          {i18n.t('onboarding_subtitle')}
        </Text>
        <Text style={styles.description}>
          {i18n.t('onboarding_description1')}
        </Text>
      </View>

      {/* Bottom Section - Button and Dots */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleStart}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>
              {i18n.t('onboarding_start')}
            </Text>
          </TouchableOpacity>  
        </View>
        
        <View style={styles.dotsContainer}>
          <View style={styles.dotActive} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipContainer: {
    position: 'absolute',
    top: height * 0.06, // 6% من ارتفاع الشاشة
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
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
     marginTop: height * 0.10, // 15% من أعلى الشاشة
    marginBottom: height * 0.005,
  },
  onboardImage: {
    width: Math.min(350, width * 0.85), // 85% من عرض الشاشة أو 350 كحد أقصى
    height: 300,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: height * 0.1, // 10% مساحة قبل الأزرار
  },
  subTitle: {
    fontSize: Math.min(40, width * 0.1), // تتناسب مع عرض الشاشة
    color: '#000',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: Math.min(45, width * 0.12),
  },
  description: {
    fontSize: 16,
    color: '#666B75FF',
    fontWeight: '400',
    lineHeight: 28,
    textAlign: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: height * 0.08, // 8% من أسفل الشاشة
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  buttonContainer: {
    marginBottom: 30, // مساحة بين الزر والنقاط
  },
  startButton: {
    backgroundColor: '#f0b745',
    paddingVertical: 15,
    paddingHorizontal: width * 0.3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  // أنماط غير مستخدمة - محتفظ بها في حال الحاجة
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
  skipbButton: {
    backgroundColor: '#fff',
    padding: 10,
    paddingHorizontal: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f0b745',
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