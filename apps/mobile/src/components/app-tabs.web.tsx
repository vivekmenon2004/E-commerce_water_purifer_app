import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View, Text } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCart } from '@/context/cart-context';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export default function AppTabs() {
  const { itemCount, wishlist } = useCart();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Catalog</TabButton>
          </TabTrigger>
          <TabTrigger name="cart" href={"/cart" as any} asChild>
            <TabButton badge={itemCount > 0 ? itemCount : undefined}>Cart</TabButton>
          </TabTrigger>
          <TabTrigger name="wishlist" href={"/wishlist" as any} asChild>
            <TabButton badge={wishlist.length > 0 ? wishlist.length : undefined}>Wishlist</TabButton>
          </TabTrigger>
          <TabTrigger name="services" href="/services" asChild>
            <TabButton>Services</TabButton>
          </TabTrigger>
          <TabTrigger name="account" href={"/account" as any} asChild>
            <TabButton>Account</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  badge,
  ...props
}: TabTriggerSlotProps & { badge?: number }) {
  return (
    <Pressable
      {...(props as any)}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <View style={styles.tabButtonInner}>
          <ThemedText type="small" themeColor={isFocused ? 'primary' : 'textSecondary'}>
            {children}
          </ThemedText>
          {badge !== undefined && (
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          💧 Calinfco Pure
        </ThemedText>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.sm,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
    color: '#0077B6',
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tabButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
});
