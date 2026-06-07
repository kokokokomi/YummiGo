import { Alert } from "react-native";

type ToastHandler = (title: string, message: string, duration?: number) => void;

let toastHandler: ToastHandler | null = null;

export function registerToastHandler(handler: ToastHandler | null) {
  toastHandler = handler;
}

export function showAutoDismissToast(title: string, message: string, duration = 4000) {
  if (toastHandler) {
    toastHandler(title, message, duration);
    return;
  }
  Alert.alert(title, message);
}
