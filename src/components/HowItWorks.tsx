
import React from 'react';

const steps = [
  {
    number: "01",
    title: "User-Friendly Interface",
    description: "Start using InterviewAI without any complicated setup or downloads - just an intuitive experience for both interviewers and candidates.",
    details: [
      "One-click interview creation",
      "Adaptive video quality", 
      "Simple candidate joining process"
    ]
  },
  {
    number: "02",
    title: "Secure Cloud Platform",
    description: "Your interviews run on our secure, reliable cloud infrastructure with enterprise-grade protection for all your sensitive data.",
    details: [
      "Enterprise access controls",
      "End-to-end encryption",
      "Automatic synchronization"
    ]
  },
  {
    number: "03",
    title: "AI-Powered Analysis",
    description: "Get smart insights during and after interviews with our advanced AI that understands technical context and communication nuances.",
    details: [
      "Technical skills assessment",
      "Communication evaluation",
      "Candidate comparison"
    ]
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            Our seamless three-step approach combines powerful technology with a simple 
            user experience to transform your technical interviews.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary via-secondary to-accent hidden md:block" />

          {steps.map((step, index) => (
            <div key={index} className="relative z-10 mb-16 last:mb-0">
              <div className={`flex flex-col md:items-center md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                {/* Step number with gradient circle */}
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold mb-4 md:mb-0 relative">
                  {index % 2 === 0 ? (
                    <div className="absolute right-0 md:left-full h-px w-8 md:w-16 bg-gradient-to-r from-primary to-transparent hidden md:block"></div>
                  ) : (
                    <div className="absolute left-0 md:right-full h-px w-8 md:w-16 bg-gradient-to-l from-secondary to-transparent hidden md:block"></div>
                  )}
                  {step.number}
                </div>

                {/* Content */}
                <div className={`md:w-5/12 ${index % 2 === 0 ? 'md:ml-16' : 'md:mr-16'}`}>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                  <ul className="mt-4 space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                          <span className="h-2 w-2 rounded-full bg-primary"></span>
                        </span>
                        <span className="text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
