import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ImageBackground, useColorScheme } from 'react-native';
import 'react-native-reanimated';


import { AuthProvider } from './context/AuthContext';

export {
  ErrorBoundary
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const colorScheme = useColorScheme();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme} />
    </AuthProvider>
  );
}

function RootLayoutNav({ theme }: { theme: any }) {
  return (
    <ThemeProvider value={theme}>
      <ImageBackground source={require('../assets/images/background1.jpg')} style={{ flex: 1 }} imageStyle={{ resizeMode: 'cover' }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ImageBackground>
    </ThemeProvider>
  );
}