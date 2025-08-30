"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../contexts/SessionContext";
import Trackpad from "../components/Trackpad";

export default function TrackpadPage() {
  const { user, isLoading, isAuthenticated, logout } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 gap-2 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                📱 Trackpad
              </h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-gray-600">
                  Connected as {user?.name}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">{user?.email}</div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
            Remote Drawing Control
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
            Use this trackpad to draw remotely on your whiteboard. Your drawings
            will appear in real-time on the whiteboard page.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Instructions:</h3>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>• Touch and drag on the trackpad to draw</li>
              <li>• Your cursor position is shown in real-time</li>
              <li>• Drawings sync instantly with the whiteboard</li>
              <li>• Works with multiple devices in the same session</li>
              <li>• Rotate to landscape for better mobile control</li>
            </ul>
          </div>
        </div>

        <Trackpad />

        <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
            Session Information
          </h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-mono text-xs">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className="font-medium">Trackpad Control</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
