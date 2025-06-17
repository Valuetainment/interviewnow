import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import CreatePosition from "./pages/CreatePosition";
import CreateSession from "./pages/CreateSession";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewRoomHybrid from "./pages/InterviewRoomHybrid";
import SessionDetail from "./pages/SessionDetail";
import Sessions from "./pages/Sessions";
import Candidate from "./pages/Candidate";
import CandidateProfile from "./pages/CandidateProfile";
import CompanySettings from "./pages/CompanySettings";
import TestInterview from "./pages/TestInterview";
import InterviewTestSimple from "./pages/InterviewTestSimple";
import SimpleWebRTCTest from "./pages/SimpleWebRTCTest";
import BasicWebRTCTest from "./pages/BasicWebRTCTest";
import Transcripts from "./pages/Transcripts";
import Positions from "./pages/Positions";
import PositionDetail from "./pages/PositionDetail";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import NewCompany from "./pages/NewCompany";
import EditCompany from "./pages/EditCompany";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import InterviewTestProduction from "./pages/InterviewTestProduction";
import DiagnosticTest from "./pages/DiagnosticTest";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from './hooks/useAuth';
import { WebRTCTestPage } from './pages/WebRTCTestPage';

// Import layout components
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ 
            v7_startTransition: true,
            v7_relativeSplatPath: true 
          }}>
            <Routes>
              {/* Public routes with MainLayout */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
              </Route>
              
              {/* Auth routes with AuthLayout */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>
              
              {/* Protected routes with DashboardLayout */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create-position" element={<CreatePosition />} />
                <Route path="/create-session" element={<CreateSession />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/sessions/:id" element={<SessionDetail />} />
                <Route path="/candidate" element={<Candidate />} />
                <Route path="/candidates" element={<Candidate />} />
                <Route path="/candidates/:id" element={<CandidateProfile />} />
                <Route path="/settings" element={<CompanySettings />} />
                <Route path="/test-interview" element={<TestInterview />} />
                <Route path="/interview-test-production" element={<InterviewTestProduction />} />
                <Route path="/transcripts" element={<Transcripts />} />
                <Route path="/positions" element={<Positions />} />
                <Route path="/positions/:id" element={<PositionDetail />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/new" element={<NewCompany />} />
                <Route path="/companies/:id/edit" element={<EditCompany />} />
              </Route>
              
              {/* Full-screen interview room (no dashboard layout) */}
              <Route path="/interview-room/:id" element={<InterviewRoom />} />
              
              {/* Hybrid WebRTC interview room for admin flow */}
              <Route path="/interview/:id" element={<InterviewRoomHybrid />} />

              {/* WebRTC test pages - all grouped under /test/ path for organization */}
              <Route path="/test/ngrok" element={<InterviewTestSimple />} />
              <Route path="/test/webrtc-hooks" element={<InterviewTestSimple />} />
              <Route path="/test/openai" element={<InterviewTestSimple />} />
              <Route path="/test/full" element={
                <ErrorBoundary>
                  <InterviewTestSimple />
                </ErrorBoundary>
              } />
              <Route path="/test/simple" element={<SimpleWebRTCTest />} />

              {/* Dedicated path for simplest test page access */}
              <Route path="/interview-test-simple" element={<InterviewTestSimple />} />
              <Route path="/simple-webrtc-test" element={<SimpleWebRTCTest />} />
              <Route path="/basic-webrtc-test" element={<BasicWebRTCTest />} />
              
              {/* Diagnostic route */}
              <Route path="/diagnostic" element={<DiagnosticTest />} />
              
              {/* WebRTC implementation test page */}
              <Route path="/test-webrtc" element={<WebRTCTestPage />} />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
