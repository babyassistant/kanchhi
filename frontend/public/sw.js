self.addEventListener(
  "install",
  () => {
    self.skipWaiting();
  },
);

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      self.clients.claim(),
    );
  },
);

self.addEventListener(
  "push",
  (event) => {
    let data = {
      title: "KANCHHI",
      body: "You have a new KANCHHI notification.",
      url: "/",
    };

    try {
      if (
        event.data
      ) {
        data = {
          ...data,
          ...event.data.json(),
        };
      }
    } catch {
      /*
       * Keep defaults.
       */
    }

    event.waitUntil(
      self.registration.showNotification(
        data.title || "KANCHHI",
        {
          body:
            data.body ||
            "You have a new KANCHHI notification.",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          data: {
            url:
              data.url || "/",
          },
        },
      ),
    );
  },
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl =
      event.notification.data?.url ||
      "/";

    event.waitUntil(
      self.clients.matchAll(
        {
          type: "window",
          includeUncontrolled: true,
        },
      ).then(
        (clients) => {
          for (
            const client of clients
          ) {
            if (
              "focus" in client
            ) {
              client.navigate(
                targetUrl,
              );

              return client.focus();
            }
          }

          if (
            self.clients.openWindow
          ) {
            return self.clients.openWindow(
              targetUrl,
            );
          }

          return undefined;
        },
      ),
    );
  },
);