import { useState, useEffect } from 'react';
import { Activity, Thermometer, Zap, BarChart3, Minimize2, CloudRain, AlertTriangle, Command, Atom, RefreshCw, Snowflake, Settings, Expand, LayoutGrid } from 'lucide-react';
import { CONFIG, MATERIALS, COOLING_TYPES } from './constants';
import { usePhysicsEngine } from './hooks/usePhysicsEngine';
import { RangeSlider } from './components/ui/RangeSlider';
import { Toggle } from './components/ui/Toggle';
import { StatItem } from './components/StatItem';
import { DieVisualizer } from './components/DieVisualizer';
import { Scene3D } from './components/Scene3D';
import { Tooltip } from './components/ui/Tooltip';
import { useAudioEngine } from './hooks/useAudioEngine';
import { PhaseSpace } from './components/PhaseSpace';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { ElectronFlow } from './components/ElectronFlow';
import { LogicGateArray } from './components/LogicGateArray';

export default function ThermalSim() {
  const { state, update } = usePhysicsEngine();
  const [uiState, setUiState] = useState(state.current);
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState<'standard' | 'architecture' | 'experimental' | 'void'>('standard');
  const [showBios, setShowBios] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTelemetryOpen, setMobileTelemetryOpen] = useState(false);
  const [swapVisuals, setSwapVisuals] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Collapsible Sections State
  const [showCooling, setShowCooling] = useState(true);
  const [showMaterials, setShowMaterials] = useState(true);
  const [showPaste, setShowPaste] = useState(true);

  const [audioEnabled, setAudioEnabled] = useState(false);

  const { playClick, playWarning } = useAudioEngine(audioEnabled, uiState.currentClock, uiState.currentLoad);

  useEffect(() => {
    let animationFrame: number;
    const loop = () => {
      update();
      setUiState({ ...state.current });
      animationFrame = requestAnimationFrame(loop);
    };
    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [update]);

  const setInput = (key: string, val: any) => {
    (state.current as any)[key] = val;
    setUiState(prev => ({ ...prev, [key]: val }));
  };

  const resetSystem = () => {
    state.current.isHalted = false;
    state.current.currentTemp = state.current.ambientTemp;
    state.current.heatsinkTemp = state.current.ambientTemp;
    state.current.coolantTemp = state.current.ambientTemp;
    setUiState({ ...state.current });
  };

  const isThrottling = uiState.thermalStatus === 'THROTTLING';
  const isOC = uiState.thermalStatus === 'OVERCLOCKED';
  const isCondensation = uiState.condensationRisk > 30;

  // --- Dynamic Graph Scaling (Auto-Ranging) ---
  const historyTemps = uiState.history.map((h: any) => h.temp);
  let gMin = Math.min(...historyTemps);
  let gMax = Math.max(...historyTemps);

  // Ensure minimum visual range to prevent flatline errors or excessive zoom on noise
  if (gMax - gMin < 20) {
    const mid = (gMax + gMin) / 2;
    gMin = mid - 10;
    gMax = mid + 10;
  }

  // Add varied padding for aesthetics
  const gPadding = (gMax - gMin) * 0.15;
  gMin -= gPadding;
  gMax += gPadding;

  const getGraphY = (val: number) => {
    const norm = (val - gMin) / (gMax - gMin);
    return 100 - (Math.max(0, Math.min(1, norm)) * 100);
  };

  return (
    <div className={`relative w-full h-screen bg-[#020202] overflow-hidden font-sans select-none text-white transition-all duration-1000 ${uiState.isHalted ? 'filter grayscale' : ''}`}>

      {/* Critical Overlays */}
      {/* Vignette & CRT Effects */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-40" />
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] pointer-events-none" />

      <div className="relative w-full h-full flex flex-col">
        {uiState.isHalted && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 sm:p-12 text-center pointer-events-auto">
            <div className={`absolute inset-0 opacity-40 mix-blend-screen bg-gradient-to-t ${uiState.haltReason === 'HEAT' ? 'from-rose-900 via-red-950 to-black' : 'from-cyan-900 via-blue-950 to-black'}`} />

            <div className="relative glass-panel p-8 sm:p-12 rounded-3xl border-2 border-white/10 max-w-2xl animate-in zoom-in-95 duration-500">
              <AlertTriangle size={isMobile ? 48 : 64} className={`mx-auto mb-6 ${uiState.haltReason === 'HEAT' ? 'text-rose-500' : 'text-cyan-400'}`} />
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter mb-2 italic">
                {uiState.haltReason === 'HEAT' ? 'Hard Thermal Trip' : 'Silicon Cold Bug'}
              </h2>
              <p className="text-white/40 font-mono text-[10px] sm:text-xs uppercase tracking-[2px] sm:tracking-[4px] mb-8">
                {uiState.haltReason === 'HEAT' ? 'Hardware safety halt: Crystal lattice instability detected' : 'Component embrittlement: Operational floor exceeded'}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-white/30 uppercase mb-1">Last Temp</div>
                  <div className={`text-xl sm:text-2xl font-black ${uiState.haltReason === 'HEAT' ? 'text-rose-500' : 'text-cyan-400'}`}>{uiState.currentTemp.toFixed(1)}°C</div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-white/30 uppercase mb-1">Status</div>
                  <div className="text-xl sm:text-2xl font-black text-white/80">SYSTEM HALT</div>
                </div>
              </div>

              <button
                onClick={resetSystem}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-[2px] transition-all
                        ${uiState.haltReason === 'HEAT' ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.4)]' : 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.4)]'}
                    `}
              >
                <RefreshCw size={20} /> Force HW Reset
              </button>
            </div>
          </div>
        )}


        {/* Background Simulation */}
        <div className={`absolute inset-0 transition-colors duration-1000 z-0 ${isCondensation ? 'bg-cyan-900/10' : ''} ${swapVisuals ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {swapVisuals ? (
            <div className="w-full h-full flex items-center justify-center scale-[1.01]">
              <DieVisualizer
                temp={uiState.currentTemp}
                load={uiState.currentLoad}
                coreCount={uiState.coreCount}
                clock={uiState.currentClock}
                fps={uiState.fps}
                stateRef={state}
                className="w-full h-max"
                fullscreen={true}
              />
            </div>
          ) : (
            <Scene3D
              clockRatio={uiState.currentClock / CONFIG.BASE_CLOCK}
              currentLoad={uiState.currentLoad}
              fps={uiState.fps}
              expSingularity={uiState.expSingularity}
              expSentience={uiState.expSentience}
              expRealityAnchor={uiState.expRealityAnchor}
              expInfiniteCore={uiState.expInfiniteCore}
            />
          )}
        </div>

        {/* Condensation Warning */}
        {isCondensation && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-xl rounded-full animate-pulse">
            <CloudRain size={16} className="text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-[3px] text-cyan-200">Moisture Accumulation detected</span>
          </div>
        )}

        {/* Minimalistic Top Bar */}
        {/* Mobile Header */}
        {isMobile && !uiState.isHalted && (
          <header className="fixed top-0 left-0 w-full z-[100] px-4 py-3 flex items-center glass-panel border-b border-white/10 h-16">
            <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-6 px-2 mr-4">
              <div className="flex items-center gap-6 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Clock</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-black tracking-tight ${isThrottling ? 'text-rose-500' : isOC ? 'text-purple-400' : 'text-cyan-400'}`}>
                      {uiState.currentClock.toFixed(2)}
                    </span>
                    <span className="text-[8px] font-bold text-white/20">GHz</span>
                  </div>
                </div>

                <div className="w-[1px] h-6 bg-white/5" />

                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Temp</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-black tracking-tight ${uiState.currentTemp > 85 ? 'text-orange-500' : 'text-white'}`}>
                      {uiState.currentTemp.toFixed(1)}
                    </span>
                    <span className="text-[8px] font-bold text-white/20">°C</span>
                  </div>
                </div>

                <div className="w-[1px] h-6 bg-white/5" />

                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">FPS</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black tracking-tight text-white/60">
                      {(uiState.fps ?? 60).toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="w-[1px] h-6 bg-white/5" />

                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Power</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black tracking-tight text-white/80">
                      {uiState.powerDraw.toFixed(0)}
                    </span>
                    <span className="text-[8px] font-bold text-white/20">W</span>
                  </div>
                </div>

                {uiState.coolingType.type === 'AIO' && (
                  <>
                    <div className="w-[1px] h-6 bg-white/5" />
                    <div className="flex flex-col">
                      <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Loop</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black tracking-tight text-cyan-600/80">
                          {uiState.coolantTemp.toFixed(1)}
                        </span>
                        <span className="text-[8px] font-bold text-white/20">°C</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 bg-white/5 rounded-xl border border-white/10 shrink-0 shadow-lg active:scale-95 transition-all"
            >
              <Settings size={20} className={mobileMenuOpen ? 'text-cyan-400 rotate-90 transition-transform' : 'text-white/60'} />
            </button>
          </header>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <header className={`absolute top-0 left-0 w-full z-[100] px-8 py-4 flex justify-center items-center transition-all duration-700 pointer-events-none ${uiState.isHalted ? 'opacity-0 translate-y-[-20px]' : 'opacity-100'}`}>
            <div className="flex items-center gap-6 pointer-events-auto px-5 py-2 glass-panel rounded-2xl relative">
              <StatItem
                label="Frequency"
                value={uiState.currentClock.toFixed(2)}
                unit="GHz"
                icon={Activity}
                color={isThrottling ? 'text-rose-500 animate-pulse' : isOC ? 'text-purple-400' : 'text-cyan-400'}
              />

              <div className="w-[1px] h-8 bg-white/10" />

              <StatItem
                label="FPS"
                value={(uiState.fps ?? 60).toFixed(0)}
                unit=""
                icon={RefreshCw}
                color="text-white/60"
              />

              <div className="w-[1px] h-8 bg-white/10" />

              <div className="flex gap-10">
                <StatItem
                  label="Die Core"
                  value={uiState.currentTemp.toFixed(1)}
                  unit="°C"
                  icon={Thermometer}
                  color={uiState.currentTemp < 0 ? 'text-cyan-200' : uiState.currentTemp > 85 ? 'text-orange-400' : 'text-white/90'}
                />
                {uiState.coolingType.type === 'AIO' && (
                  <StatItem
                    label="Coolant"
                    value={uiState.coolantTemp.toFixed(1)}
                    unit="°C"
                    icon={CloudRain}
                    color="text-cyan-600/80"
                  />
                )}
                {uiState.coolingType.type === 'LN2' && (
                  <StatItem
                    label="Nitrogen"
                    value="-195.8"
                    unit="°C"
                    icon={Snowflake}
                    color="text-cyan-200"
                  />
                )}
              </div>

              <div className="w-[1px] h-8 bg-white/10" />

              <StatItem
                label="Total Power"
                value={uiState.powerDraw.toFixed(0)}
                unit="W"
                icon={Zap}
                color="text-white/90"
              />

              <div className="w-[1px] h-8 bg-white/10" />

              <button
                onClick={() => setShowBios(!showBios)}
                className={`p-2 rounded-lg transition-all ${showBios ? 'bg-cyan-500 text-black' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                <Settings size={20} className={showBios ? 'animate-spin-slow' : ''} />
              </button>

              {showBios && (
                <div className="absolute top-full mt-4 right-0 w-64 glass-panel p-6 z-[110] animate-in slide-in-from-top-4 duration-300 pointer-events-auto text-left rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <h3 className="text-[11px] font-black uppercase tracking-[3px] text-cyan-400 mb-6 flex items-center gap-2">
                    <Command size={14} /> System BIOS v1.2
                  </h3>
                  <div className="space-y-6">
                    <Toggle
                      label="Audio Simulation"
                      active={audioEnabled}
                      onClick={() => {
                        setAudioEnabled(!audioEnabled);
                        playClick();
                      }}
                      color="cyan"
                    />
                    <button
                      onClick={() => {
                        resetSystem();
                        playWarning();
                        setShowBios(false);
                      }}
                      className="w-full py-2 bg-rose-500/20 border border-rose-500/50 text-rose-500 text-[10px] font-bold uppercase tracking-[2px] rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                    >
                      Immediate Sys-Kill
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>
        )}


        {/* Mobile Navigation Bar */}
        {isMobile && !uiState.isHalted && (
          <nav className="fixed bottom-0 left-0 w-full z-[100] px-4 py-3 flex justify-around items-center glass-panel border-t border-white/10 rounded-t-3xl pb-8">
            <button
              onClick={() => {
                if (activeTab === 'standard' && mobileMenuOpen) {
                  setMobileMenuOpen(false);
                } else {
                  setActiveTab('standard');
                  setMobileMenuOpen(true);
                  setMobileTelemetryOpen(false);
                }
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'standard' && mobileMenuOpen ? 'text-cyan-400 scale-110' : 'text-white/40'}`}
            >
              <Thermometer size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Thermals</span>
            </button>
            <button
              onClick={() => {
                if (activeTab === 'architecture' && mobileMenuOpen) {
                  setMobileMenuOpen(false);
                } else {
                  setActiveTab('architecture');
                  setMobileMenuOpen(true);
                  setMobileTelemetryOpen(false);
                }
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'architecture' && mobileMenuOpen ? 'text-cyan-400 scale-110' : 'text-white/40'}`}
            >
              <Zap size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Cores</span>
            </button>
            <button
              onClick={() => {
                setMobileTelemetryOpen(!mobileTelemetryOpen);
                if (!mobileTelemetryOpen) setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${mobileTelemetryOpen ? 'text-cyan-400 scale-110' : 'text-white/40'}`}
            >
              <BarChart3 size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Stats</span>
            </button>
            <button
              onClick={() => {
                if (activeTab === 'void' && mobileMenuOpen) {
                  setMobileMenuOpen(false);
                } else {
                  setActiveTab('void');
                  setMobileMenuOpen(true);
                  setMobileTelemetryOpen(false);
                }
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'void' && mobileMenuOpen ? 'text-amber-500 scale-110' : 'text-white/40'}`}
            >
              <Atom size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Void</span>
            </button>
          </nav>
        )}

        {/* Main Workspace */}
        <main className={`absolute inset-0 flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 lg:p-12 transition-all duration-700 z-[50] pointer-events-none ${uiState.isHalted ? 'opacity-0 scale-95' : 'opacity-100'}`}>


          {/* Left Control Column */}
          <section className={`
            ${isMobile
              ? `fixed inset-0 z-[110] p-6 pt-24 bg-black/95 backdrop-blur-3xl transition-transform duration-500 pointer-events-auto ${mobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`
              : `w-[320px] pointer-events-auto transition-all duration-700 delay-100 z-[60] ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`
            }
          `}>
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 rounded-full border border-white/10"
              >
                <Minimize2 size={24} className="text-white/60" />
              </button>
            )}
            <div className={`glass-panel rounded-3xl p-6 flex flex-col gap-5 max-h-[85vh] lg:max-h-[85vh] overflow-y-auto custom-scrollbar ${isMobile ? 'h-full max-h-none border-none shadow-none bg-transparent pb-32' : ''}`}>

              <div className="flex justify-between items-center border-b border-white/5 shrink-0 mb-2">
                <button
                  onClick={() => setActiveTab('standard')}
                  className={`text-[10px] font-black uppercase tracking-[2px] py-3 border-b-2 transition-all flex-1 ${activeTab === 'standard' ? 'border-cyan-400 text-white' : 'border-transparent text-white/30 hover:text-white/60'}`}
                >
                  Stat
                </button>
                <button
                  onClick={() => setActiveTab('architecture')}
                  className={`text-[10px] font-black uppercase tracking-[2px] py-3 border-b-2 transition-all flex-1 ${activeTab === 'architecture' ? 'border-cyan-400 text-white' : 'border-transparent text-white/30 hover:text-white/60'}`}
                >
                  Core
                </button>
                <button
                  onClick={() => setActiveTab('experimental')}
                  className={`text-[10px] font-black uppercase tracking-[2px] py-3 border-b-2 transition-all flex-1 ${activeTab === 'experimental' ? 'border-purple-500 text-white' : 'border-transparent text-white/30 hover:text-white/60'}`}
                >
                  Exp
                </button>
                <button
                  onClick={() => setActiveTab('void')}
                  className={`text-[10px] font-black uppercase tracking-[2px] py-3 border-b-2 transition-all flex-1 ${activeTab === 'void' ? 'border-amber-500 text-white' : 'border-transparent text-white/30 hover:text-white/60'}`}
                >
                  Void
                </button>
              </div>

              {activeTab === 'standard' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                  {/* Cooling System Section */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowCooling(!showCooling)}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`transition-transform duration-300 ${showCooling ? 'rotate-90' : ''}`}>
                          <Minimize2 size={12} className="text-cyan-400" />
                        </div>
                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[3px] group-hover:text-white/80 transition-colors cursor-pointer">
                          Cooling System
                        </label>
                      </div>
                      <div className="text-[9px] font-mono text-white/20">{uiState.coolingType.name}</div>
                    </button>

                    {showCooling && (
                      <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                        {Object.values(COOLING_TYPES).map((type) => (
                          <Tooltip key={type.type} content={`${type.name}. Power Draw: ${type.power}W.`}>
                            <button
                              onClick={() => setInput('coolingType', type)}
                              className={`w-full py-4 rounded-xl border-t border-x text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group/btn
                                ${uiState.coolingType.type === type.type
                                  ? 'bg-white text-black border-white shadow-[0_10px_30px_rgba(255,255,255,0.25)] scale-[1.02] z-10'
                                  : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white/70 hover:bg-white/[0.08]'
                                }`}
                            >
                              {uiState.coolingType.type === type.type && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-50" />
                              )}
                              <span className="relative z-10">{type.name.replace(' Cooling', '').replace(' Liquid', '')}</span>
                            </button>

                          </Tooltip>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Block Material Section */}
                  {(uiState.coolingType.type !== 'AIO' && uiState.coolingType.type !== 'LN2' && uiState.coolingType.type !== 'LHE' && uiState.coolingType.type !== 'BEC') && (
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <button
                        onClick={() => setShowMaterials(!showMaterials)}
                        className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`transition-transform duration-300 ${showMaterials ? 'rotate-90' : ''}`}>
                            <Minimize2 size={12} className="text-cyan-400" />
                          </div>
                          <label className="text-[11px] font-black text-white/40 uppercase tracking-[3px] group-hover:text-white/80 transition-colors cursor-pointer">
                            Block Material
                          </label>
                        </div>
                        <div className="text-[9px] font-mono text-white/20">{uiState.material.name}</div>
                      </button>

                      {showMaterials && (
                        <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                          {Object.values(MATERIALS).map((mat) => (
                            <Tooltip key={mat.name} content={`${mat.name}: Conductivity ${mat.conductivity} W/mk.`}>
                              <button
                                onClick={() => setInput('material', mat)}
                                className={`w-full py-3.5 rounded-xl border-t border-x text-[9px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden
                                  ${uiState.material.name === mat.name
                                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_10px_30px_rgba(34,211,238,0.4)] scale-[1.02] z-10'
                                    : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white/70 hover:bg-white/[0.08]'
                                  }`}
                              >
                                {uiState.material.name === mat.name && (
                                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50" />
                                )}
                                <span className="relative z-10">{mat.name}</span>
                              </button>

                            </Tooltip>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Thermal Paste Settings */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <button
                      onClick={() => setShowPaste(!showPaste)}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`transition-transform duration-300 ${showPaste ? 'rotate-90' : ''}`}>
                          <Minimize2 size={12} className="text-cyan-400" />
                        </div>
                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[3px] group-hover:text-white/80 transition-colors cursor-pointer">
                          Thermal Interface
                        </label>
                      </div>
                      <div className="text-[9px] font-mono text-white/20">{uiState.pasteQuality >= 2.0 ? "Liquid Metal" : uiState.pasteQuality > 1.0 ? "Ceramic" : "Generic"}</div>
                    </button>

                    {showPaste && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6 pt-2">
                        <Tooltip content="TIM application quality. Affects delta T between die and block.">
                          <RangeSlider
                            label="Application"
                            value={Math.round(uiState.pasteQuality * 100)}
                            min={10} max={250} unit="%"
                            onChange={(v) => setInput('pasteQuality', v / 100)}
                            color="cyan"
                          />
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  {/* Environment / Primary Controls */}
                  <div className="space-y-6 pt-4 border-t border-white/5">
                    <Tooltip content="Increased voltage allows higher frequencies but generates exponential heat.">
                      <RangeSlider
                        label="Voltage"
                        value={uiState.voltage}
                        min={0.8} max={2.5} step={0.01} unit="V"
                        onChange={(v) => setInput('voltage', v)}
                        color="purple"
                      />
                    </Tooltip>
                    <Tooltip content="Computational stress level across all active cores.">
                      <RangeSlider
                        label="Engine Load"
                        value={Math.round(uiState.targetLoad)}
                        min={0} max={100} unit="%"
                        onChange={(v) => setInput('targetLoad', v)}
                        color="red"
                      />
                    </Tooltip>
                    <Tooltip content="Cooling fan/pump output level.">
                      <RangeSlider
                        label="Thermal PWM"
                        value={Math.round(uiState.fanSpeed)}
                        min={0} max={100} unit="%"
                        onChange={(v) => setInput('fanSpeed', v)}
                      />
                    </Tooltip>
                  </div>

                  {/* Secondary Environment */}
                  <div className="pt-6 border-t border-white/5 space-y-6">
                    <Tooltip content="Ambient room temperature. Affects overall cooling efficiency.">
                      <RangeSlider
                        label="Ambient Temp"
                        value={Math.round(uiState.ambientTemp)}
                        min={-50} max={100} unit="°C"
                        onChange={(v) => setInput('ambientTemp', v)}
                        color="cyan"
                      />
                    </Tooltip>
                    <Tooltip content="Airflow restriction due to partial blockage.">
                      <RangeSlider
                        label="Dust Buildup"
                        value={Math.round(uiState.dustDensity)}
                        min={0} max={100} unit="%"
                        onChange={(v) => setInput('dustDensity', v)}
                        color="red"
                      />
                    </Tooltip>
                    <Tooltip content="Ambient humidity level. High humidity raises the dew point.">
                      <RangeSlider
                        label="Rel. Humidity"
                        value={Math.round(uiState.humidity)}
                        min={0} max={100} unit="%"
                        onChange={(v) => setInput('humidity', v)}
                      />
                    </Tooltip>
                  </div>
                </div>
              )}

              {activeTab === 'architecture' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="space-y-6">
                    <Tooltip content="Total physical processing cores. More cores increase total power draw and heat output significantly.">
                      <RangeSlider
                        label="Physical Cores"
                        value={uiState.coreCount}
                        min={1} max={64} unit="C"
                        onChange={(v) => setInput('coreCount', v)}
                      />
                    </Tooltip>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <Toggle
                        label="SMT (Hyper-Threading)"
                        active={uiState.smtEnabled}
                        onClick={() => setInput('smtEnabled', !uiState.smtEnabled)}
                      />
                      <p className="text-[11px] text-white/30 italic">Simultaneous Multithreading increases throughput efficiency but adds ~20% more heat.</p>
                    </div>

                    <Tooltip content="Access frequency of the L3 cache. Higher values simulate memory-hungry workloads.">
                      <RangeSlider
                        label="Cache Pressure"
                        value={Math.round(uiState.cacheIntensity * 100)}
                        min={0} max={100} unit="%"
                        onChange={(v) => setInput('cacheIntensity', v / 100)}
                      />
                    </Tooltip>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <p className="text-[10px] uppercase font-bold text-white/20 tracking-[2px] mb-2">Experimental Architecture</p>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                        <Toggle
                          label="Recursive SMT"
                          active={uiState.archRecursiveSMT}
                          onClick={() => setInput('archRecursiveSMT', !uiState.archRecursiveSMT)}
                        />
                        <p className="text-[11px] text-white/30 italic">Fractal thread scheduling (128-way). Massive throughput, exponential heat generation.</p>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                        <Toggle
                          label="Dark Silicon Reuse"
                          active={uiState.archDarkSilicon}
                          onClick={() => setInput('archDarkSilicon', !uiState.archDarkSilicon)}
                        />
                        <p className="text-[11px] text-white/30 italic">Harvests dead transistors for L4 cache. Lowers leakage but adds latency.</p>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                        <Toggle
                          label="Neural Prediction"
                          active={uiState.archNeuralPrediction}
                          onClick={() => setInput('archNeuralPrediction', !uiState.archNeuralPrediction)}
                        />
                        <p className="text-[11px] text-white/30 italic">AI-based branch prediction. Improves IPC efficiency by 15%.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'experimental' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-3">
                      <Toggle
                        label="Quantum Tunneling"
                        active={uiState.expQuantum}
                        onClick={() => setInput('expQuantum', !uiState.expQuantum)}
                        color="purple"
                      />
                      <p className="text-[11px] text-white/50 leading-relaxed italic">Allows electrons to bypass high-resistance barriers. Extreme clock potential but massive thermal leakage.</p>
                    </div>

                    <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-3">
                      <Toggle
                        label="Superconductor"
                        active={uiState.expSuperconductor}
                        onClick={() => setInput('expSuperconductor', !uiState.expSuperconductor)}
                        color="purple"
                      />
                      <p className="text-[11px] text-white/50 leading-relaxed italic">
                        Zero-resistance state. When active and temperature is below the critical threshold (<b>-180°C</b>), heat generation drops to near-zero.
                      </p>
                    </div>

                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-3">
                      <Toggle
                        label="Voltage Overclock"
                        active={uiState.expUnlockVoltage}
                        onClick={() => setInput('expUnlockVoltage', !uiState.expUnlockVoltage)}
                        danger={true}
                        color="purple"
                      />
                      <p className="text-[11px] text-white/50 leading-relaxed italic">
                        Removes BIOS voltage limiters. Allows clock scaling up to 12.0GHz, but significantly accelerates thermal accumulation.
                      </p>
                    </div>

                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl space-y-3">
                      <Toggle
                        label="Bypass Safety"
                        active={uiState.expDisableSafety}
                        onClick={() => setInput('expDisableSafety', !uiState.expDisableSafety)}
                        danger={true}
                        color="purple"
                      />
                      <p className="text-[11px] text-white/50 leading-relaxed italic">
                        Disables Hard Thermal Trip and Cold Bug protections. Warning: Operating without safety limits may lead to anomalous simulation behavior.
                      </p>
                    </div>
                  </div>

                  <Tooltip content="Core frequency multiplier. High OC requires extreme cooling and voltage.">
                    <RangeSlider
                      label="Clock Multiplier"
                      value={uiState.clockRatio}
                      min={0.5} max={15.0} step={0.1} unit="x"
                      onChange={(v) => setInput('clockRatio', v)}
                      color="purple"
                    />
                  </Tooltip>

                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-purple-400 uppercase">
                      <Atom size={14} className="animate-spin-slow" /> Theoretical Lab Notes
                    </div>
                    <p className="text-[11px] text-purple-300/80 leading-relaxed font-light">
                      Experimental features simulate edge-case physics. Superconductivity requires <b>Active LN2</b> cooling to reach $T_c$. Quantum Tunneling simulates electron leakage through gate oxides.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-purple-500/20 space-y-6">
                    <Tooltip content="Injection of chaotic energy into the crystal lattice. Causes unpredictable temperature spikes.">
                      <RangeSlider
                        label="Lattice Entropy"
                        value={uiState.expEntropy}
                        min={0} max={100} unit="Δ"
                        onChange={(v) => setInput('expEntropy', v)}
                        color="purple"
                      />
                    </Tooltip>
                    <Tooltip content="Scales the speed of the physics engine. Allows you to observe fast thermal transitions in slow-motion.">
                      <RangeSlider
                        label="Temporal Scale"
                        value={uiState.expTimeDilation}
                        min={0.1} max={5.0} step={0.1} unit="x"
                        onChange={(v) => setInput('expTimeDilation', v)}
                        color="purple"
                      />
                    </Tooltip>
                  </div>
                </div>
              )}

              {activeTab === 'void' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                      <AlertTriangle size={12} /> Impossible Anomaly Warning
                    </div>
                    <p className="text-[11px] text-amber-200/60 leading-relaxed font-light italic">
                      Safety protocols deleted. Laws of physics optional. Proceed at universal risk.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <Toggle
                        label="Singularity cooling"
                        active={uiState.expSingularity}
                        onClick={() => setInput('expSingularity', !uiState.expSingularity)}
                        color="purple"
                      />
                      <p className="text-[11px] text-white/30 italic">Heat is discarded into a localized micro-black hole. Dynamic temperature becomes negative almost instantly.</p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <Toggle
                        label="Vacuum Energy"
                        active={uiState.expVacuumEnergy}
                        onClick={() => setInput('expVacuumEnergy', !uiState.expVacuumEnergy)}
                        color="purple"
                      />
                      <p className="text-[11px] text-white/30 italic">Transistors draw energy from the zero-point field. Idle power leakage is eliminated.</p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <Toggle
                        label="Temporal Clock"
                        active={uiState.expTemporalClock}
                        onClick={() => setInput('expTemporalClock', !uiState.expTemporalClock)}
                        danger={true}
                      />
                      <p className="text-[11px] text-white/30 italic">Forces clock speeds beyond 100GHz by folding time. Telemetry status shifts to 'TEMPORAL DRIFT'.</p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <Toggle
                        label="Fusion Core"
                        active={uiState.expFusion}
                        onClick={() => setInput('expFusion', !uiState.expFusion)}
                        color="purple"
                      />
                      <p className="text-[11px] text-white/30 italic">High-load stabilizes nuclear fusion. Increasing computational demand actually cools the silicon while generating 50,000W+.</p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <Toggle
                        label="Phase Shift"
                        active={uiState.expMatterShift}
                        onClick={() => setInput('expMatterShift', !uiState.expMatterShift)}
                        color="purple"
                      />
                      <p className="text-[11px] text-white/30 italic">Matter becomes partially non-localized. The silicon lattice periodically resets its thermal state through quantum decoherence.</p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <Toggle
                        label="Infinite Core"
                        active={uiState.expInfiniteCore}
                        onClick={() => setInput('expInfiniteCore', !uiState.expInfiniteCore)}
                        color="purple"
                      />
                      <p className="text-[11px] text-white/30 italic">Unlocks recursize fractal processing cores. Infinite parallelism but creates a singularity event.</p>
                    </div>

                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-3">
                      <Toggle
                        label="Sentience"
                        active={uiState.expSentience}
                        onClick={() => setInput('expSentience', !uiState.expSentience)}
                        danger={true}
                      />
                      <p className="text-[11px] text-rose-300/60 italic">WARNING: Grants the CPU autonomy over its own voltage and clock speed. It may refuse your commands.</p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <Toggle
                        label="Reality Anchor"
                        active={uiState.expRealityAnchor}
                        onClick={() => setInput('expRealityAnchor', !uiState.expRealityAnchor)}
                        color="cyan"
                      />
                      <p className="text-[11px] text-white/30 italic">Keeps physics constants stable. Disabling this causes fundamental laws of physics to drift randomly.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Right Information Column */}
          <section className={`
            ${isMobile
              ? `fixed inset-0 z-[110] p-6 pt-24 pb-32 bg-black/95 backdrop-blur-3xl transition-transform duration-500 pointer-events-auto overflow-y-auto custom-scrollbar ${mobileTelemetryOpen ? 'translate-y-0' : 'translate-y-full'}`
              : `flex flex-col gap-4 items-end pointer-events-auto z-[60] max-h-[85vh] overflow-y-auto custom-scrollbar pr-4 pb-4`
            }
          `}>
            {isMobile && (
              <button
                onClick={() => setMobileTelemetryOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 rounded-full border border-white/10"
              >
                <Minimize2 size={24} className="text-white/60" />
              </button>
            )}

            {/* reimagined IR CAM (Fixed) */}
            <div className={`flex flex-col items-end group relative ${isMobile ? 'w-full mb-6' : 'w-72'}`}>

              <div className="relative z-40 w-full cursor-crosshair group">
                {!swapVisuals ? (
                  <DieVisualizer
                    temp={uiState.currentTemp}
                    load={uiState.currentLoad}
                    coreCount={uiState.coreCount}
                    clock={uiState.currentClock}
                    fps={uiState.fps}
                    stateRef={state}
                    className={`w-full aspect-square`}
                  />
                ) : (
                  <div className={`w-full aspect-square shadow-2xl border border-white/10 rounded-2xl overflow-hidden bg-black/40 relative`}>
                    <Scene3D
                      clockRatio={uiState.currentClock / CONFIG.BASE_CLOCK}
                      currentLoad={uiState.currentLoad}
                      fps={uiState.fps}
                      expSingularity={uiState.expSingularity}
                      expSentience={uiState.expSentience}
                      expRealityAnchor={uiState.expRealityAnchor}
                      expInfiniteCore={uiState.expInfiniteCore}
                      lowRes={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Swap Overlay Button */}
                <button
                  onClick={() => setSwapVisuals(!swapVisuals)}
                  className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-[50] flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-full transition-all active:scale-95 whitespace-nowrap ${isMobile ? 'opacity-100 scale-110 shadow-lg bg-white/20' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  {swapVisuals ? (
                    <>
                      <LayoutGrid size={14} className="text-cyan-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Minimize IR</span>
                    </>
                  ) : (
                    <>
                      <Expand size={14} className="text-cyan-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Fullscreen IR</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Detailed Telemetry */}
            <div className={`glass-panel rounded-3xl p-5 flex flex-col gap-4 ${isMobile ? 'w-full' : 'w-72'}`}>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[2px]">
                <span className="text-white/30 flex items-center gap-2"><BarChart3 size={12} /> Telemetry Loop</span>
                <span className={isThrottling ? 'text-rose-500' : 'text-cyan-400'}>
                  {isThrottling ? 'SAFETY THROTTLE' : 'SYSTEM NOMINAL'}
                </span>
              </div>

              <div className="h-40 sm:h-48 relative bg-black/50 rounded-2xl border border-white/10 overflow-hidden">
                {/* Oscilloscope Grid */}
                <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />


                {/* Channel Labels */}
                <div className="absolute top-2 left-2 z-10 flex gap-4 text-[9px] font-mono font-bold tracking-widest">
                  <span className="text-cyan-400">CH1: TEMP</span>
                  <span className="text-purple-400">CH2: CLOCK</span>
                  <span className="text-emerald-500">CH3: LIFE</span>
                </div>

                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${CONFIG.HISTORY_SIZE} 100`}>
                  {/* Channel 3: Silicon Health (Emerald) - 0-100% */}
                  <path
                    d={`M 0 ${100 - (uiState.history[0]?.health || 100)} ${uiState.history.map((h: any, i: number) => `L ${i} ${100 - h.health}`).join(' ')}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Channel 2: Clock/Load (Purple) - Scaled 0-20GHz approx */}
                  <path
                    d={`M 0 ${100 - (uiState.history[0]?.clock || 0) * 5} ${uiState.history.map((h: any, i: number) => `L ${i} ${100 - (h.clock * 5)}`).join(' ')}`}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Channel 1: Temperature (Cyan/Red) - Dynamic Auto-Range */}
                  <path
                    d={`M 0 ${getGraphY(uiState.history[0]?.temp || 0)} ${uiState.history.map((h: any, i: number) => `L ${i} ${getGraphY(h.temp)}`).join(' ')}`}
                    fill="none"
                    stroke={isThrottling ? '#f43f5e' : '#22d3ee'}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    className="drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]"
                  />

                  {/* Live Scanline / Cursor */}
                  <line
                    x1={uiState.history.length - 1} y1="0"
                    x2={uiState.history.length - 1} y2="100"
                    stroke="white"
                    strokeOpacity="0.2"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* Live Value Digital Readout (Floating) */}
                <div className="absolute top-1/2 right-2 transform -translate-y-1/2 text-right pointer-events-none space-y-1">
                  <div className="text-[10px] font-mono text-cyan-400 bg-black/60 px-1 rounded backdrop-blur">
                    {(uiState.currentTemp).toFixed(1)}°C
                  </div>
                  <div className="text-[10px] font-mono text-purple-400 bg-black/60 px-1 rounded backdrop-blur">
                    {(uiState.currentClock).toFixed(2)}GHz
                  </div>
                  <div className="text-[10px] font-mono text-emerald-500 bg-black/60 px-1 rounded backdrop-blur">
                    {(uiState.siliconHealth).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-y-3 gap-x-6">
                <div>
                  <span className="text-[10px] text-white/30 uppercase font-black tracking-widest block mb-1">Reliability</span>
                  <span className="text-base font-mono font-bold text-white/80">{(uiState.mtbf / 8760).toFixed(1)} <span className="text-[9px] text-white/20 uppercase">Yrs</span></span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/30 uppercase font-black tracking-widest block mb-1">Leakage</span>
                  <span className="text-base font-mono font-bold text-purple-400">{uiState.leakageCurrent.toFixed(1)} <span className="text-[9px] text-white/20 uppercase">mA</span></span>
                </div>
                <div>
                  <span className="text-[10px] text-white/30 uppercase font-black tracking-widest block mb-1">Silicon Health</span>
                  <span className={`text-base font-mono font-bold ${uiState.siliconHealth > 80 ? 'text-emerald-500' : uiState.siliconHealth > 50 ? 'text-orange-500' : 'text-rose-500'}`}>
                    {uiState.siliconHealth.toFixed(1)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/30 uppercase font-black tracking-widest block mb-1">Thermal Res</span>
                  <span className="text-base font-mono font-bold text-cyan-400">{uiState.thermalResistance.toFixed(3)} <span className="text-[9px] text-white/20 uppercase text-xs">K/W</span></span>
                </div>
              </div>

              {/* Quantum Coherence Radar */}
              {uiState.expQuantum && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest">Quantum Coherence</span>
                    <span className="text-[10px] font-mono text-white/60">{(Math.max(0, 100 - (uiState.currentTemp * 0.8))).toFixed(1)}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]"
                      style={{ width: `${Math.max(0, 100 - (uiState.currentTemp * 0.8))}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[9px] text-white/20 font-mono">
                    <span>DECOHERENCE RISK</span>
                    <span className={uiState.currentTemp > 80 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}>
                      {uiState.currentTemp > 80 ? 'CRITICAL' : 'STABLE'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Scientific Analysis Tools (New) */}
            <div className={`${isMobile ? 'w-full' : 'w-72'} flex flex-col gap-4 pb-4`}>
              <ElectronFlow
                clock={uiState.currentClock}
                temp={uiState.currentTemp}
                voltage={uiState.voltage}
              />
              <LogicGateArray
                load={uiState.currentLoad}
                tasks={uiState.fps} // Just using FPS as a proxy for "tasks" visuals
              />
              <PhaseSpace
                x={uiState.currentTemp}
                y={uiState.powerDraw}
                xLabel="TEMP (°C)"
                yLabel="POWER (W)"
                xMax={150}
                yMax={500}
                color="#f43f5e"
              />
              <SpectrumAnalyzer
                clock={uiState.currentClock}
                load={uiState.currentLoad}
              />
            </div>
          </section>

          {/* Footer Controls (Desktop Only) */}
          {!isMobile && (
            <footer className="absolute bottom-10 left-12 z-20 flex gap-6 pointer-events-none">
              <button
                onClick={() => setShowControls(!showControls)}
                className="flex items-center gap-3 text-white/30 hover:text-white transition-all group pointer-events-auto"
              >
                <Minimize2 size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[9px] font-bold uppercase tracking-[3px]">HUD CMD</span>
              </button>
            </footer>
          )}

        </main>

      </div>
    </div >
  );
}
