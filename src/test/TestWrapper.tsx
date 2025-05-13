import React, { ReactNode } from 'react';

interface TestWrapperProps {
  children: ReactNode;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return <>{children}</>;
};

export function renderWithWrapper(ui: React.ReactElement) {
  return <TestWrapper>{ui}</TestWrapper>;
}