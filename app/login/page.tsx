"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../contexts/SessionContext";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedBoard, setSelectedBoard] = useState<
    "whiteboard" | "trackpad" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useSession();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user types
  };

  const validateForm = () => {
    if (isSignup) {
      if (
        !formData.name.trim() ||
        !formData.email.trim() ||
        !formData.password
      ) {
        setError("All fields are required");
        return false;
      }
      if (formData.name.trim().length < 2) {
        setError("Name must be at least 2 characters long");
        return false;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    } else {
      if (!formData.email.trim() || !formData.password) {
        setError("Email and password are required");
        return false;
      }
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;
    if (!selectedBoard) {
      setError("Please select a board type");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignup
        ? {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          }
        : { email: formData.email.trim(), password: formData.password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store boardType in localStorage
        localStorage.setItem("boardType", selectedBoard);

        // Use SessionContext login function for proper authentication
        await login(data.token, data.user);

        // Add a small delay to ensure state is updated
        setTimeout(() => {
          router.push(`/${selectedBoard}`);

          // Fallback: if router.push doesn't work, use window.location
          setTimeout(() => {
            if (window.location.pathname !== `/${selectedBoard}`) {
              window.location.href = `/${selectedBoard}`;
            }
          }, 1000);
        }, 100);
      } else {
        setError(data.error || "Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Trackpad Drawing
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Collaborative drawing with real-time sync
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {isSignup && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full text-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
                className="w-full text-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter your password"
                className="w-full text-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
              />
            </div>

            {isSignup && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm your password"
                  className="w-full text-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => setIsSignup(false)}
                className={`flex-1 py-2.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  !isSignup
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsSignup(true)}
                className={`flex-1 py-2.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  isSignup
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="pt-3 sm:pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Select Board Type
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <button
                  onClick={() => setSelectedBoard("whiteboard")}
                  className={`flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 rounded-lg transition-colors ${
                    selectedBoard === "whiteboard"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🖼️</div>
                  <div className="font-medium text-sm sm:text-base">
                    Whiteboard
                  </div>
                  <div className="text-xs sm:text-sm opacity-90">
                    Draw & View
                  </div>
                </button>

                <button
                  onClick={() => setSelectedBoard("trackpad")}
                  className={`flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 rounded-lg transition-colors ${
                    selectedBoard === "trackpad"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📱</div>
                  <div className="font-medium text-sm sm:text-base">
                    Trackpad
                  </div>
                  <div className="text-xs sm:text-sm opacity-90">
                    Control & Draw
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={handleAuth}
              disabled={isLoading || !selectedBoard}
              className="w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
            >
              {isLoading ? "Processing..." : isSignup ? "Sign Up" : "Login"}
            </button>
          </div>

          <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500 space-y-1">
            <p>Choose your device type:</p>
            <p>
              <strong>Whiteboard:</strong> Desktop/Mac for viewing and drawing
            </p>
            <p>
              <strong>Trackpad:</strong> Mobile/Phone for remote control
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
