import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { setMuted, getMuted, playHoverSound } from '../utils/audioEffects';

interface AudioToggleProps {
  onHover?: () => void;
}

export const AudioToggle: React.FC<AudioToggleProps> = ({ onHover }) => {
  const [muted, setMutedState] = useState(getMuted());

  const handleToggle = () => {
    const newState = !muted;
    setMuted(newState);
    setMutedState(newState);
    if (!newState) {
      // Play brief sound confirmation
      setTimeout(() => {
        playHoverSound();
      }, 50);
    }
  };

  const handleMouseEnter = () => {
    if (onHover) onHover();
  };

  return (
    <button 
      className={`audio-toggle-btn ${muted ? 'muted' : ''}`}
      onClick={handleToggle}
      onMouseEnter={handleMouseEnter}
      title={muted ? "Enable Audio ASMR Effects" : "Mute Audio ASMR Effects"}
    >
      <div className="wave-bars">
        <span className="wave-bar"></span>
        <span className="wave-bar"></span>
        <span className="wave-bar"></span>
        <span className="wave-bar"></span>
      </div>
      {muted ? (
        <>
          <VolumeX size={13} />
          <span>ASMR OFF</span>
        </>
      ) : (
        <>
          <Volume2 size={13} />
          <span>ASMR ON</span>
        </>
      )}
    </button>
  );
};
export default AudioToggle;
