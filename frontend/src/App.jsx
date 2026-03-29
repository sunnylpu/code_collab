import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./hooks/useAuth.jsx";
import Home from "./pages/Home.jsx";
import EditorPage from "./pages/EditorPage.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#161b22",
              color: "#e6edf3",
              border: "1px solid #21262d",
              borderRadius: "10px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#3fb950", secondary: "#161b22" } },
            error:   { iconTheme: { primary: "#f85149", secondary: "#161b22" } },
          }}
        />
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/room/:roomId"   element={<EditorPage />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          {/* Catch-all → home */}
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
