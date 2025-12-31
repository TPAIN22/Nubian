import React, { useEffect, useState, useMemo } from "react";
import { View, ActivityIndicator, TextInput, TouchableOpacity, Alert, StyleSheet, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import axiosInstance from "@/utils/axiosInstans";
import { useUser, useAuth } from "@clerk/clerk-expo";
import i18n from "@/utils/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "@/locales/brandColors";

interface ReviewProps {
  productId: string;
}

const Review: React.FC<ReviewProps> = ({ productId }) => {
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
              { fontSize: size },
              star <= rating ? styles.starFilled : styles.starEmpty
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
      <Text style={[styles.title, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
        {i18n.t('reviews') || 'Customer Reviews'}
      </Text>
      
      {loadingReviews ? (
        <ActivityIndicator size="small" color="#a37e2c" style={styles.loader} />
      ) : reviews.length === 0 ? (
        <Text style={styles.noReviews}>{i18n.t('noReviews') || 'No reviews yet'}</Text>
      ) : (
        <>
          {/* Overall Rating Section */}
          <View style={styles.ratingOverview}>
            <View style={styles.ratingMain}>
              <Text style={styles.ratingNumber}>{ratingStats.average.toFixed(1)}</Text>
              {renderStars(Math.round(ratingStats.average), 20)}
              <Text style={styles.reviewCount}>
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
                    <Text style={styles.distributionStar}>{star} star</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.distributionPercent}>{Math.round(percentage)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Individual Reviews */}
          <View style={styles.reviewsList}>
            {reviews.slice(0, 10).map((rev, idx) => (
              <View key={rev._id || idx} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {getInitials(rev.user?.name || 'User')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.userName}>{rev.user?.name || 'User'}</Text>
                    <Text style={styles.date}>{formatDate(rev.createdAt || new Date().toISOString())}</Text>
                  </View>
                </View>
                <View style={styles.starsWrapper}>
                  {renderStars(rev.rating || 0, 16)}
                </View>
                <Text style={styles.reviewComment}>{rev.comment || ''}</Text>
                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="thumbs-up-outline" size={16} color="#666" />
                    <Text style={styles.actionText}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="thumbs-down-outline" size={16} color="#666" />
                    <Text style={styles.actionText}>0</Text>
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
              <Text style={styles.ratingText}>
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
                reviewText.length > maxCommentLength && styles.inputError
              ]}
              multiline
              numberOfLines={4}
              maxLength={maxCommentLength}
              textAlignVertical="top"
              placeholderTextColor={Colors.text.lightGray}
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
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    color: '#1a1a1a',
  },
  loader: {
    marginVertical: 20,
  },
  noReviews: {
    color: '#888',
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
    color: '#1a1a1a',
    marginBottom: 4,
    marginTop: 4,
    minHeight: 60,

  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  star: {
    color: '#000000',
  },
  starFilled: {
    color: '#000000',
  },
  starEmpty: {
    color: '#e0e0e0',
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
    color: '#666',
    width: 50,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#a37e2c',
    borderRadius: 4,
  },
  distributionPercent: {
    fontSize: 12,
    color: '#666',
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
    borderBottomColor: '#f0f0f0',
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
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  reviewInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  date: {
    fontSize: 12,
    color: '#999',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  starsWrapper: {
    marginTop: 8,
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
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
    color: '#666',
  },
  addReviewBox: {
    marginTop: 24,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addReviewHeader: {
    marginBottom: 20,
  },
  addReviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.secondary,
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
    color: Colors.text.secondary,
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
    color: Colors.primary,
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
    color: Colors.text.secondary,
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderMedium,
    padding: 14,
    fontSize: 15,
    color: Colors.text.secondary,
    minHeight: 100,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: '#fdecec',
  },
  charCountContainer: {
    marginTop: 6,
    alignItems: I18nManager.isRTL ? 'flex-start' : 'flex-end',
  },
  charCount: {
    fontSize: 12,
    color: Colors.text.lightGray,
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
    color: '#888',
    marginTop: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
});

export default Review; 