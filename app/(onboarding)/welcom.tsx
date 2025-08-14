import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import i18n from "../../utils/i18n";

const { width, height } = Dimensions.get("window");

export default function Welcom() {
  const router = useRouter();
  const handleStart = () => {
    router.push(`./onboard`);
    router.push(`./starting`);
  };
  const handleSkip = () => {
    router.push(`./onboard`);
    router.push(`./starting`);
  };

  return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.skipContainer}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>{i18n.t("onboarding_skip")}</Text>
            </TouchableOpacity>
          </View>

          {/* Image - Center */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/address.svg")}
              style={styles.onboardImage}
            />
          </View>

          {/* Text Content - Below Image */}
          <View style={styles.textContainer}>
            <Text style={styles.mainTitle}>
              {i18n.t("onboarding_subtitle2")}
            </Text>

            <Text style={styles.description}>
              {i18n.t("onboarding_description2")}
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
                  {i18n.t("onboarding_next")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              <View style={styles.dotActive} />
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
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  skipContainer: {
    position: "absolute",
    top: height * 0.05,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  skipText: {
    color: "#000",
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: height * 0.1,
    marginBottom: height * 0.005,
  },
  onboardImage: {
    width: Math.min(350, width * 0.8),
    height: 300,
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginBottom: height * 0.1,
  },
  mainTitle: {
    fontSize: Math.min(42, width * 0.105),
    color: "#000",
    fontWeight: "800",
    textAlign: "center",
    lineHeight: Math.min(50, width * 0.125),
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: "#666B75FF",
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 28,
    paddingHorizontal: 10,
  },
  bottomSection: {
    alignItems: "center",
    bottom: height * 0.03, // 8% من أسفل الشاشة
  },
  buttonContainer: {
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: "#f0b745",
    paddingVertical: 15,
    paddingHorizontal: width * 0.3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#000",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 2,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CCCCCCFF",
    marginHorizontal: 4,
  },
  dotActive: {
    width: 30,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000",
    marginHorizontal: 4,
  },
  // أنماط غير مستخدمة - محتفظ بها في حال الحاجة
  logoContainer: {
    alignItems: "center",
  },
  subTitle: {
    fontSize: 24,
    color: "#f0b745",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 30,
  },
  skipButtonSecondary: {
    backgroundColor: "#fff",
    padding: 10,
    paddingHorizontal: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f0b745",
  },
});
