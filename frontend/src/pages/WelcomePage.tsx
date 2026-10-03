import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Activity,
  Lock,
  Cpu,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  Play,
  RotateCw,
  Zap,
  BarChart3,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import { NavItemKey } from '../components/Sidebar';

interface WelcomePageProps {
  onEnterApp: (targetTab?: NavItemKey) => void;
}

interface Hospital3DNode {
  id: string;
  name: string;
  specialty: string;
  samples: number;
  trustScore: number;
  weight: number;
  color: string;
  // 3D coordinates
  x: number;
  y: number;
  z: number;
  baseAngle: number;
  orbitRadius: number;
  elevation: number;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnterApp }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Rotation angles for 3D perspective
  const [rotX, setRotX] = useState(0.25);
  const [rotY, setRotY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<Hospital3DNode | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<string>('Ready to simulate');

  // Interactive mouse move for 3D tilt
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;
      setRotY(prev => prev + deltaX * 0.008);
      setRotX(prev => Math.max(-0.8, Math.min(0.8, prev + deltaY * 0.008)));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 3D Canvas rendering engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = 420);
    canvas.height = height;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 420;
    };
    window.addEventListener('resize', handleResize);

    // Initial 5 hospital nodes with medical specialties
    const hospitals: Hospital3DNode[] = [
      { id: 'hospA', name: 'Hospital A', specialty: 'Intensive Care Unit (ICU)', samples: 450, trustScore: 0.94, weight: 0.28, color: '#38BDF8', x: 0, y: 0, z: 0, baseAngle: 0, orbitRadius: 180, elevation: 15 },
      { id: 'hospB', name: 'Hospital B', specialty: 'Cardiac Care & Cardiology', samples: 380, trustScore: 0.89, weight: 0.23, color: '#2DD4BF', x: 0, y: 0, z: 0, baseAngle: (Math.PI * 2 * 1) / 5, orbitRadius: 180, elevation: -20 },
      { id: 'hospC', name: 'Hospital C', specialty: 'Community General Health', samples: 310, trustScore: 0.82, weight: 0.17, color: '#A78BFA', x: 0, y: 0, z: 0, baseAngle: (Math.PI * 2 * 2) / 5, orbitRadius: 180, elevation: 25 },
      { id: 'hospD', name: 'Hospital D', specialty: 'Regional Medical Center', samples: 290, trustScore: 0.76, weight: 0.15, color: '#F59E0B', x: 0, y: 0, z: 0, baseAngle: (Math.PI * 2 * 3) / 5, orbitRadius: 180, elevation: -15 },
      { id: 'hospE', name: 'Hospital E', specialty: 'Emergency & Trauma', samples: 340, trustScore: 0.85, weight: 0.17, color: '#FB7185', x: 0, y: 0, z: 0, baseAngle: (Math.PI * 2 * 4) / 5, orbitRadius: 180, elevation: 10 }
    ];

    // Data transfer packets for 3D Shamir share animation
    const packets: { fromHosp: number; progress: number; speed: number }[] = [];
    for (let i = 0; i < hospitals.length; i++) {
      packets.push({ fromHosp: i, progress: Math.random(), speed: 0.007 + Math.random() * 0.005 });
      packets.push({ fromHosp: i, progress: (Math.random() + 0.5) % 1, speed: 0.007 + Math.random() * 0.005 });
    }

    let time = 0;
    const fov = 400; // 3D Camera Field of View
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Auto slow rotation when not dragging
      const currentRotY = rotY + (isDragging ? 0 : time * 0.2);
      const currentRotX = rotX;

      // 1. Draw 3D Grid / Holographic Rings
      const draw3DRing = (radius: number, ringElevation: number, strokeColor: string, isDashed: boolean = false) => {
        ctx.beginPath();
        if (isDashed) ctx.setLineDash([4, 6]);
        else ctx.setLineDash([]);
        const segments = 64;
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2;
          const rx = Math.cos(theta) * radius;
          const rz = Math.sin(theta) * radius;
          const ry = ringElevation;

          // 3D rotation around Y and X
          const x1 = rx * Math.cos(currentRotY) + rz * Math.sin(currentRotY);
          const z1 = -rx * Math.sin(currentRotY) + rz * Math.cos(currentRotY);
          const y1 = ry * Math.cos(currentRotX) - z1 * Math.sin(currentRotX);
          const z2 = ry * Math.sin(currentRotX) + z1 * Math.cos(currentRotX);

          const scale = fov / (fov + z2 + 300);
          const px = centerX + x1 * scale;
          const py = centerY + y1 * scale;

          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // Draw dual holographic orbital rings
      draw3DRing(180, 0, '#00B4D825', true);
      draw3DRing(120, -10, '#2DD4BF18', true);
      draw3DRing(240, 15, '#38BDF810', true);

      // 2. Project 3D Positions of Hospitals
      interface ProjectedNode {
        hosp: Hospital3DNode;
        screenX: number;
        screenY: number;
        depthZ: number;
        scale: number;
      }

      const projectedNodes: ProjectedNode[] = hospitals.map(h => {
        const theta = h.baseAngle + time * 0.15;
        const rx = Math.cos(theta) * h.orbitRadius;
        const rz = Math.sin(theta) * h.orbitRadius;
        const ry = h.elevation;

        // 3D Rotate Y
        const x1 = rx * Math.cos(currentRotY) + rz * Math.sin(currentRotY);
        const z1 = -rx * Math.sin(currentRotY) + rz * Math.cos(currentRotY);
        // 3D Rotate X
        const y1 = ry * Math.cos(currentRotX) - z1 * Math.sin(currentRotX);
        const z2 = ry * Math.sin(currentRotX) + z1 * Math.cos(currentRotX);

        const scale = fov / (fov + z2 + 300);
        return {
          hosp: h,
          screenX: centerX + x1 * scale,
          screenY: centerY + y1 * scale,
          depthZ: z2,
          scale
        };
      });

      // Central Coordinator position
      const centerScale = fov / (fov + 300);
      const centerScreenX = centerX;
      const centerScreenY = centerY;

      // 3. Draw 3D Connection Beams from Hospitals to Central Coordinator
      projectedNodes.forEach(pn => {
        const grad = ctx.createLinearGradient(pn.screenX, pn.screenY, centerScreenX, centerScreenY);
        grad.addColorStop(0, pn.hosp.color + '60');
        grad.addColorStop(1, '#00B4D830');

        ctx.beginPath();
        ctx.moveTo(pn.screenX, pn.screenY);
        ctx.lineTo(centerScreenX, centerScreenY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(1, 2 * pn.scale);
        ctx.stroke();
      });

      // 4. Draw Animated 3D Data Packets (Shamir Secret Shares)
      packets.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1) p.progress = 0;

        const targetNode = projectedNodes[p.fromHosp];
        if (!targetNode) return;

        // Flow towards coordinator (or pulse outward if simulating)
        const startX = isSimulating ? centerScreenX : targetNode.screenX;
        const startY = isSimulating ? centerScreenY : targetNode.screenY;
        const endX = isSimulating ? targetNode.screenX : centerScreenX;
        const endY = isSimulating ? targetNode.screenY : centerScreenY;

        const px = startX + (endX - startX) * p.progress;
        const py = startY + (endY - startY) * p.progress;
        const pScale = targetNode.scale;

        ctx.beginPath();
        ctx.arc(px, py, Math.max(2, 4 * pScale), 0, Math.PI * 2);
        ctx.fillStyle = isSimulating ? '#38BDF8' : targetNode.hosp.color;
        ctx.shadowColor = targetNode.hosp.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 5. Draw Central Coordinator Hub (with 3D Pulsing Glow)
      const pulse = Math.sin(time * 3) * 4;
      // Outer ambient aura
      ctx.beginPath();
      ctx.arc(centerScreenX, centerScreenY, (30 + pulse) * centerScale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 180, 216, 0.15)';
      ctx.fill();

      // Core sphere
      const hubGrad = ctx.createRadialGradient(
        centerScreenX - 5,
        centerScreenY - 5,
        2,
        centerScreenX,
        centerScreenY,
        20 * centerScale
      );
      hubGrad.addColorStop(0, '#E0F2FE');
      hubGrad.addColorStop(0.4, '#00B4D8');
      hubGrad.addColorStop(1, '#0369A1');

      ctx.beginPath();
      ctx.arc(centerScreenX, centerScreenY, 18 * centerScale, 0, Math.PI * 2);
      ctx.fillStyle = hubGrad;
      ctx.shadowColor = '#00B4D8';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Hub Label
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('Central Coordinator Hub', centerScreenX, centerScreenY - 26);
      ctx.font = '9px "Inter", sans-serif';
      ctx.fillStyle = '#7DD3FC';
      ctx.fillText('SMPC Lagrange Aggregator', centerScreenX, centerScreenY - 14);

      // 6. Draw Hospital Nodes (Sorted by depthZ so background renders behind foreground)
      projectedNodes
        .sort((a, b) => b.depthZ - a.depthZ)
        .forEach(pn => {
          const radius = Math.max(8, 14 * pn.scale);

          // Node Halo
          ctx.beginPath();
          ctx.arc(pn.screenX, pn.screenY, radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = pn.hosp.color + '25';
          ctx.fill();

          // Node Sphere
          const sphereGrad = ctx.createRadialGradient(
            pn.screenX - radius * 0.3,
            pn.screenY - radius * 0.3,
            1,
            pn.screenX,
            pn.screenY,
            radius
          );
          sphereGrad.addColorStop(0, '#FFFFFF');
          sphereGrad.addColorStop(0.3, pn.hosp.color);
          sphereGrad.addColorStop(1, '#0F172A');

          ctx.beginPath();
          ctx.arc(pn.screenX, pn.screenY, radius, 0, Math.PI * 2);
          ctx.fillStyle = sphereGrad;
          ctx.shadowColor = pn.hosp.color;
          ctx.shadowBlur = 12 * pn.scale;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Hospital Name & Specs Tag
          ctx.font = 'bold 10px "Inter", sans-serif';
          ctx.fillStyle = '#F8FAFC';
          ctx.textAlign = 'center';
          ctx.fillText(pn.hosp.name, pn.screenX, pn.screenY + radius + 14);

          ctx.font = '9px monospace';
          ctx.fillStyle = '#94A3B8';
          ctx.fillText(`τ=${pn.hosp.trustScore} • w=${pn.hosp.weight}`, pn.screenX, pn.screenY + radius + 25);
        });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [rotX, rotY, isDragging, isSimulating]);

  // One-click 3D interactive simulation
  const handleTriggerSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep('Step 1/3: Generating Local Shamir (k=3, n=5) Secret Shares...');

    setTimeout(() => {
      setSimStep('Step 2/3: Transmitting polynomial shares via TLS — zero raw data exposed...');
    }, 1200);

    setTimeout(() => {
      setSimStep('Step 3/3: Coordinator running homomorphic addition & Lagrange interpolation...');
    }, 2400);

    setTimeout(() => {
      setSimStep('Complete! Global Model Updated with 91.4% Triage Accuracy.');
      setIsSimulating(false);
    }, 3800);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="space-y-10 pb-16 select-none"
    >
      {/* 1. SIMPLE HERO HEADER */}
      <section className="relative text-center pt-2 pb-6 max-w-4xl mx-auto space-y-4">
        {/* Research project status badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-950/60 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Final-Year Software Engineering Project • Smart Healthcare AI</span>
        </div>

        {/* Clean, authoritative title */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Privacy-Preserving{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            Federated Learning
          </span>{' '}
          for Smart Hospitals
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Collaboratively train clinical severity prediction models across 5 decentralized hospitals <strong>without sharing raw patient data</strong>, using <strong>Adaptive Trust Weighting</strong> and <strong>SMPC Shamir Secret Sharing</strong>.
        </p>

        {/* Fast Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5 z-20">
          <button
            onClick={() => onEnterApp('dashboard')}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-navy-950 font-black text-sm shadow-xl shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5 hover:scale-105"
          >
            <span>Open Consortium Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEnterApp('training')}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-navy-900/90 hover:bg-navy-800 text-white font-bold text-sm border border-navy-700 hover:border-cyan-500/50 shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <span>Federated Training</span>
          </button>

          <button
            onClick={() => onEnterApp('predictions')}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-navy-900/90 hover:bg-navy-800 text-white font-bold text-sm border border-navy-700 hover:border-teal-500/50 shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <Activity className="w-4 h-4 text-teal-400" />
            <span>Test Clinical Predictions</span>
          </button>
        </div>
      </section>

      {/* 2. ENHANCED 3D INTERACTIVE HOSPITAL NETWORK CANVAS */}
      <section className="relative max-w-5xl mx-auto">
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border-cyan-500/30 shadow-2xl relative overflow-hidden bg-navy-950/70">
          {/* Top Bar Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-800 gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>3D Federated Consortium Mesh Visualizer</span>
              </h2>
              <span className="hidden md:inline text-[11px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md font-mono">
                Click & Drag to Rotate in 3D
              </span>
            </div>

            {/* Interactive Simulation Trigger */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTriggerSimulation}
                disabled={isSimulating}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isSimulating
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 animate-pulse'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-navy-950 hover:shadow-cyan-500/20'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Simulating SMPC Round...' : 'Simulate 3D FL Round'}</span>
              </button>

              <button
                onClick={() => {
                  setRotX(0.25);
                  setRotY(0);
                }}
                title="Reset 3D Camera"
                className="p-1.5 rounded-xl bg-navy-900 border border-navy-700 text-slate-400 hover:text-white"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Status banner during simulation */}
          {isSimulating && (
            <div className="mt-3 px-3.5 py-2 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-xs text-cyan-200 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-mono">{simStep}</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">SMPC Active</span>
            </div>
          )}

          {/* 3D Canvas with drag cursor */}
          <div
            onMouseDown={handleMouseDown}
            className={`w-full h-[400px] mt-2 relative rounded-2xl bg-gradient-to-b from-navy-950 via-navy-900/60 to-navy-950 overflow-hidden ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Bottom Floating Stats Pill */}
            <div className="absolute bottom-3 inset-x-4 flex flex-wrap items-center justify-between pointer-events-none text-[11px] text-slate-400 font-mono bg-navy-950/80 backdrop-blur-md p-2 rounded-xl border border-navy-800">
              <div className="flex items-center space-x-3">
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" />
                  <span>Zero Patient Records Exposed</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="text-cyan-400 hidden sm:inline">Shamir (k=3, n=5) Secret Sharing</span>
              </div>
              <div className="text-slate-400">
                <span>Hold mouse & drag to rotate 3D view</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIMPLIFIED 3-STEP EXPLANATION */}
      <section className="max-w-5xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            How It Works
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Federated Learning in 3 Simple Steps</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Clinical data stays private inside hospital firewalls while models learn collaboratively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Step 1 */}
          <div
            onClick={() => onEnterApp('hospitals')}
            className="glass-panel glass-panel-hover p-5 rounded-2xl border-cyan-500/20 cursor-pointer group transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-cyan-300 flex items-center justify-between">
              <span>Local Model Training</span>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hospitals A–E train a local PyTorch deep learning model on their on-premise clinical vitals. <strong>Raw patient records never leave the hospital.</strong>
            </p>
            <div className="mt-3 pt-2.5 border-t border-navy-800/80 text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>100% HIPAA/GDPR Compliant</span>
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => onEnterApp('aggregation')}
            className="glass-panel glass-panel-hover p-5 rounded-2xl border-teal-500/20 cursor-pointer group transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-teal-300 flex items-center justify-between">
              <span>SMPC Shamir Sharing</span>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Model weight gradients are split into polynomial secret shares using a threshold scheme (k=3 of 5). <strong>No single node can reconstruct updates.</strong>
            </p>
            <div className="mt-3 pt-2.5 border-t border-navy-800/80 text-[11px] font-mono text-cyan-400 flex items-center space-x-1">
              <Lock className="w-3 h-3 shrink-0" />
              <span>Information-Theoretic Security</span>
            </div>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => onEnterApp('trust')}
            className="glass-panel glass-panel-hover p-5 rounded-2xl border-purple-500/20 cursor-pointer group transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-purple-300 flex items-center justify-between">
              <span>Adaptive Trust Scoring</span>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The coordinator aggregates shares using dynamic trust scores <code className="text-purple-300 font-mono">s = 0.3U + 0.25P + 0.2C + 0.25V</code>, rewarding reliable hospitals.
            </p>
            <div className="mt-3 pt-2.5 border-t border-navy-800/80 text-[11px] font-mono text-purple-300 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Non-IID Robust Aggregation</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DIRECT SHORTCUT LAUNCHPAD */}
      <section className="max-w-5xl mx-auto glass-panel p-5 sm:p-6 rounded-2xl border-navy-800">
        <div className="flex items-center justify-between pb-3 border-b border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-white">Application Module Directory</h3>
            <p className="text-xs text-slate-400">Click any card to navigate directly into that feature</p>
          </div>
          <span className="text-xs text-cyan-400 font-mono">10 Modules Live</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <button
            onClick={() => onEnterApp('dashboard')}
            className="p-3.5 rounded-xl bg-navy-900/80 hover:bg-navy-800 border border-navy-800 hover:border-cyan-500/40 text-left transition-all group"
          >
            <BarChart3 className="w-5 h-5 text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-xs">Dashboard</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Consortium metrics</p>
          </button>

          <button
            onClick={() => onEnterApp('training')}
            className="p-3.5 rounded-xl bg-navy-900/80 hover:bg-navy-800 border border-navy-800 hover:border-teal-500/40 text-left transition-all group"
          >
            <Cpu className="w-5 h-5 text-teal-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-xs">FL Training</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Run live rounds</p>
          </button>

          <button
            onClick={() => onEnterApp('trust')}
            className="p-3.5 rounded-xl bg-navy-900/80 hover:bg-navy-800 border border-navy-800 hover:border-purple-500/40 text-left transition-all group"
          >
            <Shield className="w-5 h-5 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-xs">Trust Scores</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Radar U, P, C, V</p>
          </button>

          <button
            onClick={() => onEnterApp('predictions')}
            className="p-3.5 rounded-xl bg-navy-900/80 hover:bg-navy-800 border border-navy-800 hover:border-emerald-500/40 text-left transition-all group"
          >
            <Activity className="w-5 h-5 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-xs">AI Predictions</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Triage patient vitals</p>
          </button>
        </div>
      </section>

      {/* 5. QUICK-START GUIDE FOR EXAMINERS / USERS */}
      <section className="max-w-5xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-navy-900 via-cyan-950/30 to-navy-900 border border-cyan-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white">Full-Stack Production System Ready</p>
            <p className="text-slate-400 text-[11px]">
              FastAPI Backend on port 8000 • PyTorch AI • Shamir SMPC • React Vite Frontend on port 3000
            </p>
          </div>
        </div>

        <button
          onClick={() => onEnterApp('dashboard')}
          className="px-5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 transition-colors shrink-0"
        >
          Enter Dashboard &rarr;
        </button>
      </section>
    </div>
  );
};
