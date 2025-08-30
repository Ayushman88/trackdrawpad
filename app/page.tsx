"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./contexts/SessionContext";

export default function HomePage() {
  const { isLoading, isAuthenticated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const boardType = localStorage.getItem("boardType");
      if (boardType) {
        router.push(`/${boardType}`);
      }
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Trackpad Drawing
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Collaborative drawing with real-time sync between devices
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <div className="flex items-center justify-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">🖼️</span>
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base text-gray-900">
                    Whiteboard
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    View & Draw
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">📱</span>
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base text-gray-900">
                    Trackpad
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Remote Control
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">
                How it works:
              </h3>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1 text-left">
                <li>• Open whiteboard on desktop/Mac</li>
                <li>• Use trackpad on mobile/phone</li>
                <li>• Draw remotely in real-time</li>
                <li>• Perfect for presentations & collaboration</li>
              </ul>
            </div>

            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              Get Started
            </button>

            <div className="text-xs sm:text-sm text-gray-500 space-y-1">
              <p>Perfect for:</p>
              <p>• Remote presentations • Teaching • Collaborative drawing</p>
              <p>• Mobile control • Touch-friendly interface</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
