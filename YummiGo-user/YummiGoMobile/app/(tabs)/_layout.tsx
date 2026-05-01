import { useEffect } from "react";
import { Tabs, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAuth } from "@/src/state/auth";

export default function TabLayout() {
  const { token, loading } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, token]);

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        tabBarActiveTintColor: "#2563eb",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "メニュー",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="restaurant-menu" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "注文",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt-long" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "マイページ",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
