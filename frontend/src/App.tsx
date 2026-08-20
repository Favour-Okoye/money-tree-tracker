import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { AppShell } from "./components/AppShell";
import { Library } from "./pages/Library";
import { VideoDetail } from "./pages/VideoDetail";
import { Login } from "./pages/Login";
import { More } from "./pages/More";
import { ComingSoon } from "./pages/ComingSoon";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/library" replace />} />
              <Route path="/library" element={<Library />} />
              <Route path="/library/:mediaType/:id" element={<VideoDetail />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/books"
                element={<ComingSoon emoji="📗" title="Books & reading tracker" phase="Phase 2" />}
              />
              <Route
                path="/tasks"
                element={<ComingSoon emoji="✅" title="Assignments & action items" phase="Phases 2–3" />}
              />
              <Route
                path="/moves"
                element={<ComingSoon emoji="🚀" title="Her Moves & events" phase="Phase 4" />}
              />
              <Route path="/more" element={<More />} />
              <Route path="*" element={<Navigate to="/library" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
