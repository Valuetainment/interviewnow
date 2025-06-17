import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-muted/30 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Features</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Integrations</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Enterprise</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Documentation</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">API Reference</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Blog</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Community</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">About</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Careers</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Contact</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Press</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Terms of Service</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Security</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">GDPR</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              InterviewAI
            </span>
          </div>
          <div className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} InterviewAI, Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
