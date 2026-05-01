import React from 'react';
import { AUTH_PAGE_STYLE, AUTH_SUBTITLE_STYLE, AUTH_TITLE_STYLE } from '../constants/theme';

const AuthLayout = ({ subtitle, title, children }) => (
  <div style={AUTH_PAGE_STYLE}>
    <header style={{ marginBottom: '48px', textAlign: 'center' }}>
      <h2 style={AUTH_SUBTITLE_STYLE}>{subtitle}</h2>
      <h1 style={AUTH_TITLE_STYLE}>{title}</h1>
    </header>
    {children}
  </div>
);

export default AuthLayout;
