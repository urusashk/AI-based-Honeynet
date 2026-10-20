import React, { useState } from 'react';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import {
  Server,
  Terminal,
  Database,
  Globe,
  Cpu,
  ShieldAlert,
  ArrowRight,
  Radio,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Box,
  Hash,
  ExternalLink
} from 'lucide-react';

export default function HoneynetPage() {
  const { honeypots, isDemoStreaming } = useHoneynet();
  const [selectedNode, setSelectedNode] = useState(honeypots[0]);

  // Nodes for the topology
  const attackerNode = {
    id: 'kali-node',
    name: 'Kali Linux VM',
    role: 'Simulated Adversary / Red Team Targeter',
    ip: '192.0.2.45 (Demo Subnet)',
    status: 'Active Transmission',
    environment: 'Host VM: VirtualBox / VMware Workstation',
    tools: ['Nmap', 'Hydra', 'Nikto', 'sqlmap', 'Metasploit Decoys']
  };

  const getServiceIcon = (name) => {
    if (name.includes('SSH')) return Terminal;
    if (name.includes('Web')) return Globe;
    if (name.includes('Database')) return Database;
    return Cpu;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Decoy Honeynet Topology & Service Mesh"
        subtitle="Visual map of simulated adversary probe vectors, container decoys, and AI ingestion engine"
      />

      <div className="p-6 space-y-6">
        {/* Architecture Notice Banner */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-slate-200 block text-sm">
                Target Architecture: Ubuntu Server Decoy Network
              </span>
              <p className="mt-1 text-slate-400 leading-relaxed">
                Decoy honeypot services are designed to run as isolated Docker containers within a bridge network (`172.20.0.0/16`) on an Ubuntu Server virtual machine. Kali Linux operates on an external subnet simulating adversarial recon and exploit attempts. All simulated logs stream into the AI Analysis Engine.
              </p>
              <div className="mt-2 flex items-center gap-4 font-mono text-[11px] text-emerald-400">
                <span>&bull; Emulation: Active</span>
                <span>&bull; Isolation: Docker Bridge Sandbox</span>
                <span>&bull; No live target network connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Honeynet Interactive Topology Diagram */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm relative overflow-hidden soc-grid-bg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                Live Honeynet Network Map
              </h2>
              <p className="text-xs text-slate-400">
                Click any node to inspect container specifications, port mappings, and event telemetry
              </p>
            </div>
            <span className="text-[11px] font-mono bg-slate-800 px-3 py-1 rounded text-slate-300 border border-slate-700">
              Subnet: 172.20.0.0/16 (Decoy Mesh)
            </span>
          </div>

          {/* Topology Graph Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-4">
            {/* Left: Adversary Node (Kali Linux) */}
            <div className="lg:col-span-3 flex flex-col items-center">
              <div className="text-[11px] font-mono text-red-400 uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" /> Adversary Zone
              </div>
              <div
                onClick={() => setSelectedNode(attackerNode)}
                className={`w-full cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedNode.id === 'kali-node'
                    ? 'border-red-500 bg-red-950/20 shadow-lg shadow-red-950/40'
                    : 'border-red-500/40 bg-slate-950/80 hover:border-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
                    KALI
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                    SIMULATED
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{attackerNode.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{attackerNode.ip}</p>
                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Attack Vectors:</span>
                  <span className="font-mono text-red-400 font-bold">SYN, SQLi, SSH</span>
                </div>
              </div>
            </div>

            {/* Middle: Attack Vectors Flow Arrow */}
            <div className="lg:col-span-1 hidden lg:flex flex-col items-center justify-center text-slate-600">
              <div className="h-0.5 w-full bg-gradient-to-r from-red-500/60 via-amber-500/60 to-emerald-500/60 relative">
                {isDemoStreaming && (
                  <div className="absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2 whitespace-nowrap">
                Probes / Exploits
              </span>
            </div>

            {/* Middle-Right: Decoy Containers (Honeypots) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5" /> Docker Decoy Network (Ubuntu Server)
              </div>
              <div className="grid grid-cols-1 gap-3">
                {honeypots.slice(0, 3).map((hp) => {
                  const Icon = getServiceIcon(hp.name);
                  const isSelected = selectedNode.id === hp.id;

                  return (
                    <div
                      key={hp.id}
                      onClick={() => setSelectedNode(hp)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/30'
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                            {hp.name}
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              :{hp.port}
                            </span>
                          </h4>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {hp.container} ({hp.internalIp})
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-slate-100 block">
                          {hp.eventCount} evts
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {hp.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: AI Analysis Engine */}
            <div className="lg:col-span-3 flex flex-col items-center">
              <div className="text-[11px] font-mono text-purple-400 uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> Analysis & Triage Core
              </div>
              <div
                onClick={() => setSelectedNode(honeypots[3])}
                className={`w-full cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedNode.id === honeypots[3].id
                    ? 'border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-950/40'
                    : 'border-purple-500/40 bg-slate-950/80 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    INGESTING
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{honeypots[3].name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {honeypots[3].container} ({honeypots[3].internalIp})
                </p>
                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Classified Logs:</span>
                  <span className="font-mono text-purple-400 font-bold">
                    {honeypots[3].eventCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Node Inspector Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  {selectedNode.name}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {selectedNode.status || 'Active'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Identifier: {selectedNode.id} &bull; Service: {selectedNode.service || selectedNode.role}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Last Pulse: {selectedNode.lastActivity || 'Live'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">Decoy Emulation Type</span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {selectedNode.decoyType || 'Adversary Simulation VM'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">Docker Image / Base</span>
              <span className="text-xs font-mono font-bold text-slate-200 truncate block">
                {selectedNode.dockerImage || selectedNode.environment}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">Internal Network IP & Port</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {selectedNode.internalIp ? `${selectedNode.internalIp}:${selectedNode.port}` : selectedNode.ip}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">Recorded Events</span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {selectedNode.eventCount ? `${selectedNode.eventCount} Trapped Invocations` : 'Active Traffic Source'}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <h4 className="text-xs font-bold text-slate-300 mb-1">Service Description & SOC Role</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedNode.description ||
                'This virtual machine node serves as the simulated adversary running Kali Linux. When conducting college laboratory demonstrations, automated or manual commands executed here trigger inbound traffic that is caught by the honeypot mesh containers without impacting any production network.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
