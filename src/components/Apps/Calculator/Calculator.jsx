import React, { useState, useEffect, useCallback } from 'react';
import { playClickSound } from '../../../utils/audio';

export const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);

  const handleNum = useCallback((num) => {
    playClickSound();
    setDisplay(prev => {
      if (isCalculated || prev === '0') {
        setIsCalculated(false);
        return num;
      }
      return prev + num;
    });
  }, [isCalculated]);

  const handleOp = useCallback((op) => {
    playClickSound();
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
    setIsCalculated(false);
  }, [display]);

  const handleEqual = useCallback(() => {
    playClickSound();
    try {
      const fullExpr = equation + display;
      // Sanitize input to only allowed math chars
      const sanitized = fullExpr.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[\d\s+\-*/.]+$/.test(sanitized)) {
        setDisplay('Erreur');
        return;
      }
      // Safe evaluate
      const result = Function(`'use strict'; return (${sanitized})`)();
      setDisplay(String(Math.round(result * 100000000) / 100000000));
      setEquation('');
      setIsCalculated(true);
    } catch {
      setDisplay('Erreur');
    }
  }, [equation, display]);

  const handleClear = useCallback(() => {
    playClickSound();
    setDisplay('0');
    setEquation('');
    setIsCalculated(false);
  }, []);

  const handleBackspace = useCallback(() => {
    playClickSound();
    setDisplay(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return '0';
    });
  }, []);

  const handleDecimal = useCallback(() => {
    playClickSound();
    setDisplay(prev => {
      if (!prev.includes('.')) return prev + '.';
      return prev;
    });
  }, []);

  const handleToggleSign = useCallback(() => {
    playClickSound();
    setDisplay(prev => String(-Number(prev)));
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Numbers 0-9
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleNum(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === '+' || e.key === '-') {
        e.preventDefault();
        handleOp(e.key);
      } else if (e.key === '*') {
        e.preventDefault();
        handleOp('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOp('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEqual();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNum, handleDecimal, handleOp, handleEqual, handleBackspace, handleClear]);

  const btnStyle = {
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const opStyle = {
    ...btnStyle,
    background: 'var(--accent-color)',
    border: 'none',
    color: '#fff'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(15, 23, 42, 0.95)',
      padding: '16px',
      gap: '12px',
      userSelect: 'none'
    }}>
      {/* Screen */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        minHeight: '85px'
      }}>
        <div style={{ fontSize: '13px', color: '#94a3b8', minHeight: '18px' }}>{equation}</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{display}</div>
      </div>

      {/* Buttons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', flex: 1 }}>
        <button style={{ ...btnStyle, color: '#f87171' }} onClick={handleClear} title="Effacer (Échap / C)">C</button>
        <button style={btnStyle} onClick={handleBackspace} title="Retour arrière (⌫)">⌫</button>
        <button style={btnStyle} onClick={handleToggleSign} title="Inverser le signe (±)">±</button>
        <button style={opStyle} onClick={() => handleOp('÷')} title="Diviser (/)">÷</button>

        <button style={btnStyle} onClick={() => handleNum('7')}>7</button>
        <button style={btnStyle} onClick={() => handleNum('8')}>8</button>
        <button style={btnStyle} onClick={() => handleNum('9')}>9</button>
        <button style={opStyle} onClick={() => handleOp('×')} title="Multiplier (*)">×</button>

        <button style={btnStyle} onClick={() => handleNum('4')}>4</button>
        <button style={btnStyle} onClick={() => handleNum('5')}>5</button>
        <button style={btnStyle} onClick={() => handleNum('6')}>6</button>
        <button style={opStyle} onClick={() => handleOp('-')} title="Soustraire (-)">-</button>

        <button style={btnStyle} onClick={() => handleNum('1')}>1</button>
        <button style={btnStyle} onClick={() => handleNum('2')}>2</button>
        <button style={btnStyle} onClick={() => handleNum('3')}>3</button>
        <button style={opStyle} onClick={() => handleOp('+')} title="Additionner (+)">+</button>

        <button style={{ ...btnStyle, gridColumn: 'span 2' }} onClick={() => handleNum('0')}>0</button>
        <button style={btnStyle} onClick={handleDecimal} title="Virgule décimale (.)">.</button>
        <button style={{ ...opStyle, background: '#10b981' }} onClick={handleEqual} title="Calculer (Entrée / =)">=</button>
      </div>
    </div>
  );
};
