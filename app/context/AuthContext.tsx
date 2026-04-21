import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, User } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { auth } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  googleLoading: boolean; 
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  googleLoading: false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '749485071221-6538r5jf8b1o1a0sao2v00ghhqjd28s2.apps.googleusercontent.com',
    webClientId: '749485071221-6538r5jf8b1o1a0sao2v00ghhqjd28s2.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({
      scheme: 'glowcoach',
      preferLocalhost: true,
    }),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log('Auth state listener fired, user:', authUser ? authUser.uid : 'null');
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log('🔵 Response changed:', response?.type);
    if (response?.type === 'success' && response.authentication) {
      console.log('🔵 Google response received - SUCCESS');
      const { idToken, accessToken } = response.authentication;
      console.log('🔵 ID Token:', idToken ? `"${idToken.substring(0, 50)}..."` : 'null');
      console.log('🔵 ID Token type:', typeof idToken);
      console.log('🔵 Access Token:', accessToken ? `"${accessToken.substring(0, 50)}..."` : 'null');
      console.log('🔵 Access Token type:', typeof accessToken);
      
      if (!idToken && !accessToken) {
        console.error('❌ No tokens received from Google');
        setGoogleLoading(false);
        Alert.alert("Google Error", "Failed to get authentication token.");
        return;
      }
      console.log('🔵 Calling handleGoogleSignIn');
      handleGoogleSignIn(idToken || null, accessToken);
    } else if (response?.type === 'error') {
      console.error('❌ Google auth error:', response.error);
      setGoogleLoading(false);
      Alert.alert("Google Error", "Could not complete the login.");
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string | null, accessToken?: string) => {
    setGoogleLoading(true);
    try {
      console.log('🟡 Starting Google sign-in...');
      
      let credential;
      
      
      if (idToken) {
        console.log('🟡 Attempting with ID Token');
        try {
          credential = GoogleAuthProvider.credential(idToken);
          console.log('✅ ID Token credential created successfully');
        } catch (idTokenError) {
          console.error('❌ Failed to create credential with ID token:', idTokenError);
          console.log('🟡 ID Token error, trying with access token');
        }
      }
      
      
      if (!credential && accessToken) {
        console.log('🟡 Attempting with Access Token');
        try {
          credential = GoogleAuthProvider.credential(null, accessToken);
          console.log('✅ Access Token credential created successfully');
        } catch (accessTokenError) {
          console.error('❌ Failed to create credential with Access token:', accessTokenError);
        }
      }

      if (!credential) {
        throw new Error('Could not create credential with either ID token or Access token');
      }

      console.log('🟡 Calling signInWithCredential...');
      const result = await signInWithCredential(auth, credential);
      console.log('✅ Firebase sign-in successful');
      console.log('✅ User UID:', result.user.uid);
      console.log('✅ User email:', result.user.email);
      
      
      setUser(result.user);
      console.log('✅ User state updated manually');
      setGoogleLoading(false);
    } catch (error: any) {
      console.error('❌ Google sign-in failed');
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      setGoogleLoading(false);
      Alert.alert("Login Failed", error.message);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, googleLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);