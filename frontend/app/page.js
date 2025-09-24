"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ImageUpload from "../components/ImageUpload";
import ImageGallery from "../components/ImageGallery";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [refreshGallery, setRefreshGallery] = useState(0);
  const [alert, setAlert] = useState("");

  // Show alert for 2 seconds
  const showAlert = (message) => {
    setAlert(message);
    setTimeout(() => setAlert(""), 2000);
  };

  // Detect login
  const [wasUser, setWasUser] = useState(false);
  if (user && !wasUser) {
    setWasUser(true);
    showAlert("Successfully logged in!");
  }
  if (!user && wasUser) {
    setWasUser(false);
    showAlert("Successfully logged out!");
  }

  const handleUploadSuccess = () => {
    setRefreshGallery((prev) => prev + 1);
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-white p-12 text-center">
        <div>
          <div className="mx-auto mb-3 w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <h1 className="text-lg font-semibold text-blue-700">Loading...</h1>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {alert && (
            <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded text-center font-medium animate-fade-in">
              {alert}
            </div>
          )}
          <div className="text-center mb-9">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                NeuraGallery
              </h1>
            </div>
            <p className="text-base text-gray-500 tracking-wide">
              AI-powered image processing and gallery
            </p>
          </div>
          {showRegister ? <RegisterForm /> : <LoginForm />}
          <div className="text-center mt-6">
            {showRegister ? (
              <p className="text-sm text-gray-900">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="text-blue-500 font-semibold py-0.5 rounded hover:text-blue-700 transition-colors underline underline-offset-2"
                >
                  Log in
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-900">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="text-blue-500 font-semibold py-0.5 rounded hover:text-blue-700 transition-colors underline underline-offset-2"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {alert && (
          <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded text-center font-medium animate-fade-in">
            {alert}
          </div>
        )}
        <div className="flex justify-between items-center mb-8 py-5 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
              Welcome back, {user.username}!
            </h1>
            <p className="text-base text-gray-500">
              Your AI-powered image processing workspace
            </p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2 bg-red-500 text-white rounded font-semibold text-sm hover:bg-orange-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        <section className="mb-6 bg-white rounded-lg p-6 shadow border border-gray-200">
          <ImageUpload onUploadSuccess={handleUploadSuccess} />
        </section>
        <section className="mb-6 bg-white rounded-lg p-6 shadow border border-gray-200">
          <ImageGallery refreshTrigger={refreshGallery} />
        </section>
      </div>
    </main>
  );
}
