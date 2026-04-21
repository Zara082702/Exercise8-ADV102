# Image Upload Debug Test

## Quick Test Steps:

1. **Open your app in browser**
2. **Open Developer Tools** (F12 or right-click ? Inspect)
3. **Go to Console tab**
4. **Try uploading an image**
5. **Look for these messages:**

### Expected Console Output:
```
[ImagePicker] Permissions granted, launching picker...
[ImagePicker] Image selected: {uri: "blob:http://...", width: 300, height: 300, type: "image"}
[ImageUpload] Starting upload process...
[ImageUpload] Reading file as Base64...
[ImageUpload] Base64 created, size: 12345 bytes
[ImageUpload] Writing to Firestore...
[ImageUpload] Success! Photo ID: abc123
```

### If You See Errors:

**"PERMISSION_DENIED"** ? Firestore rules problem
**"User session expired"** ? Sign in again  
**"Failed to read image - file is empty"** ? Image picker issue
**Network error** ? Check internet connection

## Firestore Rules Check:

Go to: https://console.firebase.google.com/project/glowcoach-fd959/firestore/rules

Make sure rules look like this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /progressPhotos/{document=**} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    // ... other rules
  }
}
```

## Test Firestore Connection:

1. Open Firebase Console ? Firestore Database
2. Check if "progressPhotos" collection exists
3. Try creating a test document manually

## Alternative: Test with Simple Alert

If upload still fails, try this temporary test code:

```javascript
// Add this to handleAddProgressPhoto temporarily
console.log("TEST: User authenticated?", !!auth.currentUser);
console.log("TEST: User ID:", auth.currentUser?.uid);
Alert.alert("Debug", `User: ${auth.currentUser?.email || 'Not logged in'}`);
return; // Remove this return after testing
```

This will help us identify if it's auth, permissions, or Firestore.
