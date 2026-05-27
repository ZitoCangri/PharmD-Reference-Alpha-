/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Pill, Activity, ShieldCheck, Cpu, LogOut, User } from "lucide-react";

export interface HeaderProps {
  user: any | null;
  onLogin: () => void;
  onLogout: () => void;
  isSandbox?: boolean;
}

export function Header({ user, onLogin, onLogout, isSandbox = false }: HeaderProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header id="clinical-header" className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs z-10 select-none">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Core Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-xs font-sans">
            Rx
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 font-sans">
                PharmacoLogic <span className="text-blue-600 font-extrabold uppercase text-[10px] bg-blue-50 border border-blue-200/50 px-1.5 py-0.5 rounded">PRO</span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-sans font-medium uppercase tracking-wider">
              Board-Certified Decision Support
            </p>
          </div>
        </div>

        {/* Real-time clinical metadata indicators + Auth Control */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-200">
            <Cpu className="w-3 h-3 text-blue-500" />
            <span>RxNorm: ACTIVE</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-200">
            <Activity className="w-3 h-3 text-blue-600" />
            <span>FDA API: LIVE</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] bg-slate-50 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-medium whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{time || "2026-05-26 15:32:49 UTC"}</span>
          </div>

          {/* Physician Account Section */}
          <div className="flex items-center border-l border-slate-200 pl-3 md:pl-4 ml-1 md:ml-1.5 gap-2.5">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-slate-800 leading-none">
                    {user.displayName || "Clinical Staff"}
                  </p>
                  <p className="text-[9px] text-emerald-600 font-mono font-bold uppercase leading-none mt-0.5">
                    {isSandbox ? "Sandbox Staff" : "Verified Practice"}
                  </p>
                </div>
                <img
                  referrerPolicy="no-referrer"
                  src={user.photoURL || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces"}
                  alt={user.displayName || "User"}
                  className="w-8 h-8 rounded-full border border-blue-150 shadow-3xs"
                />
                <button
                  onClick={onLogout}
                  title="Logout Profile"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold font-sans tracking-wide shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-blue-105" />
                Staff Sign-In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
