
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-background to-background/60 pt-20">
      <div className="container mx-auto px-4 pt-16 pb-24 sm:px-6 lg:px-8 lg:pt-32">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left column - Text content */}
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              <span className="block">AI-Powered</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient">
                Interview Platform
              </span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              Transform your hiring process with our AI-powered interview platform. Get real-time transcription, 
              smart candidate assessments, and comprehensive video insights—all with enterprise-grade security.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group">
                Request Demo
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline">
                Explore Features
              </Button>
            </div>
            <div className="mt-8 flex items-center space-x-4 text-sm">
              <div className="flex -space-x-1 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-background"
                    style={{ 
                      backgroundColor: `hsl(${220 + i * 10}, 70%, 50%)`,
                      zIndex: 5 - i
                    }}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                Trusted by 500+ tech companies
              </span>
            </div>
          </div>

          {/* Right column - Illustration/Animation */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="aspect-[4/3] w-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-xl relative">
              {/* Triangular architecture visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-3/4 h-3/4">
                  {/* Client */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg animate-float" style={{ animationDelay: '0s' }}>
                    <div className="w-32 h-16 flex items-center justify-center bg-gradient-to-r from-primary to-secondary rounded-md">
                      <span className="text-white font-medium">Interview</span>
                    </div>
                  </div>
                  
                  {/* Supabase */}
                  <div className="absolute bottom-0 left-0 bg-white p-4 rounded-lg shadow-lg animate-float" style={{ animationDelay: '0.5s' }}>
                    <div className="w-32 h-16 flex items-center justify-center bg-black rounded-md">
                      <span className="text-green-500 font-medium">Security</span>
                    </div>
                  </div>
                  
                  {/* OpenAI */}
                  <div className="absolute bottom-0 right-0 bg-white p-4 rounded-lg shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                    <div className="w-32 h-16 flex items-center justify-center bg-[#10a37f] rounded-md">
                      <span className="text-white font-medium">AI</span>
                    </div>
                  </div>
                  
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="50" y1="15" x2="15" y2="85" stroke="url(#line-gradient-1)" strokeWidth="1.5" strokeDasharray="4 2" />
                    <line x1="50" y1="15" x2="85" y2="85" stroke="url(#line-gradient-2)" strokeWidth="1.5" strokeDasharray="4 2" />
                    <line x1="15" y1="85" x2="85" y2="85" stroke="url(#line-gradient-3)" strokeWidth="1.5" strokeDasharray="4 2" />
                    
                    {/* Animated dots */}
                    <circle className="animate-pulse-glow" cx="50" cy="15" r="2" fill="#6366f1" />
                    <circle className="animate-pulse-glow" cx="15" cy="85" r="2" fill="#6366f1" />
                    <circle className="animate-pulse-glow" cx="85" cy="85" r="2" fill="#6366f1" />
                    
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="line-gradient-1" x1="50%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#10a37f" />
                      </linearGradient>
                      <linearGradient id="line-gradient-2" x1="50%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#10a37f" />
                      </linearGradient>
                      <linearGradient id="line-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10a37f" />
                        <stop offset="100%" stopColor="#10a37f" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="hidden sm:block sm:absolute sm:-top-10 sm:right-1/2 sm:-z-10 sm:mr-10 sm:transform-gpu sm:blur-3xl">
        <div 
          className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-primary to-secondary opacity-25"
          style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}
        />
      </div>
      <div className="hidden sm:block sm:absolute sm:-top-40 sm:right-1/2 sm:-z-10 sm:mr-10 sm:transform-gpu sm:blur-3xl">
        <div 
          className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-secondary to-accent opacity-25"
          style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}
        />
      </div>
    </div>
  );
};

export default Hero;
