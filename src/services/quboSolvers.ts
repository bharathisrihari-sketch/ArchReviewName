import { Component, Dependency, SolverRunStats, BenchmarkComparison } from '../types/architecture';

export interface QUBOProblem {
  nodes: string[];
  nodeIndex: Map<string, number>;
  edges: { u: number; v: number; weight: number }[];
  adjacency: Map<number, { neighbor: number; weight: number }[]>;
  totalEdgeWeight: number;
  nodeDegrees: number[];
  numModules: number;
  balanceLambda: number;
}

export function buildQUBOProblem(
  components: Component[],
  dependencies: Dependency[],
  numModules = 4
): QUBOProblem {
  const nodeIndex = new Map<string, number>();
  const nodes = components.map((c, idx) => {
    nodeIndex.set(c.id, idx);
    nodeIndex.set(c.name, idx);
    return c.id;
  });

  const n = nodes.length;
  const adjacency = new Map<number, { neighbor: number; weight: number }[]>();
  for (let i = 0; i < n; i++) {
    adjacency.set(i, []);
  }

  const edges: { u: number; v: number; weight: number }[] = [];
  let totalEdgeWeight = 0;
  const nodeDegrees = new Array(n).fill(0);

  for (const dep of dependencies) {
    const u = nodeIndex.get(dep.source);
    const v = nodeIndex.get(dep.target);
    if (u !== undefined && v !== undefined && u !== v) {
      // Weight derived from confidence (higher confidence = stronger bond)
      const weight = Math.max(0.2, dep.confidence ?? 0.8);
      edges.push({ u, v, weight });
      adjacency.get(u)!.push({ neighbor: v, weight });
      adjacency.get(v)!.push({ neighbor: u, weight });
      nodeDegrees[u] += weight;
      nodeDegrees[v] += weight;
      totalEdgeWeight += weight;
    }
  }

  // Dynamic balance penalty scaling
  const avgEdgeWeightPerNode = totalEdgeWeight / Math.max(1, n);
  const balanceLambda = Math.max(0.15, avgEdgeWeightPerNode * 0.35);

  return {
    nodes,
    nodeIndex,
    edges,
    adjacency,
    totalEdgeWeight,
    nodeDegrees,
    numModules,
    balanceLambda,
  };
}

/**
 * Calculates QUBO Energy: H_cut + lambda * H_balance
 */
export function calculateQUBOEnergy(
  state: number[],
  problem: QUBOProblem
): { energy: number; cutCost: number; balanceCost: number; cutsCount: number } {
  let cutCost = 0;
  let cutsCount = 0;

  for (const edge of problem.edges) {
    if (state[edge.u] !== state[edge.v]) {
      cutCost += edge.weight;
      cutsCount++;
    }
  }

  const targetSize = problem.nodes.length / problem.numModules;
  const counts = new Array(problem.numModules).fill(0);
  for (const mod of state) {
    counts[mod]++;
  }

  let varianceSum = 0;
  for (let m = 0; m < problem.numModules; m++) {
    const diff = counts[m] - targetSize;
    varianceSum += diff * diff;
  }

  const balanceCost = problem.balanceLambda * varianceSum;
  return {
    energy: cutCost + balanceCost,
    cutCost,
    balanceCost,
    cutsCount,
  };
}

/**
 * Calculates standard Newman-Girvan Modularity Q
 */
export function calculateModularity(state: number[], problem: QUBOProblem): number {
  const m2 = problem.totalEdgeWeight * 2;
  if (m2 === 0) return 0;

  let q = 0;
  for (const edge of problem.edges) {
    if (state[edge.u] === state[edge.v]) {
      const expected = (problem.nodeDegrees[edge.u] * problem.nodeDegrees[edge.v]) / m2;
      q += (edge.weight - expected);
    }
  }

  return Number((q / m2).toFixed(4));
}

/**
 * Computes standard deviation of module sizes
 */
function getModuleBalanceStdDev(state: number[], numModules: number): number {
  const counts = new Array(numModules).fill(0);
  for (const mod of state) counts[mod]++;
  const mean = state.length / numModules;
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / numModules;
  return Number(Math.sqrt(variance).toFixed(2));
}

/**
 * SOLVER A: Classical Simulated Annealing (SA)
 */
export function runClassicalSimulatedAnnealing(
  problem: QUBOProblem,
  iterations = 2500,
  initialTemp = 6.0,
  coolingRate = 0.996
): SolverRunStats {
  const startTime = performance.now();
  const n = problem.nodes.length;
  const K = problem.numModules;

  // Initial random partition with round-robin initialization for baseline balance
  const state = new Array(n).fill(0).map((_, i) => i % K);
  let bestState = [...state];

  let currentEval = calculateQUBOEnergy(state, problem);
  let bestEnergy = currentEval.energy;
  let temperature = initialTemp;

  const convergenceCurve: { iteration: number; energy: number }[] = [
    { iteration: 0, energy: Number(currentEval.energy.toFixed(3)) },
  ];

  for (let it = 1; it <= iterations; it++) {
    // Propose moving a random node to a random different module
    const nodeToMove = Math.floor(Math.random() * n);
    const oldModule = state[nodeToMove];
    let newModule = Math.floor(Math.random() * K);
    if (newModule === oldModule) {
      newModule = (oldModule + 1) % K;
    }

    state[nodeToMove] = newModule;
    const newEval = calculateQUBOEnergy(state, problem);
    const deltaE = newEval.energy - currentEval.energy;

    // Metropolis acceptance criterion
    let accept = false;
    if (deltaE < 0) {
      accept = true;
    } else {
      const p = Math.exp(-deltaE / Math.max(0.001, temperature));
      if (Math.random() < p) {
        accept = true;
      }
    }

    if (accept) {
      currentEval = newEval;
      if (newEval.energy < bestEnergy) {
        bestEnergy = newEval.energy;
        bestState = [...state];
      }
    } else {
      state[nodeToMove] = oldModule; // Revert
    }

    // Cooling schedule
    temperature *= coolingRate;
    if (temperature < 0.01) temperature = 0.01;

    // Record sample points for convergence curve
    if (it % 50 === 0 || it === iterations) {
      convergenceCurve.push({
        iteration: it,
        energy: Number(currentEval.energy.toFixed(3)),
      });
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
  const finalEval = calculateQUBOEnergy(bestState, problem);
  const modularity = calculateModularity(bestState, problem);
  const balanceStdDev = getModuleBalanceStdDev(bestState, K);

  const partitions: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    partitions[problem.nodes[i]] = bestState[i];
  }

  return {
    solverName: 'Classical Simulated Annealing (SA)',
    executionTimeMs,
    finalEnergy: Number(finalEval.energy.toFixed(3)),
    modularityScore: modularity,
    crossModuleEdgesCut: finalEval.cutsCount,
    moduleBalanceStdDev: balanceStdDev,
    iterations,
    convergenceCurve,
    partitions,
  };
}

/**
 * SOLVER B: Quantum-Inspired Annealing (QIA)
 * Emulates a transverse-field Ising model with quantum tunneling probability
 * and cooperative multi-spin flip transitions.
 */
export function runQuantumInspiredAnnealing(
  problem: QUBOProblem,
  iterations = 2500,
  initialTransverseField = 4.5,
  initialThermalTemp = 2.0
): SolverRunStats {
  const startTime = performance.now();
  const n = problem.nodes.length;
  const K = problem.numModules;

  // Initial state
  const state = new Array(n).fill(0).map((_, i) => i % K);
  let bestState = [...state];

  let currentEval = calculateQUBOEnergy(state, problem);
  let bestEnergy = currentEval.energy;

  const convergenceCurve: { iteration: number; energy: number }[] = [
    { iteration: 0, energy: Number(currentEval.energy.toFixed(3)) },
  ];

  for (let it = 1; it <= iterations; it++) {
    const progress = it / iterations;
    // Transverse field decay schedule: Gamma(t) decays quadratically to freeze quantum tunneling
    const gamma = initialTransverseField * Math.pow(1 - progress, 2);
    // Classical thermal noise cools geometrically
    const temp = Math.max(0.005, initialThermalTemp * Math.pow(0.995, it));

    // Quantum tunneling effective temperature: combines thermal barrier jumping with tunneling through tall narrow barriers
    const effectiveFluctuation = Math.sqrt(temp * temp + gamma * gamma);

    // Stochastic strategy: with probability proportional to transverse field,
    // execute a cooperative 2-spin cluster tunneling move along a high-confidence graph edge
    const isClusterMove = Math.random() < (gamma / (initialTransverseField * 2)) && problem.edges.length > 0;

    let nodeToMove = Math.floor(Math.random() * n);
    let oldModule = state[nodeToMove];
    let newModule = Math.floor(Math.random() * K);
    if (newModule === oldModule) newModule = (oldModule + 1) % K;

    let partnerNode: number | null = null;
    let oldPartnerModule: number | null = null;

    if (isClusterMove) {
      // Pick an incident edge neighbor to tunnel together
      const neighbors = problem.adjacency.get(nodeToMove);
      if (neighbors && neighbors.length > 0) {
        partnerNode = neighbors[Math.floor(Math.random() * neighbors.length)].neighbor;
        oldPartnerModule = state[partnerNode];
        // Co-flip into the proposed target module
        state[nodeToMove] = newModule;
        state[partnerNode] = newModule;
      } else {
        state[nodeToMove] = newModule;
      }
    } else {
      state[nodeToMove] = newModule;
    }

    const newEval = calculateQUBOEnergy(state, problem);
    const deltaE = newEval.energy - currentEval.energy;

    let accept = false;
    if (deltaE < 0) {
      accept = true;
    } else {
      // Quantum tunneling transmission probability: P ~ exp(- Delta E / effectiveFluctuation)
      const pTunnel = Math.exp(-deltaE / Math.max(0.001, effectiveFluctuation));
      if (Math.random() < pTunnel) {
        accept = true;
      }
    }

    if (accept) {
      currentEval = newEval;
      if (newEval.energy < bestEnergy) {
        bestEnergy = newEval.energy;
        bestState = [...state];
      }
    } else {
      // Revert single or cluster move
      state[nodeToMove] = oldModule;
      if (partnerNode !== null && oldPartnerModule !== null) {
        state[partnerNode] = oldPartnerModule;
      }
    }

    if (it % 50 === 0 || it === iterations) {
      convergenceCurve.push({
        iteration: it,
        energy: Number(currentEval.energy.toFixed(3)),
      });
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
  const finalEval = calculateQUBOEnergy(bestState, problem);
  const modularity = calculateModularity(bestState, problem);
  const balanceStdDev = getModuleBalanceStdDev(bestState, K);

  const partitions: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    partitions[problem.nodes[i]] = bestState[i];
  }

  return {
    solverName: 'Quantum-Inspired Annealing (QIA)',
    executionTimeMs,
    finalEnergy: Number(finalEval.energy.toFixed(3)),
    modularityScore: modularity,
    crossModuleEdgesCut: finalEval.cutsCount,
    moduleBalanceStdDev: balanceStdDev,
    iterations,
    convergenceCurve,
    partitions,
  };
}

/**
 * Head-to-Head Benchmark Runner
 */
export function runBenchmarkComparison(
  components: Component[],
  dependencies: Dependency[],
  numModules = 4,
  iterations = 2500
): BenchmarkComparison {
  const problem = buildQUBOProblem(components, dependencies, numModules);

  const saStats = runClassicalSimulatedAnnealing(problem, iterations);
  const qiaStats = runQuantumInspiredAnnealing(problem, iterations);

  let winner = 'Classical Simulated Annealing';
  if (qiaStats.finalEnergy < saStats.finalEnergy - 0.05) {
    winner = 'Quantum-Inspired Annealing';
  } else if (Math.abs(qiaStats.finalEnergy - saStats.finalEnergy) <= 0.05) {
    winner = saStats.executionTimeMs <= qiaStats.executionTimeMs
      ? 'Classical Simulated Annealing (Faster Runtime)'
      : 'Quantum-Inspired Annealing (Equivalent Energy)';
  }

  const energyDelta = (saStats.finalEnergy - qiaStats.finalEnergy).toFixed(3);
  const timeDelta = (qiaStats.executionTimeMs - saStats.executionTimeMs).toFixed(1);

  const analysisText = `Benchmark executed across ${problem.nodes.length} components and ${problem.edges.length} active dependency edges. ` +
    `Classical Simulated Annealing completed in ${saStats.executionTimeMs}ms with final energy ${saStats.finalEnergy} and modularity Q=${saStats.modularityScore}. ` +
    `Quantum-Inspired Annealing completed in ${qiaStats.executionTimeMs}ms with final energy ${qiaStats.finalEnergy} and modularity Q=${qiaStats.modularityScore}. ` +
    `Honest Assessment: Both algorithms execute purely on your local browser CPU. Quantum-inspired simulated annealing leverages transverse-field tunneling heuristics to escape narrow barriers, while classical simulated annealing avoids cluster overhead and delivers rapid convergence on sparse data pipeline topologies.`;

  return {
    classicalSA: saStats,
    quantumInspired: qiaStats,
    problemSize: {
      nodes: problem.nodes.length,
      edges: problem.edges.length,
      numModules,
    },
    winner,
    analysisText,
  };
}
