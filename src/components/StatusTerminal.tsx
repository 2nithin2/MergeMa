import React, { useEffect, useRef } from 'react';

interface StatusTerminalProps {
  isOpen: boolean;
  logs: string[];
  title?: string;
}

export const StatusTerminal: React.FC<StatusTerminalProps> = ({
  isOpen,
  logs,
  title = "COMPILING SYSTEM MATRIX"
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when logs update
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="compiler-modal-overlay">
      <div className="compiler-window">
        <div className="compiler-header">
          <div className="compiler-title-text">{title}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }}></span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }}></span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }}></span>
          </div>
        </div>
        
        <div className="compiler-body">
          {/* Futuristic Concentric Spinner */}
          <div className="loader-concentric">
            <div className="loader-circle loader-outer"></div>
            <div className="loader-circle loader-middle"></div>
            <div className="loader-circle loader-inner"></div>
          </div>
          
          <div className="status-terminal-output">
            {logs.map((log, index) => {
              let logClass = "terminal-line";
              if (log.toLowerCase().includes("completed") || log.toLowerCase().includes("saved") || log.toLowerCase().includes("downloading")) {
                logClass += " success";
              } else if (log.toLowerCase().includes("error") || log.toLowerCase().includes("failed")) {
                logClass += " error";
              } else if (log.startsWith(">")) {
                logClass += " info";
              }
              
              return (
                <div key={index} className={logClass}>
                  {log}
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default StatusTerminal;
