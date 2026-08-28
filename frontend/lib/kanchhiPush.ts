"use client";

export type KanchhiPushSubscriptionPayload = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type KanchhiPushState = {
  supported: boolean;
  permission:
    | "default"
    | "granted"
    | "denied"
    | "unsupported";
  subscribed: boolean;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

const CONFIG_URL =
  `${BACKEND_URL}/api/push/config`;

function isPushSupported(): boolean {
  return (
    typeof window !==
      "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function base64ToUint8Array(
  value: string,
): Uint8Array {
  const padding =
    "=".repeat(
      (4 -
        (value.length %
          4)) %
        4,
    );

  const base64 =
    (
      value +
      padding
    )
      .replace(
        /-/g,
        "+",
      )
      .replace(
        /_/g,
        "/",
      );

  const rawData =
    window.atob(
      base64,
    );

  const output =
    new Uint8Array(
      rawData.length,
    );

  for (
    let index = 0;
    index < rawData.length;
    index += 1
  ) {
    output[index] =
      rawData.charCodeAt(
        index,
      );
  }

  return output;
}

export async function getKanchhiPushConfig():
  Promise<{
    success: boolean;
    publicKey?: string;
    error?: string;
  }> {
  const response =
    await fetch(
      CONFIG_URL,
      {
        cache:
          "no-store",
      },
    );

  const data =
    await response.json();

  return data;
}

export async function initializeKanchhiPush():
  Promise<ServiceWorkerRegistration> {
  if (
    !isPushSupported()
  ) {
    throw new Error(
      "This browser does not support browser push notifications.",
    );
  }

  return navigator.serviceWorker.register(
    "/sw.js",
    {
      scope: "/",
    },
  );
}

export async function getKanchhiPushState():
  Promise<KanchhiPushState> {
  if (
    !isPushSupported()
  ) {
    return {
      supported: false,
      permission:
        "unsupported",
      subscribed: false,
    };
  }

  const registration =
    await navigator.serviceWorker.ready;

  const subscription =
    await registration.pushManager.getSubscription();

  return {
    supported: true,
    permission:
      Notification.permission,
    subscribed:
      Boolean(subscription),
  };
}

export async function subscribeKanchhiPush():
  Promise<PushSubscription> {
  if (
    !isPushSupported()
  ) {
    throw new Error(
      "Push notifications are not supported.",
    );
  }

  const config =
    await getKanchhiPushConfig();

  if (
    !config.success ||
    !config.publicKey
  ) {
    throw new Error(
      config.error ||
        "KANCHHI push configuration is unavailable.",
    );
  }

  const permission =
    await Notification.requestPermission();

  if (
    permission !==
    "granted"
  ) {
    throw new Error(
      "Browser notification permission was not granted.",
    );
  }

  await initializeKanchhiPush();

  const registration =
    await navigator.serviceWorker.ready;

  const existing =
    await registration.pushManager.getSubscription();

  if (existing) {
    await sendSubscriptionToBackend(
      existing,
    );

    return existing;
  }

  const subscription =
    await registration.pushManager.subscribe(
      {
        userVisibleOnly: true,
        applicationServerKey:
          base64ToUint8Array(
            config.publicKey,
          ) as BufferSource,
      },
    );

  await sendSubscriptionToBackend(
    subscription,
  );

  return subscription;
}

export async function unsubscribeKanchhiPush():
  Promise<void> {
  if (
    !isPushSupported()
  ) {
    return;
  }

  const registration =
    await navigator.serviceWorker.ready;

  const subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  const endpoint =
    subscription.endpoint;

  await subscription.unsubscribe();

  try {
    await fetch(
      `${BACKEND_URL}/api/push/unsubscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            endpoint,
          }),
      },
    );
  } catch {
    /*
     * Browser unsubscribe succeeded even if
     * backend synchronization failed.
     */
  }
}

async function sendSubscriptionToBackend(
  subscription: PushSubscription,
): Promise<void> {
  const json =
    subscription.toJSON();

  const payload:
    KanchhiPushSubscriptionPayload = {
    endpoint:
      subscription.endpoint,

    expirationTime:
      subscription.expirationTime,

    keys: {
      p256dh:
        json.keys?.p256dh ||
        "",
      auth:
        json.keys?.auth ||
        "",
    },
  };

  if (
    !payload.keys.p256dh ||
    !payload.keys.auth
  ) {
    throw new Error(
      "Browser did not provide a complete push subscription.",
    );
  }

  const response =
    await fetch(
      `${BACKEND_URL}/api/push/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify(
            payload,
          ),
      },
    );

  const data =
    await response
      .json()
      .catch(
        () => null,
      );

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        "KANCHHI could not register the push subscription.",
    );
  }
}

export async function sendKanchhiTestPush():
  Promise<void> {
  const response =
    await fetch(
      `${BACKEND_URL}/api/push/test`,
      {
        method: "POST",
        headers: {
          Accept:
            "application/json",
        },
      },
    );

  const data =
    await response
      .json()
      .catch(
        () => null,
      );

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        "KANCHHI test notification failed.",
    );
  }

  if (
    data?.success === false
  ) {
    throw new Error(
      data?.message ||
        "KANCHHI test notification failed.",
    );
  }
}