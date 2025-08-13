import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import i18n from '../../utils/i18n';

const { width, height } = Dimensions.get('window');

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
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          
          {/* Image - Center */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/ordering.svg")}
              style={styles.onboardImage}
            />
          </View>

          {/* Text Content - Below Image */}
          <View style={styles.textContainer}>
            <Text style={styles.mainTitle}>
              {i18n.t('onboarding_subtitle3')}
            </Text>
            
            <Text style={styles.description}>
              {i18n.t('onboarding_description3')}
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
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dotActive} />
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
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.10, // 15% من أعلى الشاشة
    marginBottom: height * 0.005, // 5% مساحة تحت الصورة
  },
  onboardImage: {
    width: Math.min(350, width * 0.85), // 85% من عرض الشاشة أو 350 كحد أقصى
    height: 300,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: height * 0.1, // 10% مساحة قبل الأزرار
  },
  mainTitle: {
    fontSize: Math.min(42, width * 0.105), // تتناسب مع عرض الشاشة
    color: '#000',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: Math.min(50, width * 0.125),
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: '#666B75FF',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 10,
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: height * 0.08, // 8% من أسفل الشاشة
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
  logoContainer: {
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 24,
    color: '#f0b745',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 30,
  },
  skipButtonSecondary: {
    backgroundColor: '#fff',
    padding: 10,
    paddingHorizontal: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f0b745',
  },
  skipText: {
     color: '#CFCFCFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
});