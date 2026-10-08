import React, { useState, useEffect } from 'react';
import { Component, Dependency, BenchmarkComparison } from '../types/architecture';
import { runBenchmarkComparison } from '../services/quboSolvers';
import { Cpu, Play, TrendingDown, RefreshCw, Info } from 'lucide-react';

interface BenchmarkTabProps {
  components: Component[];
  dependencies: Dependency[];
  numModules?: number;
}

export const BenchmarkTab: React.FC<BenchmarkTabProps> = ({
  components,
  dependencies,
  numModules = 4,
}) => {
  const [iterations, setIterations] = useState<number>(2500);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkComparison | null>(null);

  const executeBenchmark = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runBenchmarkComparison(components, dependencies, numModules, iterations);
      setBenchmarkResult(res);
      setIsRunning(false);
    }, 50);
  };

  useEffect(() => {
    executeBenchmark();
  }, [components, dependencies, numModules]);

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Control Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <span>QUBO Solver Benchmark &amp; Performance Analysis</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Head-to-head empirical comparison of Classical Simulated Annealing vs Quantum-Inspired Tunneling Annealing.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 text-xs text-zinc-400">
            <label htmlFor="iter-select" className="font-medium">
              Annealing Steps:
            </label>
            <select
              id="iter-select"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value, 10))}
              disabled={isRunning}
              className="bg-zinc-950 border border-zinc-700 rounded-md px-2.5 py-1 text-xs font-mono font-bold text-white cursor-pointer"
            >
              <option value={1000}>1,000 steps (Fast)</option>
              <option value={2500}>2,500 steps (Balanced)</option>
              <option value={5000}>5,000 steps (Deep)</option>
            </select>
          </div>

          <button
            onClick={executeBenchmark}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Running Solvers...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Re-run Benchmark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Honest Disclosure Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300">
          <h4 className="font-bold text-white mb-1">
            Honest Scientific Disclosure: No False Claims of "Quantum Advantage"
          </h4>
          <p className="leading-relaxed text-zinc-400">
            All benchmark metrics displayed below represent <strong>genuine, measured browser execution times</strong> and mathematical energy evaluations.
            Neither algorithm runs on physical cryogenic quantum processing units (QPUs). Solver B is a <em>quantum-inspired heuristic</em> that simulates transverse magnetic tunneling on your local CPU.
            As demonstrated by the data, classical simulated annealing frequently delivers equivalent or superior results on sparse data graph topologies without the multi-spin cluster overhead.
          </p>
        </div>
      </div>

      {benchmarkResult && (
        <div className="space-y-6">
          {/* Head-to-Head Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Solver A Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Solver A: Classical Simulated Annealing
                    </h3>
                    <span className="text-[11px] text-zinc-400">
                      Thermal noise with geometric cooling schedule
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  Browser V8
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">Final QUBO Energy Cost</span>
                  <strong className="text-base font-mono font-bold text-white block mt-0.5">
                    {benchmarkResult.classicalSA.finalEnergy}
                  </strong>
                  <span className="text-[10px] text-zinc-500">Lower is better</span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">Modularity Score (Q)</span>
                  <strong className="text-base font-mono font-bold text-indigo-400 block mt-0.5">
                    {benchmarkResult.classicalSA.modularityScore}
                  </strong>
                  <span className="text-[10px] text-zinc-500">Community structure</span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">Measured Run Time</span>
                  <strong className="text-base font-mono font-bold text-emerald-400 block mt-0.5">
                    {benchmarkResult.classicalSA.executionTimeMs} ms
                  </strong>
                  <span className="text-[10px] text-zinc-500">High-resolution timer</span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">Cross-Module Edges Cut</span>
                  <strong className="text-base font-mono font-bold text-white block mt-0.5">
                    {benchmarkResult.classicalSA.crossModuleEdgesCut} cuts
                  </strong>
                  <span className="text-[10px] text-zinc-500">Coupling minimization</span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 bg-black/60 p-2.5 rounded-lg border border-zinc-800">
                <strong>Mechanism:</strong> Metropolis-Hastings acceptance criteria: P = exp(-ΔE / T), cooling schedule T(k+1) = α · T(k).
              </div>
            </div>

            {/* Solver B Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center font-bold text-xs">
                    B
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Solver B: Quantum-Inspired Annealing
                    </h3>
                    <span className="text-[11px] text-zinc-400">
                      Transverse-field barrier penetration &amp; cluster tunneling
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  Browser V8
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">Final QUBO Energy Cost</span>
                  <strong className="text-base font-mono font-bold text-white block mt-0.5">
                    {benchmarkResult.quantumInspired.finalEnergy}
                  </strong>
                  <span className="text-[10px] text-zinc-500">Lower is better</span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">Modularity Score (Q)</span>
                  <strong className="text-base font-mono font-bold text-indigo-400 block mt-0.5">
                    {benchmarkResult.quantumInspired.modularityScore}
                  </strong>
                  <span className="text-[10px] text-zinc-500">Community structure</span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">Measured Run Time</span>
                  <strong className="text-base font-mono font-bold text-purple-400 block mt-0.5">
                    {benchmarkResult.quantumInspired.executionTimeMs} ms
                  </strong>
                  <span className="text-[10px] text-zinc-500">High-resolution timer</span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">Cross-Module Edges Cut</span>
                  <strong className="text-base font-mono font-bold text-white block mt-0.5">
                    {benchmarkResult.quantumInspired.crossModuleEdgesCut} cuts
                  </strong>
                  <span className="text-[10px] text-zinc-500">Coupling minimization</span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 bg-black/60 p-2.5 rounded-lg border border-zinc-800">
                <strong>Mechanism:</strong> Simulates transverse magnetic field decay Γ(t) = Γ₀(1 - t/T)², tunneling through tall narrow energy barriers via cluster spin-flips.
              </div>
            </div>
          </div>

          {/* Convergence Plot */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-indigo-400" />
                  <span>Energy Descent &amp; Convergence Trajectory</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Real-time QUBO Hamiltonian minimization across {iterations.toLocaleString()} iterations.
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-3 h-0.5 bg-sky-400 inline-block" />
                  Classical SA
                </span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-3 h-0.5 bg-purple-400 inline-block" />
                  Quantum-Inspired QIA
                </span>
              </div>
            </div>

            {/* Dark SVG Chart */}
            <div className="h-60 w-full relative bg-black rounded-lg p-2 border border-zinc-800">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
                <line x1="0" y1="40" x2="800" y2="40" stroke="#18181b" strokeWidth="1" />
                <line x1="0" y1="90" x2="800" y2="90" stroke="#18181b" strokeWidth="1" />
                <line x1="0" y1="140" x2="800" y2="140" stroke="#18181b" strokeWidth="1" />
                <line x1="0" y1="190" x2="800" y2="190" stroke="#27272a" strokeWidth="1" />

                {(() => {
                  const saCurve = benchmarkResult.classicalSA.convergenceCurve;
                  const qiaCurve = benchmarkResult.quantumInspired.convergenceCurve;

                  const allEnergies = [
                    ...saCurve.map((p) => p.energy),
                    ...qiaCurve.map((p) => p.energy),
                  ];
                  const minE = Math.min(...allEnergies);
                  const maxE = Math.max(...allEnergies, minE + 1);

                  const scaleY = (val: number) => {
                    const normalized = (val - minE) / (maxE - minE);
                    return 180 - normalized * 150;
                  };

                  const scaleX = (it: number) => (it / iterations) * 800;

                  const saPath = saCurve
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.iteration)} ${scaleY(p.energy)}`)
                    .join(' ');

                  const qiaPath = qiaCurve
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.iteration)} ${scaleY(p.energy)}`)
                    .join(' ');

                  return (
                    <g>
                      <path d={saPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                      <path d={qiaPath} fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
                    </g>
                  );
                })()}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 px-1 font-mono">
              <span>Step 0 (Random initialization)</span>
              <span>Step {Math.round(iterations / 2)}</span>
              <span>Step {iterations} (Ground state search complete)</span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2">
              Empirical Conclusion &amp; Modularity Analysis
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              {benchmarkResult.analysisText}
            </p>
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg text-xs text-emerald-200 flex items-center justify-between">
              <div>
                <strong>Benchmark Leader:</strong>{' '}
                <span className="font-semibold text-emerald-400">{benchmarkResult.winner}</span>
              </div>
              <span className="text-[11px] text-emerald-300">
                Modularity: {Math.max(benchmarkResult.classicalSA.modularityScore, benchmarkResult.quantumInspired.modularityScore)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
