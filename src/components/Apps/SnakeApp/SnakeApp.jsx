import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../../context/OSContext';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const GRID_SIZE = 20;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

// Web Audio synthesizer for arcade 8-bit sounds
const playArcadeTone = (freq, duration = 0.08, type = 'square') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
};

export const SnakeApp = ({ windowData }) => {
  const { playClickSound } = useOS();
  const canvasRef = useRef(null);

  const [snake, setSnake] = useState([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ]);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const nextDirection = useRef({ x: 1, y: 0 });

  const [food, setFood] = useState({ x: 15, y: 10 });
  const [goldenFood, setGoldenFood] = useState(null); // { x, y, timer }
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('floraos_snake_highscore') || 0);
    } catch {
      return 0;
    }
  });

  const [gameState, setGameState] = useState('idle'); // idle, playing, paused, gameover
  const [difficulty, setDifficulty] = useState('normal'); // easy (140ms), normal (100ms), hard (70ms)
  const [soundEnabled, setSoundEnabled] = useState(true);

  const speeds = {
    easy: 130,
    normal: 95,
    hard: 65
  };

  const getRandomCoord = (currentSnake = []) => {
    let newCoord;
    while (!newCoord || currentSnake.some(seg => seg.x === newCoord.x && seg.y === newCoord.y)) {
      newCoord = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE))
      };
    }
    return newCoord;
  };

  const startGame = () => {
    playClickSound();
    if (soundEnabled) playArcadeTone(440, 0.1, 'sine');
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    setSnake(initialSnake);
    setDirection({ x: 1, y: 0 });
    nextDirection.current = { x: 1, y: 0 };
    setFood(getRandomCoord(initialSnake));
    setGoldenFood(null);
    setScore(0);
    setGameState('playing');
  };

  const togglePause = () => {
    playClickSound();
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;

      const key = e.key;
      const current = nextDirection.current;

      if ((key === 'ArrowUp' || key.toLowerCase() === 'w' || key.toLowerCase() === 'z') && current.y === 0) {
        nextDirection.current = { x: 0, y: -1 };
        e.preventDefault();
      } else if ((key === 'ArrowDown' || key.toLowerCase() === 's') && current.y === 0) {
        nextDirection.current = { x: 0, y: 1 };
        e.preventDefault();
      } else if ((key === 'ArrowLeft' || key.toLowerCase() === 'a' || key.toLowerCase() === 'q') && current.x === 0) {
        nextDirection.current = { x: -1, y: 0 };
        e.preventDefault();
      } else if ((key === 'ArrowRight' || key.toLowerCase() === 'd') && current.x === 0) {
        nextDirection.current = { x: 1, y: 0 };
        e.preventDefault();
      } else if (key === ' ' || key === 'p') {
        togglePause();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameInterval = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const dir = nextDirection.current;
        setDirection(dir);

        const newHead = {
          x: head.x + dir.x,
          y: head.y + dir.y
        };

        const maxTilesX = CANVAS_WIDTH / GRID_SIZE;
        const maxTilesY = CANVAS_HEIGHT / GRID_SIZE;

        // Collision with walls
        if (newHead.x < 0 || newHead.x >= maxTilesX || newHead.y < 0 || newHead.y >= maxTilesY) {
          handleGameOver();
          return prevSnake;
        }

        // Collision with self
        if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Eat standard food
        if (newHead.x === food.x && newHead.y === food.y) {
          if (soundEnabled) playArcadeTone(784, 0.08, 'sine');
          setScore(s => {
            const nextScore = s + 10;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('floraos_snake_highscore', String(nextScore));
            }
            return nextScore;
          });
          setFood(getRandomCoord(newSnake));

          // Chance of golden apple (15%)
          if (!goldenFood && Math.random() < 0.25) {
            setGoldenFood({ ...getRandomCoord(newSnake), timer: 60 });
          }
        } else if (goldenFood && newHead.x === goldenFood.x && newHead.y === goldenFood.y) {
          // Eat golden food!
          if (soundEnabled) {
            playArcadeTone(880, 0.08, 'triangle');
            setTimeout(() => playArcadeTone(1174, 0.12, 'triangle'), 80);
          }
          setScore(s => {
            const nextScore = s + 35;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('floraos_snake_highscore', String(nextScore));
            }
            return nextScore;
          });
          setGoldenFood(null);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });

      // Countdown golden food timer
      setGoldenFood(prev => {
        if (!prev) return null;
        if (prev.timer <= 1) return null;
        return { ...prev, timer: prev.timer - 1 };
      });
    }, speeds[difficulty]);

    return () => clearInterval(gameInterval);
  }, [gameState, food, goldenFood, difficulty, highScore, soundEnabled]);

  const handleGameOver = () => {
    if (soundEnabled) {
      playArcadeTone(220, 0.15, 'sawtooth');
      setTimeout(() => playArcadeTone(146, 0.25, 'sawtooth'), 120);
    }
    setGameState('gameover');
  };

  // Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw Food (Apple)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Food leaf stem
    ctx.fillStyle = '#10b981';
    ctx.fillRect(food.x * GRID_SIZE + GRID_SIZE / 2 - 1, food.y * GRID_SIZE + 2, 2, 4);

    // Draw Golden Food
    if (goldenFood) {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(
        goldenFood.x * GRID_SIZE + GRID_SIZE / 2,
        goldenFood.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw Snake
    snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      if (isHead) {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
      } else {
        const factor = Math.max(0.4, 1 - (idx / snake.length) * 0.6);
        ctx.fillStyle = `rgba(56, 189, 248, ${factor})`;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(
        seg.x * GRID_SIZE + 1.5,
        seg.y * GRID_SIZE + 1.5,
        GRID_SIZE - 3,
        GRID_SIZE - 3,
        isHead ? 6 : 4
      );
      ctx.fill();

      // Eyes on head
      if (isHead) {
        ctx.fillStyle = '#0f172a';
        ctx.shadowBlur = 0;
        const eyeOffset = 5;
        ctx.beginPath();
        ctx.arc(seg.x * GRID_SIZE + eyeOffset, seg.y * GRID_SIZE + eyeOffset, 1.8, 0, Math.PI * 2);
        ctx.arc(seg.x * GRID_SIZE + GRID_SIZE - eyeOffset, seg.y * GRID_SIZE + eyeOffset, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.shadowBlur = 0;
  }, [snake, food, goldenFood]);

  const handleManualDirection = (x, y) => {
    if (gameState !== 'playing') return;
    const current = nextDirection.current;
    if (x !== 0 && current.x === 0) {
      nextDirection.current = { x, y: 0 };
    } else if (y !== 0 && current.y === 0) {
      nextDirection.current = { x: 0, y };
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      background: '#090d16',
      color: '#f8fafc',
      userSelect: 'none',
      padding: '12px'
    }}>
      {/* Top Status Header */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '8px 14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Score</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>{score}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Trophy size={14} color="#f59e0b" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>{highScore}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title="Effets sonores"
            style={{
              background: 'transparent',
              border: 'none',
              color: soundEnabled ? '#38bdf8' : '#64748b',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Canvas Area with overlays */}
      <div style={{
        position: 'relative',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
        border: '2px solid rgba(56, 189, 248, 0.3)'
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ display: 'block' }}
        />

        {/* Start / Game Over / Pause Overlays */}
        {gameState !== 'playing' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10, 15, 29, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            padding: '20px',
            textAlign: 'center'
          }}>
            {gameState === 'idle' && (
              <>
                <div style={{ fontSize: '32px' }}>🐍</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
                  FloraSnake Arcade
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Mangez des pommes, collectez les bonus dorés et évitez les murs !
                </p>

                {/* Difficulty selector */}
                <div style={{ display: 'flex', gap: '6px', margin: '6px 0' }}>
                  {[
                    { id: 'easy', label: 'Facile' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'hard', label: 'Turbo' }
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        border: difficulty === d.id ? '1px solid var(--accent-color, #38bdf8)' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: difficulty === d.id ? 'var(--accent-color, #38bdf8)' : 'rgba(255, 255, 255, 0.05)',
                        color: difficulty === d.id ? '#fff' : '#cbd5e1',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={startGame}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--accent-color, #10b981)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Play size={16} /> Jouer maintenant
                </button>
              </>
            )}

            {gameState === 'paused' && (
              <>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Partie en Pause
                </h3>
                <button
                  onClick={togglePause}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#38bdf8',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Play size={16} /> Reprendre
                </button>
              </>
            )}

            {gameState === 'gameover' && (
              <>
                <div style={{ fontSize: '32px' }}>💥</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f87171', margin: 0 }}>
                  Partie terminée !
                </h3>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  Score final : <strong style={{ color: '#38bdf8' }}>{score} points</strong>
                </div>
                <button
                  onClick={startGame}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <RotateCcw size={16} /> Rejouer
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Virtual D-Pad for easy touch / mouse controls */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px'
      }}>
        <button
          onClick={() => handleManualDirection(0, -1)}
          style={{
            width: '42px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ChevronUp size={20} />
        </button>
        <div style={{ display: 'flex', gap: '38px' }}>
          <button
            onClick={() => handleManualDirection(-1, 0)}
            style={{
              width: '42px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleManualDirection(1, 0)}
            style={{
              width: '42px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={() => handleManualDirection(0, 1)}
          style={{
            width: '42px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
};
