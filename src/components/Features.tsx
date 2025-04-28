
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Mic, Check, Search } from 'lucide-react';

const features = [
  {
    title: "Real-Time AI Interview Room",
    description: "HD video capture with real-time speech-to-text, speaker diarization, and <200ms latency from speech to displayed text.",
    icon: <Video className="h-10 w-10 text-primary" />,
  },
  {
    title: "Candidate Assessment System",
    description: "AI-monitored technical skills evaluation with real-time code execution, resume parsing, and behavioral analysis.",
    icon: <Search className="h-10 w-10 text-secondary" />,
  },
  {
    title: "Session Recording & Analysis",
    description: "Cloud recording with automatic compression, chaptered navigation, and multi-modal analysis of audio/video insights.",
    icon: <Mic className="h-10 w-10 text-accent" />,
  },
  {
    title: "Enterprise Security",
    description: "SOC 2 Type II compliance, GDPR data handling, end-to-end encryption, and configurable data retention policies.",
    icon: <Check className="h-10 w-10 text-green-500" />,
  }
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-background/60 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Powered by Advanced AI Technology
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            InterviewAI combines cutting-edge technologies to create a seamless, 
            insightful interview experience for both interviewers and candidates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          {features.map((feature, index) => (
            <Card key={index} className="border bg-card/50 backdrop-blur-sm transition-all hover:shadow-md">
              <CardHeader>
                <div className="mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
