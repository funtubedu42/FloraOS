import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../../context/OSContext';
import { getAssetPath } from '../../../utils/paths';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  Music,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Flame,
  Snowflake
} from 'lucide-react';

const GRID_SIZE = 20;
const TILES_X = 20;
const TILES_Y = 20;
const CANVAS_WIDTH = TILES_X * GRID_SIZE; // 400px
const CANVAS_HEIGHT = TILES_Y * GRID_SIZE; // 400px

// Web Audio synthesizer for arcade 8-bit sound effects
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

  const [food, setFood] = useState({ x: 15, y: 10 });
  const [goldenFood, setGoldenFood] = useState(null); // { x, y, timer }
  const [powerUp, setPowerUp] = useState(null); // { type: 'freeze' | 'frenzy', x, y, timer }
  const [activeEffect, setActiveEffect] = useState(null); // { type: 'freeze' | 'frenzy', timer }
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const lastEatTime = useRef(0);

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
  const [wallMode, setWallMode] = useState('deadly'); // deadly (Murs fermés) or pass (Traversée infinie)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [screenShake, setScreenShake] = useState(false);

  // Background Music Ref
  const musicRef = useRef(null);

  // Direction Queue to prevent accidental self-collisions on fast input
  const lastExecutedDir = useRef({ x: 1, y: 0 });
  const inputQueue = useRef([]);

  // Particles for explosions
  const particles = useRef([]);
  // Score popups
  const popups = useRef([]);

  const speeds = {
    easy: 120,
    normal: 85,
    hard: 60
  };

  // Initialize background music
  useEffect(() => {
    try {
      const audio = new Audio(getAssetPath('/sounds/snake_game_sound.mp3'));
      audio.loop = true;
      audio.volume = 0.22; // Low, gentle background volume as requested
      musicRef.current = audio;
    } catch (e) {
      console.debug('Failed to init snake music', e);
    }

    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, []);

  // Sync music state with game loop & user music toggle
  useEffect(() => {
    if (!musicRef.current) return;
    if (gameState === 'playing' && musicEnabled) {
      musicRef.current.play().catch(() => {});
    } else {
      musicRef.current.pause();
    }
  }, [gameState, musicEnabled]);

  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 220);
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

  const spawnParticles = (x, y, color = '#38bdf8', count = 12) => {
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
        size: Math.random() * 3.5 + 2
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
      vy: -1.6
    });
  };

  const startGame = () => {
    playClickSound();
    if (soundEnabled) {
      playArcadeTone(523, 0.08, 'triangle');
      setTimeout(() => playArcadeTone(659, 0.08, 'triangle'), 80);
      setTimeout(() => playArcadeTone(784, 0.12, 'triangle'), 160);
    }

    if (musicRef.current) {
      musicRef.current.currentTime = 0;
      if (musicEnabled) {
        musicRef.current.play().catch(() => {});
      }
    }

    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    setSnake(initialSnake);
    lastExecutedDir.current = { x: 1, y: 0 };
    inputQueue.current = [];
    particles.current = [];
    popups.current = [];

    setFood(getRandomCoord(initialSnake));
    setGoldenFood(null);
    setPowerUp(null);
    setActiveEffect(null);
    setComboMultiplier(1);
    lastEatTime.current = 0;
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
        const lastInQueue = inputQueue.current.length > 0
          ? inputQueue.current[inputQueue.current.length - 1]
          : lastExecutedDir.current;

        // Prevent 180-degree immediate reversal into oneself
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

    let currentInterval = speeds[difficulty];
    if (activeEffect?.type === 'freeze') {
      currentInterval = Math.round(currentInterval * 1.45); // Slower
    }

    const gameInterval = setInterval(() => {
      setSnake(prevSnake => {
        let nextDir = lastExecutedDir.current;
        if (inputQueue.current.length > 0) {
          const candidate = inputQueue.current.shift();
          if (candidate.x !== -lastExecutedDir.current.x || candidate.y !== -lastExecutedDir.current.y) {
            nextDir = candidate;
          }
        }
        lastExecutedDir.current = nextDir;

        const head = prevSnake[0];
        let nextX = head.x + nextDir.x;
        let nextY = head.y + nextDir.y;

        // Check Wall Boundaries
        if (wallMode === 'deadly') {
          if (nextX < 0 || nextX >= TILES_X || nextY < 0 || nextY >= TILES_Y) {
            const hitX = Math.max(0, Math.min(nextX, TILES_X - 1));
            const hitY = Math.max(0, Math.min(nextY, TILES_Y - 1));
            spawnParticles(hitX, hitY, '#ef4444', 22);
            spawnPopup(hitX, hitY, 'MUR HEURTÉ !', '#f87171');
            triggerShake();
            handleGameOver();
            return prevSnake;
          }
        } else {
          // 'pass' mode: seamless wrap-around
          if (nextX < 0) nextX = TILES_X - 1;
          else if (nextX >= TILES_X) nextX = 0;
          if (nextY < 0) nextY = TILES_Y - 1;
          else if (nextY >= TILES_Y) nextY = 0;
        }

        const newHead = { x: nextX, y: nextY };

        // Collision with self
        if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          spawnParticles(newHead.x, newHead.y, '#f87171', 22);
          spawnPopup(newHead.x, newHead.y, 'OUCH !', '#ef4444');
          triggerShake();
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Combo timer calculation (within 3.8s)
        const now = Date.now();
        let currentMultiplier = 1;
        if (now - lastEatTime.current < 3800 && lastEatTime.current > 0) {
          currentMultiplier = Math.min(4, comboMultiplier + 1);
        } else {
          currentMultiplier = 1;
        }
        setComboMultiplier(currentMultiplier);

        const frenzyBoost = activeEffect?.type === 'frenzy' ? 2 : 1;

        // 1. Eat Red Apple
        if (newHead.x === food.x && newHead.y === food.y) {
          lastEatTime.current = now;
          if (soundEnabled) playArcadeTone(880, 0.08, 'sine');
          spawnParticles(food.x, food.y, '#ef4444', 12);

          const gainedPoints = 10 * currentMultiplier * frenzyBoost;
          const comboText = currentMultiplier > 1 ? `+${gainedPoints} (Combo x${currentMultiplier})` : `+${gainedPoints}`;
          spawnPopup(food.x, food.y, comboText, currentMultiplier > 1 ? '#fbbf24' : '#ef4444');

          setScore(s => {
            const nextScore = s + gainedPoints;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('floraos_snake_highscore', String(nextScore));
            }
            return nextScore;
          });
          setFood(getRandomCoord(newSnake));

          // 25% chance of spawning Golden Apple
          if (!goldenFood && Math.random() < 0.28) {
            setGoldenFood({ ...getRandomCoord(newSnake), timer: 65 });
          }

          // 20% chance of spawning a Power-Up (Frenzy or Freeze)
          if (!powerUp && Math.random() < 0.22) {
            const type = Math.random() < 0.5 ? 'freeze' : 'frenzy';
            setPowerUp({ type, ...getRandomCoord(newSnake), timer: 60 });
          }
        } else if (goldenFood && newHead.x === goldenFood.x && newHead.y === goldenFood.y) {
          // 2. Eat Golden Apple
          lastEatTime.current = now;
          if (soundEnabled) {
            playArcadeTone(987, 0.08, 'triangle');
            setTimeout(() => playArcadeTone(1318, 0.14, 'triangle'), 75);
          }
          triggerShake();
          spawnParticles(goldenFood.x, goldenFood.y, '#f59e0b', 22);

          const gainedPoints = 35 * currentMultiplier * frenzyBoost;
          spawnPopup(goldenFood.x, goldenFood.y, `+${gainedPoints} OR BONUS !`, '#fbbf24');

          setScore(s => {
            const nextScore = s + gainedPoints;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('floraos_snake_highscore', String(nextScore));
            }
            return nextScore;
          });
          setGoldenFood(null);
        } else if (powerUp && newHead.x === powerUp.x && newHead.y === powerUp.y) {
          // 3. Eat Power-Up (Freeze or Frenzy)
          if (soundEnabled) {
            playArcadeTone(1200, 0.1, 'sine');
            setTimeout(() => playArcadeTone(1600, 0.15, 'sine'), 80);
          }
          triggerShake();

          if (powerUp.type === 'freeze') {
            spawnParticles(powerUp.x, powerUp.y, '#38bdf8', 20);
            spawnPopup(powerUp.x, powerUp.y, 'RALENTISSEUR !', '#38bdf8');
            setActiveEffect({ type: 'freeze', timer: 50 });
          } else {
            spawnParticles(powerUp.x, powerUp.y, '#f97316', 22);
            spawnPopup(powerUp.x, powerUp.y, 'FRENZY x2 !', '#fbbf24');
            setActiveEffect({ type: 'frenzy', timer: 65 });
          }
          setPowerUp(null);
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

      // Countdown power-up arena timer
      setPowerUp(prev => {
        if (!prev) return null;
        if (prev.timer <= 1) return null;
        return { ...prev, timer: prev.timer - 1 };
      });

      // Countdown active player effect
      setActiveEffect(prev => {
        if (!prev) return null;
        if (prev.timer <= 1) return null;
        return { ...prev, timer: prev.timer - 1 };
      });
    }, currentInterval);

    return () => clearInterval(gameInterval);
  }, [gameState, food, goldenFood, powerUp, activeEffect, difficulty, wallMode, comboMultiplier, highScore, soundEnabled]);

  const handleGameOver = () => {
    if (soundEnabled) {
      playArcadeTone(220, 0.15, 'sawtooth');
      setTimeout(() => playArcadeTone(130, 0.3, 'sawtooth'), 120);
    }
    setGameState('gameover');
  };

  // Canvas Animation Frame (Renders Arena, Snake, Food, Particles, Popups)
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

      // Arena Neon Boundary Border
      if (wallMode === 'deadly') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, CANVAS_WIDTH - 2, CANVAS_HEIGHT - 2);
      } else {
        // Portal dashed border indicating wrap-around
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.65)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(1, 1, CANVAS_WIDTH - 2, CANVAS_HEIGHT - 2);
        ctx.setLineDash([]);
      }

      // 1. Draw Golden Apple
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
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
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

      // 2. Draw Power-Up item (Freeze or Frenzy)
      if (powerUp) {
        const pulse = Math.sin(Date.now() / 120) * 2;
        const isFreeze = powerUp.type === 'freeze';
        const color = isFreeze ? '#38bdf8' : '#f97316';
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(
          powerUp.x * GRID_SIZE + GRID_SIZE / 2,
          powerUp.y * GRID_SIZE + GRID_SIZE / 2,
          GRID_SIZE / 2 - 2.5 + pulse,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        // Powerup icon letter in center
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          isFreeze ? '❄' : '⚡',
          powerUp.x * GRID_SIZE + GRID_SIZE / 2,
          powerUp.y * GRID_SIZE + GRID_SIZE / 2
        );
      }

      // 3. Draw Red Apple
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

      // 4. Draw Snake
      const isFrenzy = activeEffect?.type === 'frenzy';
      const isFrozen = activeEffect?.type === 'freeze';

      snake.forEach((seg, idx) => {
        const isHead = idx === 0;

        if (isHead) {
          if (isFrenzy) {
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 18;
          } else if (isFrozen) {
            ctx.fillStyle = '#7dd3fc';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 14;
          } else {
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 14;
          }
        } else {
          ctx.shadowBlur = 0;
          const factor = Math.max(0.35, 1 - (idx / snake.length) * 0.65);
          if (isFrenzy) {
            ctx.fillStyle = `rgba(251, 191, 36, ${factor})`;
          } else if (isFrozen) {
            ctx.fillStyle = `rgba(125, 211, 252, ${factor})`;
          } else {
            ctx.fillStyle = `rgba(56, 189, 248, ${factor})`;
          }
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

        // Eyes & Tongue on head
        if (isHead) {
          ctx.fillStyle = '#0f172a';
          ctx.shadowBlur = 0;

          const dir = lastExecutedDir.current;
          let eye1X = seg.x * GRID_SIZE + 6;
          let eye1Y = seg.y * GRID_SIZE + 6;
          let eye2X = seg.x * GRID_SIZE + 14;
          let eye2Y = seg.y * GRID_SIZE + 14;

          if (dir.x === 1) { // Right
            eye1X = seg.x * GRID_SIZE + 14; eye1Y = seg.y * GRID_SIZE + 5;
            eye2X = seg.x * GRID_SIZE + 14; eye2Y = seg.y * GRID_SIZE + 15;
          } else if (dir.x === -1) { // Left
            eye1X = seg.x * GRID_SIZE + 6; eye1Y = seg.y * GRID_SIZE + 5;
            eye2X = seg.x * GRID_SIZE + 6; eye2Y = seg.y * GRID_SIZE + 15;
          } else if (dir.y === -1) { // Up
            eye1X = seg.x * GRID_SIZE + 5; eye1Y = seg.y * GRID_SIZE + 6;
            eye2X = seg.x * GRID_SIZE + 15; eye2Y = seg.y * GRID_SIZE + 6;
          } else if (dir.y === 1) { // Down
            eye1X = seg.x * GRID_SIZE + 5; eye1Y = seg.y * GRID_SIZE + 14;
            eye2X = seg.x * GRID_SIZE + 15; eye2Y = seg.y * GRID_SIZE + 14;
          }

          ctx.beginPath();
          ctx.arc(eye1X, eye1Y, 1.8, 0, Math.PI * 2);
          ctx.arc(eye2X, eye2Y, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Animated Tongue sticking out every ~1.5s
          const timeMod = Date.now() % 1600;
          if (timeMod > 1300) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            const tongueBaseX = seg.x * GRID_SIZE + 10 + dir.x * 9;
            const tongueBaseY = seg.y * GRID_SIZE + 10 + dir.y * 9;
            const tongueTipX = tongueBaseX + dir.x * 6;
            const tongueTipY = tongueBaseY + dir.y * 6;
            ctx.moveTo(tongueBaseX, tongueBaseY);
            ctx.lineTo(tongueTipX, tongueTipY);
            ctx.stroke();
          }
        }
      });
      ctx.shadowBlur = 0;

      // 5. Draw & Update Particles
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

      // 6. Draw & Update Score Popups
      for (let i = popups.current.length - 1; i >= 0; i--) {
        const pop = popups.current[i];
        pop.y += pop.vy;
        pop.alpha -= 0.024;
        if (pop.alpha <= 0) {
          popups.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = pop.alpha;
          ctx.fillStyle = pop.color;
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pop.text, pop.x, pop.y);
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [snake, food, goldenFood, powerUp, activeEffect, wallMode]);

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
      padding: '10px 14px',
      overflow: 'hidden'
    }}>
      {/* Top Arcade Status Bar */}
      <div style={{
        width: '100%',
        maxWidth: `${CANVAS_WIDTH}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '6px 14px',
        gap: '8px'
      }}>
        {/* Score & Combo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score</span>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#38bdf8' }}>{score}</span>
          {comboMultiplier > 1 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.2)',
              padding: '2px 6px',
              borderRadius: '6px',
              border: '1px solid rgba(251, 191, 36, 0.35)'
            }}>
              x{comboMultiplier}
            </span>
          )}
        </div>

        {/* Highscore */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Trophy size={14} color="#f59e0b" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>Record : {highScore}</span>
        </div>

        {/* Sound & Music Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Background Music Toggle */}
          <button
            onClick={() => setMusicEnabled(prev => !prev)}
            title={musicEnabled ? "Musique active (Volume modéré)" : "Musique muette"}
            style={{
              background: musicEnabled ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: musicEnabled ? '#38bdf8' : '#64748b',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <Music size={15} />
          </button>

          {/* SFX Toggle */}
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title={soundEnabled ? "Effets sonores actifs" : "Effets sonores muets"}
            style={{
              background: soundEnabled ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: soundEnabled ? '#38bdf8' : '#64748b',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Main Canvas Arena */}
      <div style={{
        position: 'relative',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75)',
        border: wallMode === 'deadly' ? '2px solid rgba(56, 189, 248, 0.45)' : '2px dashed rgba(168, 85, 247, 0.55)',
        transform: screenShake ? 'translate(3px, -2px)' : 'none',
        transition: screenShake ? 'none' : 'transform 0.12s ease'
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
            background: 'rgba(8, 13, 26, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            {gameState === 'idle' && (
              <>
                <div style={{ fontSize: '36px' }}>🐍</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
                  FloraSnake Arcade
                </h3>
                <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0, maxWidth: '300px', lineHeight: 1.45 }}>
                  Dirigez avec les <strong>Flèches</strong> ou <strong>ZQSD</strong>. Mangez les pommes dorées et bonus d'arcade !
                </p>

                {/* Difficulty */}
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[
                    { id: 'easy', label: 'Détente' },
                    { id: 'normal', label: 'Classique' },
                    { id: 'hard', label: 'Turbo' }
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
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

                {/* Wall Mode Toggle: Deadly vs Pass */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setWallMode('deadly')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: wallMode === 'deadly' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: wallMode === 'deadly' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: wallMode === 'deadly' ? '#fca5a5' : '#94a3b8',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Murs mortels
                  </button>
                  <button
                    onClick={() => setWallMode('pass')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: wallMode === 'pass' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: wallMode === 'pass' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: wallMode === 'pass' ? '#d8b4fe' : '#94a3b8',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Bordures infinies (Traversée)
                  </button>
                </div>

                <button
                  onClick={startGame}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-color, #10b981)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Play size={15} /> Lancer la partie (Entrée)
                </button>
              </>
            )}

            {gameState === 'paused' && (
              <>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Partie en Pause
                </h3>
                <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0 }}>
                  Appuyez sur Espace pour reprendre
                </p>
                <button
                  onClick={togglePause}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#38bdf8',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Play size={15} /> Reprendre
                </button>
              </>
            )}

            {gameState === 'gameover' && (
              <>
                <div style={{ fontSize: '34px' }}>💥</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f87171', margin: 0 }}>
                  Partie terminée !
                </h3>
                <div style={{ fontSize: '12.5px', color: '#cbd5e1' }}>
                  Score final : <strong style={{ color: '#38bdf8' }}>{score} points</strong>
                </div>
                {score >= highScore && score > 0 && (
                  <div style={{
                    fontSize: '11px',
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
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <RotateCcw size={15} /> Rejouer (Entrée / Espace)
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Virtual D-Pad */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3px'
      }}>
        <button
          onClick={() => handleManualDirection(0, -1)}
          style={{
            width: '40px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ChevronUp size={18} />
        </button>
        <div style={{ display: 'flex', gap: '32px' }}>
          <button
            onClick={() => handleManualDirection(-1, 0)}
            style={{
              width: '40px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => handleManualDirection(1, 0)}
            style={{
              width: '40px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={() => handleManualDirection(0, 1)}
          style={{
            width: '40px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  );
};
