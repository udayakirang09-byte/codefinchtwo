import OpenAI from "openai";

// Use gpt-5 model as per codebase standards
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PhotoValidationResult {
  faceDetected: boolean;
  clarityScore: number; // 0-100
  validationStatus: "approved" | "rejected" | "pending";
  validationMessage: string;
  details?: {
    faceCount?: number;
    blurriness?: string;
    lighting?: string;
    recommendations?: string[];
  };
}

/**
 * Validates a teacher profile photo using OpenAI Vision API
 * 
 * Checks:
 * - Human face detection (required)
 * - Photo clarity (minimum 60/100)
 * - Professional quality assessment
 * 
 * @param imageBase64 - Base64 encoded image data (with data URI prefix)
 * @param mimeType - Image MIME type (e.g., "image/jpeg")
 * @returns PhotoValidationResult with validation status and details
 */
export async function validateTeacherPhoto(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<PhotoValidationResult> {
  try {
    // Ensure proper data URI format
    const base64Data = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:${mimeType};base64,${imageBase64}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview", // Vision model for image analysis
      messages: [
        {
          role: "system",
          content: `You are an expert photo validation AI for a professional educational platform. 
Analyze profile photos for teachers and validate they meet quality standards:
- Must contain exactly ONE clear human face
- Photo must be in focus and well-lit
- Must be professional quality suitable for teacher profiles
- Assess clarity on a 0-100 scale (60+ is acceptable)

Return JSON with: faceDetected (boolean), faceCount (number), clarityScore (0-100), blurriness (low/medium/high), lighting (poor/fair/good/excellent), isAcceptable (boolean), issues (string array), recommendations (string array).`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Validate this teacher profile photo. Is there exactly one clear human face? What's the clarity score (0-100)? Is it acceptable for a professional profile?",
            },
            {
              type: "image_url",
              image_url: {
                url: base64Data,
                detail: "high", // High detail for better face detection
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const analysis = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    // Extract validation results
    const faceDetected = analysis.faceDetected === true && analysis.faceCount === 1;
    const clarityScore = Math.min(100, Math.max(0, analysis.clarityScore || 0));
    
    // Determine if photo is acceptable (don't rely on AI's isAcceptable field)
    const isAcceptable = faceDetected && clarityScore >= 60;

    // Build validation message
    let validationMessage = "";
    let validationStatus: "approved" | "rejected" | "pending" = "rejected";
    
    if (!faceDetected) {
      if (analysis.faceCount === 0) {
        validationMessage = "No human face detected in the photo. Please upload a clear photo showing your face.";
      } else if (analysis.faceCount > 1) {
        validationMessage = `Multiple faces detected (${analysis.faceCount}). Please upload a photo with only yourself.`;
      } else {
        validationMessage = "Could not clearly detect a human face. Please ensure your face is visible and well-lit.";
      }
      validationStatus = "rejected";
    } else if (clarityScore < 60) {
      validationMessage = `Photo clarity is too low (score: ${clarityScore}/100). Please upload a clearer, well-focused photo.`;
      validationStatus = "rejected";
    } else {
      // Face detected and clarity is good
      validationMessage = "Photo validated successfully! Clear face detected with good quality.";
      validationStatus = "approved";
    }

    return {
      faceDetected,
      clarityScore,
      validationStatus,
      validationMessage,
      details: {
        faceCount: analysis.faceCount,
        blurriness: analysis.blurriness,
        lighting: analysis.lighting,
        recommendations: analysis.recommendations || [],
      },
    };
  } catch (error: any) {
    console.error("Photo validation error:", error);
    
    // Return pending status for temporary failures
    return {
      faceDetected: false,
      clarityScore: 0,
      validationStatus: "pending",
      validationMessage: `Photo validation temporarily unavailable: ${error.message}. Please try again.`,
    };
  }
}

/**
 * Validates photo from a URL (for testing/dev purposes)
 */
export async function validateTeacherPhotoFromUrl(
  imageUrl: string
): Promise<PhotoValidationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert photo validation AI for a professional educational platform. 
Analyze profile photos for teachers and validate they meet quality standards.
Return JSON with: faceDetected (boolean), faceCount (number), clarityScore (0-100), blurriness (low/medium/high), lighting (poor/fair/good/excellent), isAcceptable (boolean), issues (string array), recommendations (string array).`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Validate this teacher profile photo. Is there exactly one clear human face? What's the clarity score (0-100)?",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const analysis = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    const faceDetected = analysis.faceDetected === true && analysis.faceCount === 1;
    const clarityScore = Math.min(100, Math.max(0, analysis.clarityScore || 0));
    const isAcceptable = analysis.isAcceptable === true && clarityScore >= 60;

    return {
      faceDetected,
      clarityScore,
      validationStatus: isAcceptable ? "approved" : "rejected",
      validationMessage: isAcceptable
        ? "Photo validated successfully!"
        : analysis.issues?.join(". ") || "Photo validation failed.",
      details: {
        faceCount: analysis.faceCount,
        blurriness: analysis.blurriness,
        lighting: analysis.lighting,
        recommendations: analysis.recommendations || [],
      },
    };
  } catch (error: any) {
    console.error("Photo validation error:", error);
    return {
      faceDetected: false,
      clarityScore: 0,
      validationStatus: "pending",
      validationMessage: `Validation error: ${error.message}`,
    };
  }
}
