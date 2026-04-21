// TEMPORARY DEBUG FUNCTION - Add this above handleAddProgressPhoto
const testFirestoreConnection = async () => {
  try {
    console.log("TEST: Checking authentication...");
    console.log("User authenticated:", !!auth.currentUser);
    console.log("User ID:", auth.currentUser?.uid);
    console.log("User email:", auth.currentUser?.email);
    
    console.log("TEST: Testing Firestore write...");
    const testDoc = await addDoc(collection(db, "test"), {
      test: true,
      timestamp: serverTimestamp(),
      userId: auth.currentUser?.uid || "anonymous"
    });
    
    console.log("TEST: Firestore write successful! Doc ID:", testDoc.id);
    Alert.alert("Success", "Firestore connection works!");
    
  } catch (error: any) {
    console.error("TEST ERROR:", error);
    Alert.alert("Test Failed", error.message);
  }
};

// TEMPORARY: Replace handleAddProgressPhoto call with testFirestoreConnection
// In the JSX: onPress={testFirestoreConnection}
