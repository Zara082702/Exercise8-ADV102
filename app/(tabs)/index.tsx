import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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
  View
} from 'react-native';

import { auth, db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { saveProgressPhotoAsBase64 } from '../services/databaseService';

export default function UnifiedMainScreen() {
  const { user, loading, signInWithGoogle, googleLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

 

  useEffect(() => {
    if (!user) return;

    const qInv = query(collection(db, "inventory"), where("userId", "==", user.uid));
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qPhoto = query(collection(db, "progressPhotos"), where("userId", "==", user.uid));
    const unsubPhoto = onSnapshot(qPhoto, (snapshot) => {
      const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProgressPhotos(photos.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => { unsubInv(); unsubPhoto(); };
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
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert("Permission required", "Permission to access camera roll is required!");
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

  if (loading) return <View style={styles.centered}><ActivityIndicator /></View>;

  return (
    <ImageBackground source={require('../../assets/images/background1.jpg')} style={styles.background}>
      {user ? (
        <View style={styles.mainContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.welcomeText}>Welcome to GlowCoach, {user.displayName || user.email}!</Text>

            {progressPhotos.length > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.sectionTitle}>Skin Progress Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                  {progressPhotos.map((photo) => (
                    <View key={photo.id} style={styles.photoContainer}>
                      <Image source={{ uri: photo.imageUrl }} style={styles.progressPhoto} />
                      <Text style={styles.photoNote}>{photo.note}</Text>
                      <Text style={styles.photoDate}>
                        {photo.createdAt?.seconds ? new Date(photo.createdAt.seconds * 1000).toLocaleDateString() : 'No date'}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {inventory.length > 0 && (
              <View style={styles.inventoryContainer}>
                <Text style={styles.sectionTitle}>Your Products</Text>
                <ScrollView style={styles.inventoryScroll}>
                  {inventory.map((item) => (
                    <View key={item.id} style={styles.inventoryItem}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productBrand}>{item.brand}</Text>
                      <Text style={styles.productExpiry}>Expires: {item.expiryDate}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/modal')}>
              <Text style={styles.btnText}>Add New Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddProgressPhoto} disabled={uploading}>
              {uploading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Add Progress Photo</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.btnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.authContainer}>
          <Text style={styles.logoText}>GlowCoach</Text>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          
          <TouchableOpacity style={styles.mainBtn} onPress={handleAuthentication}>
            {authLoading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>{isRegistering ? "Register" : "Login"}</Text>}
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={() => signInWithGoogle()} disabled={googleLoading}>
            {googleLoading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Sign in with Google</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.toggleText}>{isRegistering ? "Login instead" : "Sign Up instead"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  authContainer: { flex: 1, justifyContent: 'center', padding: 30 },
  mainContainer: { flex: 1 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#4B908C', textAlign: 'center', marginBottom: 30 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#4B908C', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15 },
  mainBtn: { backgroundColor: '#4B908C', padding: 18, borderRadius: 10, alignItems: 'center' },
  googleBtn: { backgroundColor: '#DB4437', padding: 18, borderRadius: 10, alignItems: 'center' },
  addBtn: { backgroundColor: '#4B908C', padding: 18, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  logoutBtn: { backgroundColor: '#DB4437', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#BDC3C7' },
  dividerText: { marginHorizontal: 10, color: '#7F8C8D' },
  toggleText: { textAlign: 'center', marginTop: 20, color: '#0b302e' },
  progressContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoContainer: {
    marginRight: 15,
    alignItems: 'center',
  },
  progressPhoto: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 5,
  },
  photoNote: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  photoDate: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  inventoryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    maxHeight: 200,
  },
  inventoryScroll: {
    maxHeight: 150,
  },
  inventoryItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 1,
  },
  productExpiry: {
    fontSize: 12,
    color: '#4B908C',
    marginTop: 1,
  },
});