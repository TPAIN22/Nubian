import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import i18n from '../../utils/i18n';
import Colors from "@/locales/brandColors";

const { width, height } = Dimensions.get('window');

export default function Starting() {
  const router = useRouter();

  const handleStart = () => {
    //router.push(`../../(tabs)`);
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
                  {i18n.t('onboarding_next')}
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
    backgroundColor: Colors.background,
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
    color: Colors.text.black,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: Math.min(50, width * 0.125),
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: Colors.text.mediumGray,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 10,
  },
  bottomSection: {
    alignItems: 'center',
    bottom: height * 0.03, // 8% من أسفل الشاشة
  },
  buttonContainer: {
    marginBottom: 30, // مساحة بين الزر والنقاط
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: width * 0.3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.text.black,
  },
  startButtonText: {
    color: Colors.text.white,
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
    backgroundColor: Colors.gray[300],
    marginHorizontal: 4,
  },
  dotActive: {
    width: 30,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.black,
    marginHorizontal: 4,
  },
  // أنماط غير مستخدمة - محتفظ بها في حال الحاجة
  logoContainer: {
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 30,
  },
  skipButtonSecondary: {
    backgroundColor: Colors.background,
    padding: 10,
    paddingHorizontal: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  skipText: {
     color: Colors.gray[300],
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
});