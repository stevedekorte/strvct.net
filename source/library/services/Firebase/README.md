# Firebase Storage Integration for Midjourney Style Transfer

This module provides Firebase Storage integration to enable Midjourney style transfer by hosting images with publicly accessible URLs.

## Why Firebase Storage?

Leonardo's S3 bucket blocks access from external services like PiAPI/Midjourney, preventing style transfer from working. Firebase Storage provides:
- **Public URLs** accessible by any external service
- **Free tier** with 5GB storage and 1GB/day bandwidth
- **Direct browser uploads** without server middleware
- **Persistent URLs** that don't expire like S3 presigned URLs

## Setup Instructions

### 1. Firebase Configuration

The Firebase project `undreamedof-e6aaa` is already created. You need to:

1. Go to [Firebase Console](https://console.firebase.google.com/project/undreamedof-e6aaa/settings/general)
2. Scroll to "Your apps" section
3. Click "Add app" > Web icon (if not already added)
4. Copy the configuration values:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",            // Copy this
     authDomain: "...",         // Already set
     projectId: "...",          // Already set
     storageBucket: "...",      // Already set  
     messagingSenderId: "...",  // Copy this
     appId: "..."               // Copy this
   };
   ```

5. Update `/Servers/AccountServer/info/services/FirebaseStorageService.json`:
   - Replace `NEEDS_WEB_API_KEY_FROM_FIREBASE_CONSOLE` with the actual `apiKey`
   - Replace `NEEDS_SENDER_ID_FROM_FIREBASE_CONSOLE` with the `messagingSenderId`
   - Replace `NEEDS_APP_ID_FROM_FIREBASE_CONSOLE` with the `appId`

### 2. Storage Rules Configuration

1. Go to [Firebase Storage Rules](https://console.firebase.google.com/project/undreamedof-e6aaa/storage/rules)
2. Set the following rules to allow public read access:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read access for style transfer images
    match /midjourney-style-transfer/{allPaths=**} {
      allow read;  // Anyone can read
      allow write: if request.auth != null;  // Optional: require auth for uploads
      // OR for testing without auth:
      // allow write;  // Anyone can write (use only for testing!)
    }
  }
}
```

3. Click "Publish" to apply the rules

### 3. Enable Storage in Firebase

1. Go to [Firebase Storage](https://console.firebase.google.com/project/undreamedof-e6aaa/storage)
2. Click "Get started" if Storage isn't enabled yet
3. Choose your storage location (use default)
4. Storage will be available at `undreamedof-e6aaa.appspot.com`

## How It Works

### Image Upload Flow

1. **OpenAI Image Generation**: Creates literal interpretation of prompt
2. **Midjourney Style Generation**: Creates artistic interpretation  
3. **Firebase Upload**: Both images uploaded to Firebase Storage
4. **Public URLs Generated**: Firebase provides publicly accessible URLs
5. **Style Transfer**: Midjourney applies style using `--sref` parameter with Firebase URLs
6. **Final Result**: Style-transferred image combining both interpretations

### Classes

- **`FirebaseStorageService`**: Manages Firebase configuration and SDK
- **`FirebaseStorageImage`**: Handles individual image uploads and URL management
- **`PiApiMidJourneyStyleTransfer`**: Updated to use Firebase instead of Leonardo S3

## Usage

Once configured, the style transfer will automatically:
1. Upload generated images to Firebase Storage
2. Use Firebase URLs for Midjourney style transfer
3. Apply artistic style to literal interpretations

The Firebase URLs are publicly accessible, solving the S3 access restriction issue.

## Troubleshooting

### "Firebase Storage is not configured"
- Ensure all three Web SDK values are set in FirebaseStorageService.json
- Check that the values are from the Web app, not the service account

### "Failed to upload to Firebase"  
- Check Storage is enabled in Firebase Console
- Verify storage rules allow writes
- Check browser console for CORS errors

### "Firebase URL not accessible"
- Ensure storage rules allow public read
- Check the upload path matches the rules path
- Verify Storage is enabled in your Firebase project

## Testing

1. Create a new PiApiMidJourneyStyleTransfer instance
2. Set a prompt (e.g., "A majestic castle on a mountain")
3. Click "Start Style Transfer"
4. Monitor the status messages:
   - "uploading OpenAI image to Firebase..."
   - "uploading Midjourney style image to Firebase..."
   - "applying Midjourney style to OpenAI image..."
5. Final result will show the style-transferred image

## Security Notes

- The current setup allows public read of uploaded images
- This is necessary for Midjourney/PiAPI to access the images
- Consider implementing:
  - Periodic cleanup of old images
  - Rate limiting on uploads
  - Authentication for uploads (already in rules template)
  - Monitoring of storage usage