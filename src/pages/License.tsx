
import { Navbar } from '../components/Navbar';
import { FileText } from 'lucide-react';

const License = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <FileText className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">License</h1>
            <p className="text-lg text-foreground-secondary">
              Terms of use and distribution
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 animate-slide-up">
            <h2 className="text-xl font-semibold mb-4">MIT License</h2>
            <p className="text-foreground-secondary mb-6">
              Copyright (c) 2024 SecureWeb3
            </p>
            <p className="text-foreground-secondary mb-4">
              Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...
            </p>
            <p className="text-foreground-secondary">
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default License;
