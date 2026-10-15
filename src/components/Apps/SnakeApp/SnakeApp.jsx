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
  ChevronRight,
  Sparkles
} from 'lucide-react';

const GRID_SIZE = 20;
const TILES_X = 22;
const TILES_Y = 22;
const CANVAS_WIDTH = TILES_X * GRID_SIZE; // 440px
const CANVAS_HEIGHT = TILES_Y * GRID_SIZE; // 440px

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

    gain.gain.setValueAtTime(0.14, ctx.currentTime);
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
    { x: 11, y: 11 },
    { x: 10, y: 11 },
    { x: 9, y: 11 }
  ]);

  const [food, setFood] = useState({ x: 16, y: 11 });
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
  const [difficulty, setDifficulty] = useState('normal'); // easy, normal, hard
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Direction Queue to prevent accidental self-collisions on fast input
  const lastExecutedDir = useRef({ x: 1, y: 0 });
  const inputQueue = useRef([]);

  // Particles for eat explosions
  const particles = useRef([]);
  // Score popups
  const popups = useRef([]);

  const speeds = {
    easy: 125,
    normal: 90,
    hard: 60
  };

  const getRandomCoord = (currentSnake = []) => {
    let newCoord;
    while (!newCoord || currentSnake.some(seg => seg.x === newCoord.x && seg.y === newCoord.y)) {
      newCoord = {
        x: Math.floor(Math.random() * TILES_X),
        y: Math.floor(Math.random() * TILES_Y)
      };
    }
    return newCoord;
  };

  const spawnParticles = (x, y, color = '#38bdf8', count = 10) => {
    const px = x * GRID_SIZE + GRID_SIZE / 2;
    const py = y * GRID_SIZE + GRID_SIZE / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1.5;
      particles.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: Math.random() * 3 + 2
      });
    }
  };

  const spawnPopup = (x, y, text, color = '#38bdf8') => {
    popups.current.push({
      x: x * GRID_SIZE + GRID_SIZE / 2,
      y: y * GRID_SIZE,
      text,
      color,
      alpha: 1,
      vy: -1.5
    });
  };

  const startGame = () => {
    playClickSound();
    if (soundEnabled) {
      playArcadeTone(523, 0.08, 'triangle');
      setTimeout(() => playArcadeTone(659, 0.08, 'triangle'), 80);
      setTimeout(() => playArcadeTone(784, 0.12, 'triangle'), 160);
    }

    const initialSnake = [
      { x: 11, y: 11 },
      { x: 10, y: 11 },
      { x: 9, y: 11 }
    ];
    setSnake(initialSnake);
    lastExecutedDir.current = { x: 1, y: 0 };
    inputQueue.current = [];
    particles.current = [];
    popups.current = [];

    setFood(getRandomCoord(initialSnake));
    setGoldenFood(null);
    setScore(0);
    setGameState('playing');
  };

  const togglePause = () => {
    playClickSound();
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  // Keyboard navigation & queue
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key;

      if (gameState === 'idle' || gameState === 'gameover') {
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          startGame();
          return;
        }
      }

      if (gameState === 'paused') {
        if (key === 'Enter' || key === ' ' || key.toLowerCase() === 'p') {
          e.preventDefault();
          togglePause();
          return;
        }
      }

      if (gameState !== 'playing') return;

      if (key === ' ' || key.toLowerCase() === 'p') {
        e.preventDefault();
        togglePause();
        return;
      }

      let newDir = null;
      if (key === 'ArrowUp' || key.toLowerCase() === 'w' || key.toLowerCase() === 'z') {
        newDir = { x: 0, y: -1 };
      } else if (key === 'ArrowDown' || key.toLowerCase() === 's') {
        newDir = { x: 0, y: 1 };
      } else if (key === 'ArrowLeft' || key.toLowerCase() === 'a' || key.toLowerCase() === 'q') {
        newDir = { x: -1, y: 0 };
      } else if (key === 'ArrowRight' || key.toLowerCase() === 'd') {
        newDir = { x: 1, y: 0 };
      }

      if (newDir) {
        e.preventDefault();
        // Check relative to current queue end or lastExecuted
        const lastInQueue = inputQueue.current.length > 0
          ? inputQueue.current[inputQueue.current.length - 1]
          : lastExecutedDir.current;

        // Prevent opposite direction 180-degree turn
        if (newDir.x !== -lastInQueue.x || newDir.y !== -lastInQueue.y) {
          if (inputQueue.current.length < 2) {
            inputQueue.current.push(newDir);
          }
        }
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
        // Resolve direction from queue
        let nextDir = lastExecutedDir.current;
        if (inputQueue.current.length > 0) {
          const candidate = inputQueue.current.shift();
          if (candidate.x !== -lastExecutedDir.current.x || candidate.y !== -lastExecutedDir.current.y) {
            nextDir = candidate;
          }
        }
        lastExecutedDir.current = nextDir;

        const head = prevSnake[0];
        const newHead = {
          x: head.x + nextDir.x,
          y: head.y + nextDir.y
        };

        // Collision with walls
        if (newHead.x < 0 || newHead.x >= TILES_X || newHead.y < 0 || newHead.y >= TILES_Y) {
          handleGameOver();
          return prevSnake;
        }

        // Collision with self
        if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Eat Red Apple
        if (newHead.x === food.x && newHead.y === food.y) {
          if (soundEnabled) playArcadeTone(880, 0.08, 'sine');
          spawnParticles(food.x, food.y, '#ef4444', 12);
          spawnPopup(food.x, food.y, '+10', '#ef4444');

          setScore(s => {
            const nextScore = s + 10;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('floraos_snake_highscore', String(nextScore));
            }
            return nextScore;
          });
          setFood(getRandomCoord(newSnake));

          // 25% chance of spawning Golden Apple
          if (!goldenFood && Math.random() < 0.3) {
            setGoldenFood({ ...getRandomCoord(newSnake), timer: 65 });
          }
        } else if (goldenFood && newHead.x === goldenFood.x && newHead.y === goldenFood.y) {
          // Eat Golden Apple
          if (soundEnabled) {
            playArcadeTone(987, 0.08, 'triangle');
            setTimeout(() => playArcadeTone(1318, 0.14, 'triangle'), 75);
          }
          spawnParticles(goldenFood.x, goldenFood.y, '#f59e0b', 20);
          spawnPopup(goldenFood.x, goldenFood.y, '+35 BONUS !', '#fbbf24');

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
      setTimeout(() => playArcadeTone(130, 0.3, 'sawtooth'), 120);
    }
    setGameState('gameover');
  };

  // Canvas Animation Frame (Renders Snake, Food, Grid, Particles, Popups)
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      // Background gradient
      ctx.fillStyle = '#080d1a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
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

      // Draw Golden Apple
      if (goldenFood) {
        const pulse = Math.sin(Date.now() / 150) * 2;
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(
          goldenFood.x * GRID_SIZE + GRID_SIZE / 2,
          goldenFood.y * GRID_SIZE + GRID_SIZE / 2,
          GRID_SIZE / 2 - 2 + pulse,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        // Golden food timer ring
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (goldenFood.timer / 65) * Math.PI * 2;
        ctx.arc(
          goldenFood.x * GRID_SIZE + GRID_SIZE / 2,
          goldenFood.y * GRID_SIZE + GRID_SIZE / 2,
          GRID_SIZE / 2 + 3,
          startAngle,
          endAngle
        );
        ctx.stroke();
      }

      // Draw Red Apple
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // Stem
      ctx.fillStyle = '#10b981';
      ctx.fillRect(food.x * GRID_SIZE + GRID_SIZE / 2 - 1, food.y * GRID_SIZE + 2, 2, 4);

      // Draw Snake
      snake.forEach((seg, idx) => {
        const isHead = idx === 0;
        if (isHead) {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;
        } else {
          const factor = Math.max(0.35, 1 - (idx / snake.length) * 0.65);
          ctx.fillStyle = `rgba(56, 189, 248, ${factor})`;
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.roundRect(
          seg.x * GRID_SIZE + 1.5,
          seg.y * GRID_SIZE + 1.5,
          GRID_SIZE - 3,
          GRID_SIZE - 3,
          isHead ? 7 : 5
        );
        ctx.fill();

        // Eyes
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

      // Draw & Update Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        if (p.alpha <= 0) {
          particles.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw & Update Score Popups
      for (let i = popups.current.length - 1; i >= 0; i--) {
        const pop = popups.current[i];
        pop.y += pop.vy;
        pop.alpha -= 0.025;
        if (pop.alpha <= 0) {
          popups.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = pop.alpha;
          ctx.fillStyle = pop.color;
          ctx.font = 'bold 13px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pop.text, pop.x, pop.y);
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [snake, food, goldenFood]);

  const handleManualDirection = (x, y) => {
    if (gameState !== 'playing') return;
    const lastInQueue = inputQueue.current.length > 0
      ? inputQueue.current[inputQueue.current.length - 1]
      : lastExecutedDir.current;

    if (x !== -lastInQueue.x || y !== -lastInQueue.y) {
      if (inputQueue.current.length < 2) {
        inputQueue.current.push({ x, y });
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
      background: '#070b14',
      color: '#f8fafc',
      userSelect: 'none',
      padding: '12px 16px',
      overflow: 'auto'
    }}>
      {/* Top Arcade Status Bar */}
      <div style={{
        width: '100%',
        maxWidth: `${CANVAS_WIDTH}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '8px 16px'
      }}>
        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', minWidth: '36px' }}>{score}</span>
        </div>

        {/* Highscore */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Trophy size={15} color="#f59e0b" />
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fbbf24' }}>Record : {highScore}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title="Effets sonores 8-bit"
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

      {/* Main Canvas Arena */}
      <div style={{
        position: 'relative',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 16px 45px rgba(0, 0, 0, 0.7)',
        border: '2px solid rgba(56, 189, 248, 0.4)'
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ display: 'block' }}
        />

        {/* Start / Pause / Game Over Glass Overlay */}
        {gameState !== 'playing' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(8, 13, 26, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            padding: '24px',
            textAlign: 'center'
          }}>
            {gameState === 'idle' && (
              <>
                <div style={{ fontSize: '38px', animation: 'bounce 1s infinite' }}>🐍</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
                  FloraSnake Arcade
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, maxWidth: '280px', lineHeight: 1.5 }}>
                  Utilisez les touches <strong>Flèches</strong> ou <strong>ZQSD/WASD</strong>. Mangez les pommes dorées bonus !
                </p>

                {/* Difficulty */}
                <div style={{ display: 'flex', gap: '6px', margin: '4px 0' }}>
                  {[
                    { id: 'easy', label: 'Détente' },
                    { id: 'normal', label: 'Classique' },
                    { id: 'hard', label: 'Arcade Turbo' }
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      style={{
                        padding: '6px 14px',
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
                    padding: '11px 26px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--accent-color, #10b981)',
                    color: '#fff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Play size={16} /> Lancer la partie (Entrée)
                </button>
              </>
            )}

            {gameState === 'paused' && (
              <>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Partie en Pause
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Appuyez sur Espace pour reprendre
                </p>
                <button
                  onClick={togglePause}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
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
                <div style={{ fontSize: '36px' }}>💥</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f87171', margin: 0 }}>
                  Partie terminée !
                </h3>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  Score réalisé : <strong style={{ color: '#38bdf8' }}>{score} points</strong>
                </div>
                {score >= highScore && score > 0 && (
                  <div style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#fbbf24',
                    background: 'rgba(245, 158, 11, 0.15)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    ✨ Nouveau Record Personnel !
                  </div>
                )}
                <button
                  onClick={startGame}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 26px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <RotateCcw size={16} /> Rejouer (Entrée / Espace)
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Virtual D-Pad for easy touch / mouse controls */}
      <div style={{
        marginTop: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px'
      }}>
        <button
          onClick={() => handleManualDirection(0, -1)}
          style={{
            width: '42px',
            height: '34px',
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
              height: '34px',
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
              height: '34px',
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
            height: '34px',
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
