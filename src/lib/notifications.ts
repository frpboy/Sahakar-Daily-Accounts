export function notify(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined") return;

  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, options);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, options);
      }
    });
  }
}

export function notifySuccess(message: string) {
  notify("✅ Success", { body: message });
}

export function notifyError(message: string) {
  notify("❌ Error", { body: message });
}

export function notifyInfo(title: string, message: string) {
  notify(title, { body: message });
}
