import React, { useEffect, useState, useMemo } from "react";
import { View, ActivityIndicator, TextInput, TouchableOpacity, Alert, StyleSheet, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import axiosInstance from "@/services/api/client";
import { useUser, useAuth } from "@clerk/clerk-expo";
import i18n from "@/utils/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "@/locales/brandColors";
import { useTheme } from "@/providers/ThemeProvider";

interface ReviewProps {
  productId: string;
}

const Review: React.FC<ReviewProps> = ({ productId }) => {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Debug: طباعة productId

  // جلب المراجعات عند تحميل الكمبوننت أو تغيير المنتج
  useEffect(() => {
    if (productId) {
      setLoadingReviews(true);
      axiosInstance.get(`/reviews?product=${productId}`)
        .then((res:any) => {
          setReviews(res.data);
        })
        .catch(() => {
          setReviews([]);
        })
        .finally(() => setLoadingReviews(false));
    } else {
      setReviews([]);
      setLoadingReviews(false);
    }
  }, [productId]);

  const handleSubmitReview = async () => {
    if (!rating || !reviewText.trim()) {
      Alert.alert(
        i18n.t('error') || 'Error',
        i18n.t('reviewRequiredFields') || 'Please enter rating and comment'
      );
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      await axiosInstance.post(
        "/reviews",
        {
          product: productId,
          rating,
          comment: reviewText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReviewText("");
      setRating(0);
      // إعادة جلب المراجعات
      const res = await axiosInstance.get(`/reviews?product=${productId}`);
      setReviews(res.data);
      Alert.alert(
        i18n.t('success') || 'Success',
        i18n.t('reviewAddedSuccess') || 'Review added successfully'
      );
    } catch (e: any) {
      Alert.alert(
        i18n.t('error') || 'Error',
        e?.response?.data?.message || (i18n.t('reviewAddError') || 'Error adding review')
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  const maxCommentLength = 500;
  const remainingChars = maxCommentLength - reviewText.length;

  // Calculate overall rating and distribution
  const ratingStats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    
    const total = reviews.length;
    const sum = reviews.reduce((acc, rev) => acc + (rev.rating || 0), 0);
    const average = total > 0 ? sum / total : 0;
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(rev => {
      const rating = rev.rating || 0;
      if (rating >= 5) distribution[5]++;
      else if (rating >= 4) distribution[4]++;
      else if (rating >= 3) distribution[3]++;
      else if (rating >= 2) distribution[2]++;
      else if (rating >= 1) distribution[1]++;
    });
    
    return {
      average,
      total,
      distribution
    };
  }, [reviews]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            style={[
              styles.star,
              { 
                fontSize: size,
                color: star <= rating ? Colors.gold : Colors.borderMedium
              }
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(p => p && p.length > 0);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] || '';
      const second = parts[1]?.[0] || '';
      return (first + second).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: Colors.text.gray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
        {i18n.t('reviews') || 'Customer Reviews'}
      </Text>
      
      {loadingReviews ? (
        <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
      ) : reviews.length === 0 ? (
        <Text style={[styles.noReviews, { color: Colors.text.veryLightGray }]}>{i18n.t('noReviews') || 'No reviews yet'}</Text>
      ) : (
        <>
          {/* Overall Rating Section */}
          <View style={styles.ratingOverview}>
            <View style={styles.ratingMain}>
              <Text style={[styles.ratingNumber, { color: Colors.text.gray }]}>{ratingStats.average.toFixed(1)}</Text>
              {renderStars(Math.round(ratingStats.average), 20)}
              <Text style={[styles.reviewCount, { color: Colors.text.veryLightGray }]}>
                {ratingStats?.total || 0} {i18n.t('reviews') || 'reviews'}
              </Text>
            </View>
            
            {/* Rating Distribution */}
            <View style={styles.distributionContainer}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingStats.distribution[star as keyof typeof ratingStats.distribution];
                const percentage = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
                return (
                  <View key={star} style={styles.distributionRow}>
                    <Text style={[styles.distributionStar, { color: Colors.text.veryLightGray }]}>{star} star</Text>
                    <View style={[styles.barContainer, { backgroundColor: Colors.borderLight }]}>
                      <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: Colors.primary }]} />
                    </View>
                    <Text style={[styles.distributionPercent, { color: Colors.text.veryLightGray }]}>{Math.round(percentage)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Individual Reviews */}
          <View style={styles.reviewsList}>
            {reviews.slice(0, 10).map((rev, idx) => (
              <View key={rev._id || idx} style={[styles.reviewItem, { borderBottomColor: Colors.borderLight }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: Colors.surface }]}>
                      <Text style={[styles.avatarText, { color: Colors.text.veryLightGray }]}>
                        {getInitials(rev.user?.name || 'User')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={[styles.userName, { color: Colors.text.gray }]}>{rev.user?.name || 'User'}</Text>
                    <Text style={[styles.date, { color: Colors.text.veryLightGray }]}>{formatDate(rev.createdAt || new Date().toISOString())}</Text>
                  </View>
                </View>
                <View style={styles.starsWrapper}>
                  {renderStars(rev.rating || 0, 16)}
                </View>
                <Text style={[styles.reviewComment, { color: Colors.text.veryLightGray }]}>{rev.comment || ''}</Text>
                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="thumbs-up-outline" size={16} color={Colors.text.veryLightGray} />
                    <Text style={[styles.actionText, { color: Colors.text.veryLightGray }]}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="thumbs-down-outline" size={16} color={Colors.text.veryLightGray} />
                    <Text style={[styles.actionText, { color: Colors.text.veryLightGray }]}>0</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
      {/* Add Review Form */}
      {isSignedIn && (
        <View style={styles.addReviewBox}>
          <View style={styles.addReviewHeader}>
            <Text style={styles.addReviewTitle}>{i18n.t('addReview') || 'Add your review'}</Text>
            <View style={styles.divider} />
          </View>
          
          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>
              {i18n.t('yourRating') || 'Your Rating'}
            </Text>
            <View style={styles.starsRow}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.starIcon,
                      { 
                        fontSize: 32,
                        color: star <= rating ? Colors.gold : Colors.borderMedium,
                      }
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={[styles.ratingText, { color: Colors.primary }]}>
                {rating === 1 && (i18n.t('ratingPoor') || 'Poor')}
                {rating === 2 && (i18n.t('ratingFair') || 'Fair')}
                {rating === 3 && (i18n.t('ratingGood') || 'Good')}
                {rating === 4 && (i18n.t('ratingVeryGood') || 'Very Good')}
                {rating === 5 && (i18n.t('ratingExcellent') || 'Excellent')}
              </Text>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>
              {i18n.t('yourComment') || 'Your Comment'}
            </Text>
            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder={i18n.t('writeComment') || 'Write your comment here...'}
              style={[
                styles.input,
                { 
                  backgroundColor: Colors.surface,
                  borderColor: Colors.borderMedium,
                  color: Colors.text.gray
                },
                reviewText.length > maxCommentLength && { 
                  borderColor: Colors.danger,
                  backgroundColor: Colors.error + '15'
                }
              ]}
              multiline
              numberOfLines={4}
              maxLength={maxCommentLength}
              textAlignVertical="top"
              placeholderTextColor={Colors.text.veryLightGray}
            />
            <View style={styles.charCountContainer}>
              <Text style={[
                styles.charCount,
                remainingChars < 50 && styles.charCountWarning,
                reviewText.length > maxCommentLength && styles.charCountError
              ]}>
                {remainingChars >= 0 ? remainingChars : 0} {i18n.t('charactersRemaining') || 'characters remaining'}
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitReview}
            disabled={submitting || !rating || !reviewText.trim() || reviewText.length > maxCommentLength}
            style={[
              styles.submitBtn,
              (submitting || !rating || !reviewText.trim() || reviewText.length > maxCommentLength) && styles.submitBtnDisabled
            ]}
            activeOpacity={0.8}
          >
            {submitting ? (
              <View style={styles.submitBtnContent}>
                <ActivityIndicator size="small" color="#fff" style={styles.submitLoader} />
                <Text style={styles.submitBtnText}>{i18n.t('sending') || 'Sending...'}</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>{i18n.t('submitReview') || 'Submit Review'}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      {!isSignedIn && (
        <Text style={styles.loginMsg}>{i18n.t('loginMsg')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
  },
  loader: {
    marginVertical: 20,
  },
  noReviews: {
    marginBottom: 8,
    fontSize: 14,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    paddingVertical: 20,
  },
  ratingOverview: {
    marginBottom: 16,
    paddingTop: 4,
  },
  ratingMain: {
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 4,
    minHeight: 60,

  },
  reviewCount: {
    fontSize: 14,
    marginTop: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  star: {
  },
  starFilled: {
  },
  starEmpty: {
  },
  distributionContainer: {
    gap: 10,
    marginTop: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  distributionStar: {
    fontSize: 12,
    width: 50,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  barContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  distributionPercent: {
    fontSize: 12,
    width: 40,
    textAlign: I18nManager.isRTL ? 'left' : 'right',
  },
  reviewsList: {
    gap: 24,
    marginTop: 8,
  },
  reviewItem: {
    paddingBottom: 24,
    paddingTop: 4,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: I18nManager.isRTL ? 0 : 12,
    marginLeft: I18nManager.isRTL ? 12 : 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  date: {
    fontSize: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  starsWrapper: {
    marginTop: 8,
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  reviewActions: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: 16,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
  },
  addReviewBox: {
    marginTop: 24,
    backgroundColor: Colors.darkBackground,
    borderRadius: 12,
    padding: 20,
    
  },
  addReviewHeader: {
    marginBottom: 20,
  },
  addReviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.white,
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: 4,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: I18nManager.isRTL ? 'flex-end' : 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starIcon: {
    lineHeight: 36,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  commentSection: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  inputError: {
  },
  charCountContainer: {
    marginTop: 6,
    alignItems: I18nManager.isRTL ? 'flex-start' : 'flex-end',
  },
  charCount: {
    fontSize: 12,
    color: Colors.text.veryLightGray,
  },
  charCountWarning: {
    color: Colors.warning,
  },
  charCountError: {
    color: Colors.danger,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.gray['400'],
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitLoader: {
    marginRight: 4,
  },
  submitBtnText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '700',
  },
  loginMsg: {
    color: Colors.text.veryLightGray,
    marginTop: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
});

export default Review; 