import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { CartFloatingToast } from '@/components/cart-floating-toast';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';

import { useEffect } from 'react';
import { router } from 'expo-router';
import { setupNotificationListeners } from '@/lib/push-notifications';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('[TabLayout] Push notification received:', notification.request.content.title);
      },
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.orderId) {
          router.push(`/orders/${data.orderId}` as any);
        } else if (data?.screen === 'dealer-status') {
          router.push('/dealer-status' as any);
        }
      }
    );

    return cleanup;
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
          <CartFloatingToast />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
