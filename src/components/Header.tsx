import React from 'react';
import AudioToggle from './AudioToggle';
import { Cpu } from 'lucide-react';

interface HeaderProps {
  onHoverSound?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHoverSound }) => {
  return (
    <header className="app-header">
      <div className="logo-container">
        <Cpu size={22} className="logo-icon" style={{ color: '#00f0ff', filter: 'drop-shadow(0 0 5px #00f0ff)' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="logo-text" style={{ lineHeight: '1.1' }}>Merge</h1>
          <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-cyber)', color: 'var(--accent-purple)', letterSpacing: '1px', marginTop: '2px', textShadow: '0 0 4px rgba(189,0,255,0.4)' }}>
            DEVELOPED BY NITHIN
          </span>
        </div>
      </div>
      <div>
        <AudioToggle onHover={onHoverSound} />
      </div>
    </header>
  );
};
export default Header;
