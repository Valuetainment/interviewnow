import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="container max-w-4xl py-16">
      <Link to="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="mb-4">
              Welcome to InterviewNow ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered interview platform.
            </p>
            <p className="mb-4">
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
              please do not access the site or use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3">Personal Information</h3>
            <p className="mb-4">We collect personal information that you provide to us, including but not limited to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Name and contact information (email address, phone number)</li>
              <li>Professional information (resume, work experience, education)</li>
              <li>Account credentials (username and password)</li>
              <li>Interview recordings and transcripts</li>
              <li>Assessment results and feedback</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Automatically Collected Information</h3>
            <p className="mb-4">When you use our platform, we automatically collect certain information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage data and analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>To provide and maintain our interview platform services</li>
              <li>To process and analyze interview sessions</li>
              <li>To generate AI-powered insights and recommendations</li>
              <li>To communicate with you about your account and our services</li>
              <li>To improve and optimize our platform</li>
              <li>To comply with legal obligations</li>
              <li>To protect against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
            <p className="mb-4">We may share your information in the following situations:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>With your consent:</strong> We may share your information with third parties when you give us explicit permission</li>
              <li><strong>With employers:</strong> Interview data may be shared with prospective employers as part of the recruitment process</li>
              <li><strong>Service providers:</strong> We work with third-party services for hosting, analytics, and other business operations</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by law or valid legal process</li>
              <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication measures</li>
              <li>Employee training on data protection</li>
              <li>Secure data storage and backup procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
            <p className="mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Opt-out:</strong> Opt-out of marketing communications</li>
              <li><strong>Withdraw consent:</strong> Withdraw previously given consent for data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, 
              unless a longer retention period is required or permitted by law. Interview recordings and transcripts are typically 
              retained for 12 months, unless you request earlier deletion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="mb-4">
              Our platform uses the following third-party services that may collect your information:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Supabase (Authentication and Database)</li>
              <li>OpenAI (AI Processing)</li>
              <li>WebRTC (Video Communications)</li>
              <li>Analytics Services</li>
            </ul>
            <p className="mb-4">
              These services have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p className="mb-4">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal 
              information from children under 18. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="mb-4">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new 
              privacy policy on this page and updating the "Last updated" date. We encourage you to review this privacy 
              policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">InterviewNow Privacy Team</p>
              <p>Email: privacy@interviewnow.ai</p>
              <p>Address: [Your Company Address]</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default Privacy; 