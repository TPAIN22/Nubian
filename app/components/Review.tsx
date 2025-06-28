import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TextInput, TouchableOpacity, Alert, StyleSheet, I18nManager } from "react-native";
import axiosInstance from "@/utils/axiosInstans";
import { useUser, useAuth } from "@clerk/clerk-expo";
import i18n from "@/utils/i18n";

interface ReviewProps {
  productId: string;
}

const Review: React.FC<ReviewProps> = ({ productId }) => {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Debug: طباعة productId
  console.log('Review component - productId:', productId);

  // جلب المراجعات عند تحميل الكمبوننت أو تغيير المنتج
  useEffect(() => {
    if (productId) {
      console.log('Fetching reviews for product:', productId);
      setLoadingReviews(true);
      axiosInstance.get(`/reviews?product=${productId}`)
        .then(res => {
          console.log('Reviews received:', res.data);
          setReviews(res.data);
        })
        .catch((error) => {
          console.error('Error fetching reviews:', error);
          setReviews([]);
        })
        .finally(() => setLoadingReviews(false));
    } else {
      console.log('No productId provided');
      setReviews([]);
      setLoadingReviews(false);
    }
  }, [productId]);

  const handleSubmitReview = async () => {
    if (!rating || !reviewText.trim()) {
      Alert.alert("خطأ", "يرجى إدخال التقييم والتعليق");
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
      Alert.alert("تمت الإضافة", "تمت إضافة المراجعة بنجاح");
    } catch (e: any) {
      Alert.alert("خطأ", e?.response?.data?.message || "حدث خطأ أثناء إضافة المراجعة");
    } finally {
      setSubmitting(false);
    }
  };

  // دالة مؤقتة لجلب جميع الريفيوهات للـ debugging
  const fetchAllReviews = async () => {
    try {
      const res = await axiosInstance.get('/reviews/all');
      console.log('All reviews:', res.data);
      Alert.alert('All Reviews', `Found ${res.data.length} reviews in database`);
    } catch (error) {
      console.error('Error fetching all reviews:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('reviews')}</Text>
      
      {/* زر مؤقت للـ debugging */}
      <TouchableOpacity onPress={fetchAllReviews} style={styles.debugButton}>
        <Text style={styles.debugButtonText}>Debug: جلب جميع الريفيوهات</Text>
      </TouchableOpacity>
      
      {loadingReviews ? (
        <ActivityIndicator size="small" color="#30a1a7" />
      ) : reviews.length === 0 ? (
        <Text style={styles.noReviews}>{i18n.t('noReviews')}</Text>
      ) : (
        reviews.map((rev, idx) => (
          <View key={rev._id || idx} style={styles.reviewItem}>
            <Text style={styles.userName}>{rev.user?.name || 'مستخدم'}</Text>
            <Text style={styles.stars}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</Text>
            <Text>{rev.comment}</Text>
            <Text style={styles.date}>{new Date(rev.createdAt).toLocaleDateString('ar-EG')}</Text>
          </View>
        ))
      )}
      {/* Add Review Form */}
      {isSignedIn && (
        <View style={styles.addReviewBox}>
          <Text style={styles.addReviewTitle}>{i18n.t('addReview')}</Text>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(star => (
              <Text
                key={star}
                style={{ fontSize: 28, color: star <= rating ? '#FFD700' : '#ccc', marginHorizontal: 2 }}
                onPress={() => setRating(star)}
              >★</Text>
            ))}
          </View>
          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            placeholder={i18n.t('writeComment')}
            style={styles.input}
            multiline
          />
          <TouchableOpacity
            onPress={handleSubmitReview}
            disabled={submitting}
            style={[styles.submitBtn, submitting && { backgroundColor: '#aaa' }]}
          >
            <Text style={styles.submitBtnText}>{submitting ? i18n.t('sending') : i18n.t('submitReview')}</Text>
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
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  noReviews: {
    color: '#888',
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8,
  },
  userName: {
    fontWeight: 'bold',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  stars: {
    color: '#FFD700',
    fontSize: 16,
  },
  date: {
    color: '#aaa',
    fontSize: 12,
  },
  addReviewBox: {
    marginTop: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  addReviewTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 8,
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  submitBtn: {
    backgroundColor: '#30a1a7',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loginMsg: {
    color: '#888',
    marginTop: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  debugButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  debugButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Review; 