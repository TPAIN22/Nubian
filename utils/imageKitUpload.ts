import axiosInstance from './axiosInstans';
import * as FileSystem from 'expo-file-system';

/**
 * ImageKit upload authentication parameters
 */
interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint?: string;
}

/**
 * Upload image to ImageKit using base64 (recommended for React Native)
 * @param imageUri - Local file URI from expo-image-picker
 * @returns ImageKit URL of the uploaded image
 */
export const uploadImageToImageKit = async (
  imageUri: string
): Promise<string> => {
  try {
    // Step 1: Get authentication parameters from backend
    const authResponse = await axiosInstance.get('/upload/imagekit-auth');
    
    if (!authResponse.data?.success) {
      throw new Error(
        authResponse.data?.message || 'Failed to get upload authentication'
      );
    }

    const authParams: ImageKitAuthParams = authResponse.data.data;

    // Step 2: Read the image file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Get file name from URI
    const fileName = `payment-proof-${Date.now()}.jpg`;
    
    // Step 3: Upload to ImageKit using base64
    // ImageKit accepts base64 data URLs
    const uploadData = {
      file: `data:image/jpeg;base64,${base64}`,
      fileName: fileName,
      publicKey: authParams.publicKey,
      signature: authParams.signature,
      expire: authParams.expire,
      token: authParams.token,
      folder: '/payment-proofs/',
      useUniqueFileName: true,
    };

    const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadData),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Upload failed with status ${uploadResponse.status}`
      );
    }

    const result = await uploadResponse.json();
    
    // Extract URL from response
    const imageUrl = result.url || result.filePath;
    
    if (!imageUrl) {
      throw new Error('Upload succeeded but no URL returned from ImageKit');
    }

    // Return full URL (ImageKit usually returns full URLs)
    return imageUrl.startsWith('http') 
      ? imageUrl 
      : `${authParams.urlEndpoint || 'https://ik.imagekit.io'}/${imageUrl.replace(/^\//, '')}`;
  } catch (error: any) {
    console.error('ImageKit upload error:', error);
    throw new Error(
      error.message || 'Failed to upload image to ImageKit'
    );
  }
};

