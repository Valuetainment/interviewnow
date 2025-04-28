
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const pricingPlans = [
  {
    name: "Starter",
    description: "Perfect for small companies just getting started with technical interviews.",
    price: "$299",
    period: "/month",
    features: [
      "Up to 5 users",
      "20 interviews/month",
      "30-day recording retention",
      "Basic AI assessment",
      "Email support",
    ],
    popular: false,
    buttonText: "Start free trial",
    buttonVariant: "outline" as const,
  },
  {
    name: "Professional",
    description: "Ideal for growing companies with regular interviewing needs.",
    price: "$799",
    period: "/month",
    features: [
      "Up to 20 users",
      "100 interviews/month",
      "90-day recording retention",
      "Advanced assessments",
      "API access",
      "Priority support",
    ],
    popular: true,
    buttonText: "Start free trial",
    buttonVariant: "default" as const,
  },
  {
    name: "Enterprise",
    description: "Customized solution for large companies with high-volume hiring.",
    price: "Custom",
    period: "",
    features: [
      "Unlimited users",
      "Custom interview volume",
      "Custom retention policies",
      "Dedicated support",
      "SSO & custom security",
      "White-labeling options",
    ],
    popular: false,
    buttonText: "Contact sales",
    buttonVariant: "outline" as const,
  },
];

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Flexible Pricing</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that works best for your company's hiring needs.
            All plans include our core interviewing platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <div key={index} className={`flex ${plan.popular ? 'md:-mt-8 md:mb-8' : ''}`}>
              <Card className={`flex flex-col w-full border ${
                plan.popular 
                  ? 'border-primary shadow-lg shadow-primary/20' 
                  : 'bg-card/50 backdrop-blur-sm'
              }`}>
                {plan.popular && (
                  <div className="px-4 py-1 bg-primary text-primary-foreground text-center text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="ml-1 text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={plan.buttonVariant}
                    className="w-full" 
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Need more interviews? <span className="font-medium">Additional interview packs available for all tiers.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
