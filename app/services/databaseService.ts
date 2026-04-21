import * as FileSystem from "expo-file-system";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db } from "../config/firebase";

export const startRoutineTransaction = async (routineId: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const docRef = await addDoc(collection(db, "transactions"), {
    userId: userId,
    routineId: routineId,
    status: "pending", 
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    referenceNumber: `GLOW-${ Date.now()}`
  });

  return docRef.id;
};

export const updateTransactionStatus = async (transactionId: string, newStatus: "completed" | "cancelled") => {
  const transRef = doc(db, "transactions", transactionId);
  await updateDoc(transRef, {
    status: newStatus,
    updatedAt: serverTimestamp()
  });
};

export const addProductToInventory = async (product: { name: string, brand: string, expiryDate: string }) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  try {
    await addDoc(collection(db, "inventory"), {
      userId,
      ...product,
      isOpened: true,
      addedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding product: ", error);
    throw error;
  }
};

export const saveProgressPhotoAsBase64 = async (uri: string, note: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  try {
    console.log("[ImageUpload] Starting upload with URI:", uri);
    
    if (!auth.currentUser) {
      throw new Error("User session expired");
    }

    console.log("[ImageUpload] Reading file as Base64...");
    let base64: string;

    if (Platform.OS === 'web') {
      
      base64 = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(xhr.response);
        };
        xhr.onerror = () => reject(new Error("Failed to fetch image"));
        xhr.responseType = 'blob';
        xhr.open('GET', uri);
        xhr.send();
      });
    } else {
      
      base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
    }

    if (!base64 || base64.length === 0) {
      throw new Error("Failed to read image - file is empty");
    }

    console.log("[ImageUpload] Base64 created, size:", base64.length, "bytes");
    const base64Image = `data:image/jpeg;base64,${base64}`;

    console.log("[ImageUpload] Writing to Firestore...");
    const docRef = await addDoc(collection(db, "progressPhotos"), {
      userId,
      imageUrl: base64Image,
      note,
      createdAt: serverTimestamp(),
      uploadedAt: new Date().toISOString(),
    });

    console.log("[ImageUpload] Upload complete! Document ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("[ImageUpload] Error details:", {
      message: error.message,
      code: error.code,
    });
    
    if (error.message && error.message.includes("PERMISSION_DENIED")) {
      throw new Error("Firestore permission denied. Update your security rules.");
    }
    if (error.message && error.message.includes("NOT_FOUND")) {
      throw new Error("File not found. Select the image again.");
    }
    
    throw new Error(error.message || "Failed to upload photo");
  }
};
