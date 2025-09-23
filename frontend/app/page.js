"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <main style={{ padding: 32, textAlign: "center" }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        style={{ padding: 32, minHeight: "100vh", backgroundColor: "#f8f9fa" }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1>Welcome to NeuraGallery</h1>
          <p>AI-powered image processing and gallery</p>
        </div>

        {showRegister ? <RegisterForm /> : <LoginForm />}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          {showRegister ? (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => setShowRegister(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Login here
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => setShowRegister(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Register here
              </button>
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <div>
          <h1>Welcome to NeuraGallery, {user.username}!</h1>
          <p>Your AI-powered image processing workspace</p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          padding: 20,
          backgroundColor: "#f8f9fa",
          borderRadius: 8,
          border: "1px solid #dee2e6",
        }}
      >
        <h3>Image Processing Features (Coming Soon)</h3>
        <ul>
          <li>Upload and process images with OpenCV</li>
          <li>Apply filters and transformations</li>
          <li>Batch processing capabilities</li>
          <li>Export results in multiple formats</li>
        </ul>
      </div>
    </main>
  );
}
