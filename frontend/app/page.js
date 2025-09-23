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

  const handleUploadSuccess = () => {
    // Trigger gallery refresh
    setRefreshGallery((prev) => prev + 1);
  };

  const styles = {
    loadingContainer: {
      padding: 48,
      textAlign: "center",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ffffff",
    },
    loadingText: {
      fontSize: "18px",
      color: "#2d4a2b",
      fontWeight: 500,
    },
    authContainer: {
      padding: "48px 24px",
      minHeight: "100vh",
      backgroundColor: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    authContent: {
      width: "100%",
      maxWidth: 460,
    },
    brandContainer: {
      textAlign: "center",
      marginBottom: 36,
    },
    brandTitle: {
      fontSize: "32px",
      fontWeight: 700,
      margin: 0,
      marginBottom: 8,
      color: "#2d4a2b",
      letterSpacing: "-0.5px",
    },
    brandSubtitle: {
      fontSize: "16px",
      fontWeight: 400,
      margin: 0,
      color: "#6b7280",
      letterSpacing: "0.2px",
    },
    switchContainer: {
      textAlign: "center",
      marginTop: 24,
    },
    switchText: {
      color: "#2d4a2b",
      fontSize: "14px",
      fontWeight: 400,
      margin: 0,
    },
    switchButton: {
      background: "none",
      border: "none",
      color: "#f97316",
      cursor: "pointer",
      textDecoration: "none",
      fontWeight: 600,
      fontSize: "14px",
      marginLeft: 4,
      padding: "2px 4px",
      borderRadius: 4,
      transition: "color 0.2s ease",
    },
    switchButtonHover: {
      color: "#ea580c",
    },
    dashboardContainer: {
      minHeight: "100vh",
      backgroundColor: "#ffffff",
      padding: "24px",
    },
    dashboardContent: {
      maxWidth: 1000,
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 32,
      padding: "20px 0",
      borderBottom: "1px solid #e5e5e5",
    },
    headerContent: {
      flex: 1,
    },
    welcomeTitle: {
      fontSize: "28px",
      fontWeight: 700,
      color: "#2d4a2b",
      margin: 0,
      marginBottom: 6,
      letterSpacing: "-0.3px",
    },
    welcomeSubtitle: {
      fontSize: "16px",
      color: "#6b7280",
      margin: 0,
      fontWeight: 400,
    },
    logoutButton: {
      padding: "10px 20px",
      backgroundColor: "#f97316",
      color: "white",
      border: "none",
      borderRadius: 6,
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s ease",
      letterSpacing: "0.2px",
    },
    logoutButtonHover: {
      backgroundColor: "#ea580c",
    },
    section: {
      marginBottom: 24,
      backgroundColor: "#ffffff",
      borderRadius: 8,
      padding: 24,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      border: "1px solid #e5e5e5",
    },
  };

  if (loading) {
    return (
      <main style={styles.loadingContainer}>
        <div>
          <div
            style={{
              width: 32,
              height: 32,
              border: "2px solid #e5e5e5",
              borderTop: "2px solid #22c55e",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px",
            }}
          ></div>
          <h1 style={styles.loadingText}>Loading...</h1>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.authContainer}>
        <div style={styles.authContent}>
          <div style={styles.brandContainer}>
            <h1 style={styles.brandTitle}>NeuraGallery</h1>
            <p style={styles.brandSubtitle}>
              AI-powered image processing and gallery
            </p>
          </div>

          {showRegister ? <RegisterForm /> : <LoginForm />}

          <div style={styles.switchContainer}>
            {showRegister ? (
              <p style={styles.switchText}>
                Already have an account?{" "}
                <button
                  onClick={() => setShowRegister(false)}
                  style={styles.switchButton}
                  onMouseEnter={(e) =>
                    Object.assign(e.target.style, styles.switchButtonHover)
                  }
                  onMouseLeave={(e) =>
                    Object.assign(e.target.style, styles.switchButton)
                  }
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p style={styles.switchText}>
                Don't have an account?{" "}
                <button
                  onClick={() => setShowRegister(true)}
                  style={styles.switchButton}
                  onMouseEnter={(e) =>
                    Object.assign(e.target.style, styles.switchButtonHover)
                  }
                  onMouseLeave={(e) =>
                    Object.assign(e.target.style, styles.switchButton)
                  }
                >
                  Create account
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.dashboardContainer}>
      <div style={styles.dashboardContent}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.welcomeTitle}>Welcome back, {user.username}!</h1>
            <p style={styles.welcomeSubtitle}>
              Your AI-powered image processing workspace
            </p>
          </div>
          <button
            onClick={logout}
            style={styles.logoutButton}
            onMouseEnter={(e) =>
              Object.assign(e.target.style, styles.logoutButtonHover)
            }
            onMouseLeave={(e) =>
              Object.assign(e.target.style, styles.logoutButton)
            }
          >
            Sign Out
          </button>
        </div>

        <div style={styles.section}>
          <ImageUpload onUploadSuccess={handleUploadSuccess} />
        </div>

        <div style={styles.section}>
          <ImageGallery refreshTrigger={refreshGallery} />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
