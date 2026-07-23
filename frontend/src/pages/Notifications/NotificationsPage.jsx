import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");

      setNotifications(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const closeNotification = async (id) => {
    try {
      await api.patch(`/notifications/${id}/close`);

      setNotifications((prev) =>
        prev.filter((item) => item._id !== id)
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">Notifications</h1>

        <div className="mt-6 text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Notifications
          </h1>

          <p className="text-gray-500 mt-1">
            Active reminders and alerts
          </p>
        </div>

        <div className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold">
          {notifications.length} Active
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow border p-10 text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            No Active Notifications
          </h2>

          <p className="text-gray-500 mt-2">
            Everything looks good.
          </p>
        </div>
      ) : (
        <div className="space-y-5">

          {notifications.map((item) => (

            <div
              key={item._id}
              className="bg-white border rounded-xl shadow-sm p-6 flex justify-between items-start"
            >

              <div className="flex-1">

                <div className="flex items-center gap-3">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      item.priority === "Critical"
                        ? "bg-red-100 text-red-700"
                        : item.priority === "High"
                        ? "bg-orange-100 text-orange-700"
                        : item.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.priority}
                  </span>

                  <span className="text-sm text-gray-500">
                    {item.type}
                  </span>

                </div>

                <h2 className="text-xl font-semibold mt-3">
                  {item.title}
                </h2>

                <p className="text-gray-600 mt-2">
                  {item.message}
                </p>

                {item.dueDate && (
                  <p className="text-sm text-red-500 mt-3">
                    Due :
                    {" "}
                    {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  Created :
                  {" "}
                  {new Date(item.createdAt).toLocaleString()}
                </p>

              </div>

              <button
                onClick={() => closeNotification(item._id)}
                className="ml-8 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
              >
                Close
              </button>

            </div>

          ))}

        </div>
      )}

    </div>
  );
}