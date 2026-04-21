import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { addProductToInventory } from './services/databaseService';

export default function AddProductModal() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [expiry, setExpiry] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !brand.trim() || !expiry.trim()) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await addProductToInventory({
        name: name.trim(),
        brand: brand.trim(),
        expiryDate: expiry.trim()
      });
      Alert.alert("Success", "Product saved to shelf!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const backgroundSource = require('../assets/images/background1.jpg');

  return (
    
    <ImageBackground 
      source={backgroundSource} 
      style={styles.container} 
      resizeMode="cover"
    >
      <StatusBar style="transparent" />
      <View style={styles.overlay}>
        <Text style={styles.title}>New Product</Text>
        <Text style={styles.subtitle}>Add a product to track its shelf life.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Brand</Text>
          <TextInput style={styles.input} value={brand} onChangeText={setBrand} />

          <Text style={styles.label}>Expiry Date</Text>
          <TextInput style={styles.input} value={expiry} onChangeText={setExpiry} maxLength={7} />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Save to Shelf</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    width: '100%', 
    height: '100%',
   
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  overlay: { 
    flex: 1, 
    padding: 25, 
    paddingTop: 60, 
    
    backgroundColor: 'rgba(255, 255, 255, 0.6)' 
  },
  title: { fontSize: 30, fontWeight: 'bold', color: '#333', fontFamily: 'Helvetica Neue' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  form: { flex: 1, justifyContent: 'center' },
  label: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#DDD' },
  saveBtn: { backgroundColor: '#4B908C', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  cancelBtn: { backgroundColor: '#FFF', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#4B908C' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  cancelText: { color: '#4B908C', fontWeight: 'bold' },
});