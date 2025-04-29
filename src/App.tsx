
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
import Candidate from "./pages/Candidate";
import CompanySettings from "./pages/CompanySettings";
import TestInterview from "./pages/TestInterview";
import Transcripts from "./pages/Transcripts";
import Positions from "./pages/Positions";
import PositionDetail from "./pages/PositionDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/create-position" element={<CreatePosition />} />
          <Route path="/candidate" element={<Candidate />} />
          <Route path="/candidates" element={<Candidate />} /> {/* Added this route as an alias */}
          <Route path="/settings" element={<CompanySettings />} />
          <Route path="/test-interview" element={<TestInterview />} />
          <Route path="/transcripts" element={<Transcripts />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/positions/:id" element={<PositionDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
