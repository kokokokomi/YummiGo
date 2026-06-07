import { MaterialIcons } from "@expo/vector-icons";
import { type Href } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { navigateBack } from "@/src/lib/navigation";

type Props = {
  fallback: Href;
};

export function StackBackButton({ fallback }: Props) {
  return (
    <Pressable
      onPress={() => navigateBack(fallback)}
      hitSlop={10}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel="戻る"
    >
      <MaterialIcons name="arrow-back" size={24} color="#111827" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 4, paddingVertical: 2 },
});
