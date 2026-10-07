import React, { useState, useEffect } from 'react';
import { Component, Dependency, BenchmarkComparison } from '../types/architecture';
import { runBenchmarkComparison } from '../services/quboSolvers';
import { Cpu, Play, CheckCircle2, TrendingDown, Clock, ShieldAlert, Binary, RefreshCw, BarChart2, Info } from 'lucide-react';

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

  // Run benchmark on load or when dependencies change
  const executeBenchmark = () => {
    setIsRunning(true);
    // Allow UI to update before blocking CPU calculation
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
    <div className="space-y-6">
      {/* Benchmark Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-600" />
            <span>QUBO Solver Benchmark & Performance Analysis</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Head-to-head empirical comparison of Classical Simulated Annealing vs Quantum-Inspired Tunneling Annealing.
          </p>
        </div>

        {/* Iterations selector & Run button */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <label htmlFor="iter-select" className="font-medium">
              Annealing Steps:
            </label>
            <select
              id="iter-select"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value, 10))}
              disabled={isRunning}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
            >
              <option value={1000}>1,000 steps (Fast)</option>
              <option value={2500}>2,500 steps (Balanced)</option>
              <option value={5000}>5,000 steps (Deep)</option>
            </select>
          </div>

          <button
            onClick={executeBenchmark}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
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

      {/* Honest Scientific Disclaimer Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700">
          <h4 className="font-bold text-slate-900 mb-1">
            Honest Scientific Disclosure: No False Claims of "Quantum Advantage"
          </h4>
          <p className="leading-relaxed">
            All benchmark metrics displayed below represent <strong>genuine, measured browser execution times</strong> and mathematical energy evaluations.
            Neither algorithm runs on physical cryogenic quantum processing units (QPUs). Solver B is a <em>quantum-inspired heuristic</em> that simulates transverse magnetic tunneling on your local CPU.
            As demonstrated by the data, classical simulated annealing frequently delivers equivalent or superior results on sparse data graph topologies without the multi-spin cluster overhead.
          </p>
        </div>
      </div>

      {benchmarkResult && (
        <div className="space-y-6">
          {/* Head-to-Head Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Solver A Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Solver A: Classical Simulated Annealing
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Thermal noise with geometric cooling schedule
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  Browser Engine
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Final QUBO Energy Cost</span>
                  <strong className="text-base font-mono font-bold text-slate-900 block mt-0.5">
                    {benchmarkResult.classicalSA.finalEnergy}
                  </strong>
                  <span className="text-[10px] text-slate-400">Lower is better</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Modularity Score (Q)</span>
                  <strong className="text-base font-mono font-bold text-indigo-700 block mt-0.5">
                    {benchmarkResult.classicalSA.modularityScore}
                  </strong>
                  <span className="text-[10px] text-slate-400">Higher community cohesion</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Real Measured Run Time</span>
                  <strong className="text-base font-mono font-bold text-emerald-700 block mt-0.5">
                    {benchmarkResult.classicalSA.executionTimeMs} ms
                  </strong>
                  <span className="text-[10px] text-slate-400">High-resolution timer</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Cross-Module Edges Cut</span>
                  <strong className="text-base font-mono font-bold text-slate-900 block mt-0.5">
                    {benchmarkResult.classicalSA.crossModuleEdgesCut} cuts
                  </strong>
                  <span className="text-[10px] text-slate-400">Minimizes inter-module coupling</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-sky-50/50 p-2.5 rounded-lg border border-sky-100">
                <strong>Mechanism:</strong> Employs Metropolis-Hastings acceptance criteria: P = exp(-ΔE / T), cooling schedule T(k+1) = α · T(k).
              </div>
            </div>

            {/* Solver B Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                    B
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Solver B: Quantum-Inspired Annealing
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Transverse-field barrier penetration & cluster tunneling
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  Browser Engine
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Final QUBO Energy Cost</span>
                  <strong className="text-base font-mono font-bold text-slate-900 block mt-0.5">
                    {benchmarkResult.quantumInspired.finalEnergy}
                  </strong>
                  <span className="text-[10px] text-slate-400">Lower is better</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Modularity Score (Q)</span>
                  <strong className="text-base font-mono font-bold text-indigo-700 block mt-0.5">
                    {benchmarkResult.quantumInspired.modularityScore}
                  </strong>
                  <span className="text-[10px] text-slate-400">Higher community cohesion</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Real Measured Run Time</span>
                  <strong className="text-base font-mono font-bold text-purple-700 block mt-0.5">
                    {benchmarkResult.quantumInspired.executionTimeMs} ms
                  </strong>
                  <span className="text-[10px] text-slate-400">High-resolution timer</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Cross-Module Edges Cut</span>
                  <strong className="text-base font-mono font-bold text-slate-900 block mt-0.5">
                    {benchmarkResult.quantumInspired.crossModuleEdgesCut} cuts
                  </strong>
                  <span className="text-[10px] text-slate-400">Minimizes inter-module coupling</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
                <strong>Mechanism:</strong> Simulates transverse magnetic field decay $\Gamma(t) = \Gamma_0(1 - t/T)^2$, tunneling through tall narrow energy barriers via cluster spin-flips.
              </div>
            </div>
          </div>

          {/* Convergence Energy Plot (Descent Curve) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-indigo-600" />
                  <span>Energy Descent & Convergence Trajectory</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time QUBO Hamiltonian minimization across {iterations.toLocaleString()} iterations.
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-sky-700">
                  <span className="w-3 h-0.5 bg-sky-600 inline-block" />
                  Classical SA
                </span>
                <span className="flex items-center gap-1.5 text-purple-700">
                  <span className="w-3 h-0.5 bg-purple-600 inline-block" />
                  Quantum-Inspired QIA
                </span>
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="h-60 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="40" x2="800" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="90" x2="800" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="140" x2="800" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="190" x2="800" y2="190" stroke="#e2e8f0" strokeWidth="1" />

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
                    return 180 - normalized * 150; // Inverted for SVG
                  };

                  const scaleX = (it: number) => {
                    return (it / iterations) * 800;
                  };

                  const saPath = saCurve
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.iteration)} ${scaleY(p.energy)}`)
                    .join(' ');

                  const qiaPath = qiaCurve
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.iteration)} ${scaleY(p.energy)}`)
                    .join(' ');

                  return (
                    <g>
                      {/* Classical SA Path */}
                      <path
                        d={saPath}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Quantum-Inspired QIA Path */}
                      <path
                        d={qiaPath}
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="4 2"
                      />
                    </g>
                  );
                })()}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1 font-mono">
              <span>Step 0 (Random initial assignment)</span>
              <span>Step {Math.round(iterations / 2)}</span>
              <span>Step {iterations} (Ground state search complete)</span>
            </div>
          </div>

          {/* Benchmark Evaluation Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Empirical Conclusion & Modularity Breakdown
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {benchmarkResult.analysisText}
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 flex items-center justify-between">
              <div>
                <strong>Benchmark Leader for Current Graph:</strong>{' '}
                <span className="font-semibold text-emerald-800">{benchmarkResult.winner}</span>
              </div>
              <span className="text-[11px] text-emerald-700">
                Modularity: {Math.max(benchmarkResult.classicalSA.modularityScore, benchmarkResult.quantumInspired.modularityScore)} (Good community separation)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
