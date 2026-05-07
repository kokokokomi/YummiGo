import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text } from "react-native";
// import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider } from "@/src/state/auth";
import { CartProvider } from "@/src/state/cart";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) return null;

  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerTitleAlign: "center", headerBackTitle: "戻る", headerBackButtonMenuEnabled: false }}>
            <Stack.Screen name="login" options={{ title: "ログイン", headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="order/confirm" options={{ title: "注文確認" }} />
            <Stack.Screen
              name="order/detail"
              options={{
                title: "注文詳細",
                headerBackVisible: false,
                gestureEnabled: false,
                headerLeft: () => (
                  <Pressable onPress={() => router.replace("/(tabs)/orders")}>
                    <Text style={{ color: "#2563eb", fontWeight: "700" }}>戻る</Text>
                  </Pressable>
                ),
              }}
            />
            <Stack.Screen name="profile/edit" options={{ title: "個人情報編集" }} />
            <Stack.Screen name="profile/password" options={{ title: "パスワード変更" }} />
            <Stack.Screen name="profile/address" options={{ title: "住所管理" }} />
            <Stack.Screen name="payment/success" options={{ title: "支払い成功" }} />
            <Stack.Screen name="payment/cancel" options={{ title: "支払いキャンセル" }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}
