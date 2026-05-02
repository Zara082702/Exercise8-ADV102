import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  
  const [fontsLoaded, error] = useFonts({
    'Playfair-Regular': require('../../assets/images/fonts/PlayfairDisplay/PlayfairDisplay-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
      if (error) {
        console.warn("Font loading error:", error);
      }
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4B908C' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: '#4B908C',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}