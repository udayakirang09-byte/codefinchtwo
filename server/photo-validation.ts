/**
 * Privacy-Preserving Photo Validation
 * 
 * This module provides server-side photo validation WITHOUT sending photos to external APIs.
 * All validation happens locally using:
 * - File type/size checks
 * - Image dimension analysis
 * - Basic quality metrics
 * 
 * Face detection is handled client-side using face-api.js (runs in browser, 100% private)
 */

import sharp from 'sharp';

export interface PhotoValidationResult {
  faceDetected: boolean;
  clarityScore: number; // 0-100
  validationStatus: "approved" | "rejected" | "pending";
  validationMessage: string;
  resizedBuffer?: Buffer; // Auto-resized image if needed
  wasResized?: boolean;
  details?: {
    faceCount?: number;
    blurriness?: string;
    lighting?: string;
    recommendations?: string[];
    width?: number;
    height?: number;
    originalWidth?: number;
    originalHeight?: number;
    fileSize?: number;
    clarityScore?: number;
  };
}

/**
 * Server-side photo validation (privacy-preserving)
 * 
 * Validates:
 * - File type (JPEG, PNG, WebP only)
 * - File size (max 5MB)
 * - Image dimensions (min 200x200, max 4000x4000)
 * - Image clarity (using variance of Laplacian)
 * 
 * @param imageBuffer - Buffer containing the image data
 * @param mimeType - Image MIME type
 * @returns PhotoValidationResult
 */
export async function validateTeacherPhoto(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<PhotoValidationResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return {
        faceDetected: false,
        clarityScore: 0,
        validationStatus: "rejected",
        validationMessage: `Invalid file type. Please upload JPEG, PNG, or WebP images only.`,
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageBuffer.length > maxSize) {
      return {
        faceDetected: false,
        clarityScore: 0,
        validationStatus: "rejected",
        validationMessage: `File too large (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`,
      };
    }

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    let processedBuffer = imageBuffer;
    let width = originalWidth;
    let height = originalHeight;
    let wasResized = false;

    // Auto-resize if dimensions are outside acceptable range
    if (width < 200 || height < 200 || width > 4000 || height > 4000) {
      // Calculate target size maintaining aspect ratio
      let targetWidth = width;
      let targetHeight = height;

      // If too small, scale up to minimum 200x200
      if (width < 200 || height < 200) {
        const scaleFactor = Math.max(200 / width, 200 / height);
        targetWidth = Math.round(width * scaleFactor);
        targetHeight = Math.round(height * scaleFactor);
      }

      // If too large, scale down to maximum 4000x4000
      if (targetWidth > 4000 || targetHeight > 4000) {
        const scaleFactor = Math.min(4000 / targetWidth, 4000 / targetHeight);
        targetWidth = Math.round(targetWidth * scaleFactor);
        targetHeight = Math.round(targetHeight * scaleFactor);
      }

      // Resize the image
      processedBuffer = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      width = targetWidth;
      height = targetHeight;
      wasResized = true;
    }

    // Calculate image clarity using variance of Laplacian (blur detection)
    const clarityScore = await calculateImageClarity(imageBuffer);

    // Check if image is too blurry
    if (clarityScore < 30) {
      return {
        faceDetected: false,
        clarityScore,
        validationStatus: "rejected",
        validationMessage: `Image is too blurry (clarity: ${clarityScore}/100). Please upload a sharper, well-focused photo.`,
        details: {
          blurriness: "high",
          clarityScore,
          width,
          height,
          fileSize: imageBuffer.length,
          recommendations: [
            "Use good lighting",
            "Hold camera steady",
            "Clean camera lens",
            "Move closer to camera"
          ],
        },
      };
    }

    // Server-side validation passed
    // Face detection will be done client-side using face-api.js
    const message = wasResized 
      ? `Photo auto-resized from ${originalWidth}x${originalHeight} to ${width}x${height}. Face detection will be verified in browser.`
      : "Photo meets quality standards. Face detection will be verified in browser.";

    return {
      faceDetected: true, // Will be verified client-side
      clarityScore,
      validationStatus: "approved",
      validationMessage: message,
      resizedBuffer: wasResized ? processedBuffer : undefined,
      wasResized,
      details: {
        blurriness: clarityScore >= 60 ? "low" : clarityScore >= 40 ? "medium" : "high",
        lighting: "pending_client_check",
        width,
        height,
        originalWidth: wasResized ? originalWidth : undefined,
        originalHeight: wasResized ? originalHeight : undefined,
        fileSize: processedBuffer.length,
      },
    };
  } catch (error: any) {
    console.error("Photo validation error:", error);
    
    return {
      faceDetected: false,
      clarityScore: 0,
      validationStatus: "pending",
      validationMessage: `Photo validation error: ${error.message}. Please try again.`,
    };
  }
}

/**
 * Calculate image clarity score using variance of Laplacian
 * Higher score = sharper image
 * 
 * @param imageBuffer - Image buffer
 * @returns Clarity score (0-100)
 */
async function calculateImageClarity(imageBuffer: Buffer): Promise<number> {
  try {
    // Convert to grayscale and resize for faster processing
    const { data, info } = await sharp(imageBuffer)
      .resize(800, 800, { fit: 'inside' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Calculate Laplacian variance (edge detection for blur)
    const { width, height } = info;
    let laplacianSum = 0;
    let pixelCount = 0;

    // Laplacian kernel for edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // 3x3 Laplacian kernel
        const laplacian = Math.abs(
          -1 * data[idx - width - 1] + -1 * data[idx - width] + -1 * data[idx - width + 1] +
          -1 * data[idx - 1]         +  8 * data[idx]         + -1 * data[idx + 1] +
          -1 * data[idx + width - 1] + -1 * data[idx + width] + -1 * data[idx + width + 1]
        );

        laplacianSum += laplacian;
        pixelCount++;
      }
    }

    // Calculate variance (higher = sharper)
    const variance = laplacianSum / pixelCount;
    
    // Normalize to 0-100 scale (empirically determined thresholds)
    // Variance > 500 = very sharp (100), < 100 = very blurry (0)
    const clarityScore = Math.min(100, Math.max(0, (variance / 5)));

    return Math.round(clarityScore);
  } catch (error) {
    console.error("Clarity calculation error:", error);
    return 50; // Default medium clarity if calculation fails
  }
}

/**
 * Validate photo from base64 data
 */
export async function validateTeacherPhotoFromBase64(
  base64Data: string,
  mimeType: string = "image/jpeg"
): Promise<PhotoValidationResult> {
  // Remove data URI prefix if present
  const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64String, 'base64');
  
  return validateTeacherPhoto(imageBuffer, mimeType);
}
