import { useState, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import i18n from '../../utils/i18n';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/locales/brandColors';

const { width, height } = Dimensions.get('window');

// Onboarding steps data
const ONBOARDING_STEPS = [
  {
    id: 'step1',
    title: i18n.t('onboarding_subtitle'),
    description: i18n.t('onboarding_description1'),
    image: require('../../assets/images/onboard1.svg'),
    imageStyle: { width: Math.min(350, width * 0.85), height: 300 },
  },
  {
    id: 'step2',
    title: i18n.t('onboarding_subtitle2'),
    description: i18n.t('onboarding_description2'),
    image: require('../../assets/images/address.svg'),
    imageStyle: { width: Math.min(350, width * 0.8), height: 300 },
  },
  {
    id: 'step3',
    title: i18n.t('onboarding_subtitle3'),
    description: i18n.t('onboarding_description3'),
    image: require('../../assets/images/ordering.svg'),
    imageStyle: { width: Math.min(350, width * 0.85), height: 300 },
  },
  {
    id: 'final',
    title: i18n.t('paragraph'),
    description: '',
    image: require('../../assets/images/onboard4.webp'),
    imageStyle: { width: width, height: height },
    isFinal: true,
  },
];

const ONBOARDING_COMPLETED_KEY = 'hasSeenOnboarding';


export default function OnboardingScreen() {
  // All hooks must be called before any conditional returns
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastRegularStep = currentStep === ONBOARDING_STEPS.length - 2;

  // Simple transition animation
  const animateTransition = useCallback((newStep: number) => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(newStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false);
      });
    });
  }, [isTransitioning, fadeAnim]);

  const handleGetStarted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      router.replace('/(tabs)');
    }
  }, [router]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      animateTransition(currentStep + 1);
    } else {
      handleGetStarted();
    }
  }, [currentStep, isTransitioning, animateTransition, handleGetStarted]);

  const handleSkip = useCallback(() => {
    handleGetStarted();
  }, [handleGetStarted]);

  // Handle final screen with gradient overlay
  if (currentStepData?.isFinal) {
    return (
      <View style={styles.container}>
        <Image
          source={currentStepData.image}
          style={currentStepData.imageStyle}
          contentFit="cover"
          priority="high"
          cachePolicy="memory-disk"
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          locations={[0, 0.6, 1]}
          style={styles.gradientOverlay}
        >
          <Animated.View
            style={[
              styles.finalContent,
              {
                opacity: fadeAnim,
              }
            ]}
          >
            <Text style={styles.finalTitle}>
              {currentStepData.title}
            </Text>

            <TouchableOpacity
              onPress={handleGetStarted}
              style={styles.getStartedButton}
              activeOpacity={0.8}
              disabled={isTransitioning}
            >
              <Text style={styles.getStartedButtonText}>
                {i18n.t('startShopping')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <TouchableOpacity 
          onPress={handleSkip} 
          style={styles.skipButton}
          activeOpacity={0.7}
          disabled={isTransitioning}
        >
          <Text style={styles.skipText}>{i18n.t('onboarding_skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={currentStepData?.image}
            style={currentStepData?.imageStyle}
            contentFit="contain"
            priority="high"
            cachePolicy="memory-disk"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={3}>
            {currentStepData?.title}
          </Text>
          <Text style={styles.description} numberOfLines={4}>
            {currentStepData?.description}
          </Text>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Pagination Dots */}
          <View style={styles.dotsContainer}>
            {ONBOARDING_STEPS.slice(0, -1).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Button Container */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleNext}
              style={styles.primaryButton}
              activeOpacity={0.8}
              disabled={isTransitioning}
            >
              <Text style={styles.primaryButtonText}>
                {isLastRegularStep
                  ? i18n.t('startShopping')
                  : i18n.t('onboarding_next')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipContainer: {
    position: 'absolute',
    top: height * 0.06,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    height: 40,
    width: 100,
  },
  skipText: {
    color: Colors.text.black,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
      lineHeight: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.12,
    marginBottom: height * 0.02,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    flex: 1,
    maxHeight: height * 0.25,
  },
  title: {
    fontSize: Math.min(36, width * 0.09),
    color: Colors.text.black,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: Math.min(44, width * 0.11),
    paddingVertical: 15,
  },
  description: {
    paddingVertical: 15,
    fontSize: 16,
    color: Colors.text.mediumGray,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  bottomSection: {
    alignItems: 'center',
    gap: 14,
    marginBottom: height * 0.03,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray[300],
    marginHorizontal: 5,
  },
  dotActive: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.black,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: Math.min(width * 0.25, 80),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.text.black,
  },
  primaryButtonText: {
    color: Colors.text.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 38,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    width: width,
    paddingVertical: 60,
    paddingBottom: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  finalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  finalTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: Colors.text.white,
    letterSpacing: 1.5,
    paddingHorizontal: 30,
    lineHeight: 40,
  },
  getStartedButton: {
    backgroundColor: Colors.background,
    paddingVertical: 12,
    paddingHorizontal: Math.min(width * 0.25, 80),
    borderRadius: 8,
  },
  getStartedButtonText: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: Colors.text.black,
    letterSpacing: 1.5,
    lineHeight: 38,
  },
});