import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { registerToastHandler } from "@/src/lib/toast";

type ToastContextType = {
  show: (title: string, message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
      setTitle("");
      setMessage("");
    });
  }, [opacity]);

  const show = useCallback(
    (nextTitle: string, nextMessage: string, duration = 4000) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTitle(nextTitle);
      setMessage(nextMessage);
      setVisible(true);
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timerRef.current = setTimeout(hide, duration);
    },
    [hide, opacity]
  );

  useEffect(() => {
    registerToastHandler(show);
    return () => registerToastHandler(null);
  }, [show]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible ? (
        <Animated.View pointerEvents="box-none" style={[styles.host, { opacity }]}>
          <Pressable style={styles.card} onPress={hide}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 56,
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { color: "#fff", fontSize: 15, fontWeight: "700" },
  message: { color: "#e5e7eb", fontSize: 13, lineHeight: 18 },
});
