import './globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Cards' };

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body>
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
