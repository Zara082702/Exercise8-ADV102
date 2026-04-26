import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth, db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { saveProgressPhotoAsBase64 } from "../services/databaseService";

export default function UnifiedMainScreen() {
  const { user, loading, signInWithGoogle, googleLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const qInv = query(
      collection(db, "inventory"),
      where("userId", "==", user.uid),
    );
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setInventory(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const qPhoto = query(
      collection(db, "progressPhotos"),
      where("userId", "==", user.uid),
    );
    const unsubPhoto = onSnapshot(qPhoto, (snapshot) => {
      const photos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProgressPhotos(
        photos.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        ),
      );
    });

    return () => {
      unsubInv();
      unsubPhoto();
    };
  }, [user]);

  const handleAuthentication = async () => {
    if (!email || !password) return Alert.alert("Error", "Fill in all fields");
    setAuthLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      Alert.alert("Auth Error", error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  const handleAddProgressPhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission required",
          "Permission to access camera roll is required!",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        const uri = result.assets[0].uri;
        await saveProgressPhotoAsBase64(uri, "Skin progress photo");
        Alert.alert("Success", "Progress photo uploaded!");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );

  return (
    <ImageBackground
      source={require("../../assets/images/background1.jpg")}
      style={styles.background}
    >
      {user ? (
        <View style={styles.mainContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.welcomeText}>
              Welcome to GlowCoach, {user.displayName || user.email}!
            </Text>

            {progressPhotos.length > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.sectionTitle}>Skin Progress Photos</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photoScroll}
                  contentContainerStyle={styles.scrollContent}
                >
                  {progressPhotos.map((photo) => (
                    <View key={photo.id} style={styles.photoCard}>
                      <Image
                        source={{ uri: photo.imageUrl }}
                        style={styles.progressPhoto}
                      />

                      <View style={styles.photoInfo}>
                        <Text style={styles.photoDate}>
                          {photo.createdAt?.seconds
                            ? new Date(
                                photo.createdAt.seconds * 1000,
                              ).toLocaleDateString()
                            : "No date"}
                        </Text>
                        {photo.note ? (
                          <Text style={styles.photoNote} numberOfLines={2}>
                            {photo.note}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {inventory.length > 0 && (
              <View style={styles.inventoryContainer}>
                <View style={styles.inventoryHeader}>
                  <Text style={styles.inventorySectionTitle}>
                    Your Products
                  </Text>
                  <Text style={styles.inventoryCount}>{inventory.length}</Text>
                </View>

                <ScrollView
                  style={styles.inventoryScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {inventory.map((item) => (
                    <View key={item.id} style={styles.inventoryItem}>
                      <View style={styles.itemMainInfo}>
                        <Text style={styles.productBrand}>{item.brand}</Text>
                        <Text style={styles.productName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>

                      <View style={styles.expiryBadge}>
                        <Text style={styles.expiryLabel}>EXP</Text>
                        <Text style={styles.productExpiry}>
                          {item.expiryDate}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push("/modal")}
            >
              <Text style={styles.btnText}>Add New Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddProgressPhoto}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnText}>Add Progress Photo</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.btnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.authContainer}>
          <Text style={styles.logoText}>GlowCoach</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.mainBtn}
            onPress={handleAuthentication}
          >
            {authLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnText}>
                {isRegistering ? "Register" : "Login"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => signInWithGoogle()}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnText}>Sign in with Google</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.toggleText}>
              {isRegistering ? "Login instead" : "Sign Up instead"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  authContainer: { flex: 1, justifyContent: "center", padding: 30 },
  mainContainer: { flex: 1 },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4B908C",
    textAlign: "center",
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4B908C",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  mainBtn: {
    backgroundColor: "#4B908C",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  googleBtn: {
    backgroundColor: "#DB4437",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  addBtn: {
    backgroundColor: "#4B908C",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  logoutBtn: {
    backgroundColor: "#DB4437",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  btnText: { color: "#FFF", fontWeight: "bold" },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#BDC3C7" },
  dividerText: { marginHorizontal: 10, color: "#7F8C8D" },
  toggleText: { textAlign: "center", marginTop: 20, color: "#0b302e" },
  progressContainer: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1A1A1A",
    paddingHorizontal: 15,
  },
  scrollContent: {
    paddingHorizontal: 15,
  },
  photoCard: {
    marginRight: 12,
    width: 110,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  progressPhoto: {
    width: 110,
    height: 110,
    borderRadius: 0,
  },
  photoInfo: {
    padding: 6,
  },
  photoDate: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4B908C",
    marginBottom: 2,
  },
  photoNote: {
    fontSize: 11,
    color: "#444",
    lineHeight: 14,
  },
  inventoryContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inventoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  inventorySectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  inventoryCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  inventoryScroll: {},
  inventoryItem: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  itemMainInfo: {
    flex: 1,
    marginRight: 10,
  },
  productBrand: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  expiryBadge: {
    alignItems: "flex-end",
  },
  expiryLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#A1A1AA",
    marginBottom: 2,
  },
  productExpiry: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B908C",
  },
});
