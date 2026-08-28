"use client";

import { useState } from "react";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time: string;
  type: "info" | "weather" | "news" | "system";
  read: boolean;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Welcome to KANCHHI",
    message:
      "Your KANCHHI notification center is ready.",
    time: "Just now",
    type: "system",
    read: false,
  },
  {
    id: 2,
    title: "Weather update",
    message:
      "Weather information is available for your current location.",
    time: "10 min ago",
    type: "weather",
    read: false,
  },
  {
    id: 3,
    title: "News update",
    message:
      "New articles are available in the KANCHHI news feed.",
    time: "30 min ago",
    type: "news",
    read: true,
  },
];

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >(initialNotifications);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const markAsRead = (id: number) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const getIcon = (
    type: NotificationItem["type"]
  ) => {
    switch (type) {
      case "weather":
        return "☁";

      case "news":
        return "◉";

      case "system":
        return "✦";

      default:
        return "ⓘ";
    }
  };

  return (
    <section className="p-8 lg:p-10">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 mb-8">

          <div>
            <p className="text-blue-400 text-sm font-medium mb-2">
              KANCHHI CENTER
            </p>

            <h2 className="text-4xl font-bold">
              Notifications
            </h2>

            <p className="text-slate-400 mt-2">
              Stay updated with important KANCHHI activity.
            </p>
          </div>

          <div className="flex items-center gap-2">

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-slate-300 transition"
              >
                Mark all read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-slate-300 transition"
              >
                Clear
              </button>
            )}

          </div>
        </div>

        {/* NOTIFICATION SUMMARY */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-5">
            <p className="text-sm text-slate-500">
              Total
            </p>

            <p className="text-3xl font-bold mt-2">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-5">
            <p className="text-sm text-slate-500">
              Unread
            </p>

            <p className="text-3xl font-bold mt-2 text-blue-400">
              {unreadCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111c2e] p-5">
            <p className="text-sm text-slate-500">
              Status
            </p>

            <p className="text-lg font-semibold mt-3">
              {unreadCount > 0
                ? "Needs attention"
                : "All caught up"}
            </p>
          </div>

        </div>

        {/* NOTIFICATIONS */}

        <div className="rounded-2xl border border-slate-800 bg-[#111c2e] overflow-hidden">

          {notifications.length === 0 ? (

            <div className="min-h-[360px] flex items-center justify-center p-8">

              <div className="text-center">

                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-3xl">
                  🔔
                </div>

                <h3 className="text-xl font-semibold">
                  You're all caught up
                </h3>

                <p className="text-slate-500 mt-2">
                  There are no notifications right now.
                </p>

              </div>

            </div>

          ) : (

            <div className="divide-y divide-slate-800">

              {notifications.map(
                (notification) => (

                  <div
                    key={notification.id}
                    className={`p-5 flex gap-4 transition ${
                      notification.read
                        ? "bg-transparent"
                        : "bg-blue-600/5"
                    }`}
                  >

                    {/* ICON */}

                    <div
                      className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-lg ${
                        notification.read
                          ? "bg-slate-800 text-slate-500"
                          : "bg-blue-600/20 text-blue-400"
                      }`}
                    >
                      {getIcon(notification.type)}
                    </div>

                    {/* CONTENT */}

                    <div className="flex-1 min-w-0">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <div className="flex items-center gap-2">

                            <h3 className="font-semibold">
                              {notification.title}
                            </h3>

                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                            )}

                          </div>

                          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                            {notification.message}
                          </p>

                          <p className="text-xs text-slate-600 mt-2">
                            {notification.time}
                          </p>

                        </div>

                        {!notification.read && (
                          <button
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                            className="shrink-0 text-xs text-blue-400 hover:text-blue-300 transition"
                          >
                            Mark read
                          </button>
                        )}

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>
    </section>
  );
}