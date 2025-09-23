"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginForm() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(formData.username, formData.password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const styles = {
    container: {
      maxWidth: 400,
      margin: "0 auto",
      padding: "32px",
      backgroundColor: "#ffffff",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      border: "1px solid #e5e5e5",
    },
    title: {
      textAlign: "center",
      marginBottom: 24,
      fontSize: "24px",
      fontWeight: 600,
      color: "#2d4a2b",
      letterSpacing: "-0.3px",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
    },
    fieldGroup: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    label: {
      fontSize: "14px",
      fontWeight: 500,
      color: "#2d4a2b",
      letterSpacing: "0.2px",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #e5e5e5",
      borderRadius: 6,
      fontSize: "16px",
      color: "#2d4a2b",
      backgroundColor: "#ffffff",
      transition: "border-color 0.2s ease",
      outline: "none",
      fontFamily: "inherit",
    },
    inputFocus: {
      borderColor: "#22c55e",
    },
    errorContainer: {
      padding: "12px 16px",
      backgroundColor: "#fff5f5",
      border: "1px solid #fed7d7",
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    errorText: {
      color: "#e53e3e",
      fontSize: "14px",
      fontWeight: 500,
      margin: 0,
    },
    submitButton: {
      width: "100%",
      padding: "12px 16px",
      backgroundColor: loading ? "#f3f4f6" : "#22c55e",
      color: loading ? "#9ca3af" : "#ffffff",
      border: "none",
      borderRadius: 6,
      fontSize: "16px",
      fontWeight: 600,
      cursor: loading ? "not-allowed" : "pointer",
      transition: "all 0.2s ease",
      letterSpacing: "0.3px",
      marginTop: 4,
    },
    submitButtonHover: {
      backgroundColor: "#16a34a",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Welcome Back</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.input)}
            placeholder="Enter your username"
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.input)}
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div style={styles.errorContainer}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{ color: "#e53e3e" }}
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={styles.submitButton}
          onMouseEnter={(e) =>
            !loading && Object.assign(e.target.style, styles.submitButtonHover)
          }
          onMouseLeave={(e) =>
            Object.assign(e.target.style, styles.submitButton)
          }
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
