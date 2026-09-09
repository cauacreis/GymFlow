"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  GraduationCap,
  Dumbbell,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  ArrowRightLeft,
  DollarSign,
  FileText,
  Target,
  LogOut,
  Save,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getCurrentUser,
  saveUserProfile,
  switchUserRole,
  UserProfile,
  UserRole,
} from "@/lib/auth-store";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export function UserProfileModal({ isOpen, onClose, onOpenAuth }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>(() => getCurrentUser());
  const [activeRole, setActiveRole] = useState<UserRole>(profile.activeRole);

  // Campos de formulário
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || "");
  const [goal, setGoal] = useState<UserProfile["goal"]>(profile.goal || "Hipertrofia");
  const [cref, setCref] = useState(profile.cref || "");
  const [specialty, setSpecialty] = useState(profile.specialty || "");
  const [hourlyRate, setHourlyRate] = useState<number>(profile.hourlyRate || 75);
  const [bio, setBio] = useState(profile.bio || "");

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getCurrentUser();
      setProfile(current);
      setActiveRole(current.activeRole);
      setName(current.name);
      setEmail(current.email);
      setPhone(current.phone || "");
      setGoal(current.goal || "Hipertrofia");
      setCref(current.cref || "");
      setSpecialty(current.specialty || "");
      setHourlyRate(current.hourlyRate || 75);
      setBio(current.bio || "");
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Alternar papel Aluno ⇄ Professor
  const handleSwitchRole = (newRole: UserRole) => {
    triggerHaptic("medium");
    setActiveRole(newRole);
    const updated = switchUserRole(newRole);
    setProfile(updated);
  };

  // Salvar edições de perfil
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic("success");

    const updated = saveUserProfile({
      name,
      email,
      phone,
      activeRole,
      goal,
      cref,
      specialty,
      hourlyRate,
      bio,
    });

    setProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const isCoach = activeRole === "coach";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center border font-black text-sm ${
                isCoach
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              }`}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white leading-none">{profile.name}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isCoach
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {isCoach ? "Professor" : "Aluno"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">{profile.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* CARD DE ALTERNÂNCIA DE MODO (TREINAR & SER TREINADO) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-white/[0.1] shadow-lg relative overflow-hidden">
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" /> Papel na Plataforma
                </span>
                <h3 className="text-xs font-black text-white mt-0.5">
                  Treine ou Atenda Alunos com a Mesma Conta
                </h3>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
              Você pode prescrever treinos como <strong>Professor</strong> e também ter sua própria ficha pessoal para treinar como <strong>Aluno</strong>. Alterne com 1 toque:
            </p>

            {/* Segmented Control / Seletor de Papel */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => handleSwitchRole("student")}
                className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  !isCoach
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/25"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Modo Aluno</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("coach")}
                className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  isCoach
                    ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Modo Professor</span>
              </button>
            </div>
          </div>

          {/* Feedback de Salvo com Sucesso */}
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dados do perfil atualizados com sucesso!</span>
            </div>
          )}

          {/* Dados Gerais da Conta */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" /> Informações Pessoais
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  WhatsApp / Telefone de Contato
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 11991234567"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Matrícula Digital</label>
                <input
                  type="text"
                  disabled
                  value={profile.matricula || "GF-84920"}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950/50 border border-white/[0.04] text-xs text-zinc-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* DADOS ESPECÍFICOS: MODO PROFESSOR */}
          {isCoach && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> Perfil Profissional (Professor)
                </h4>
                <span className="text-[9px] text-amber-400 font-mono">Visível no Marketplace</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Registro CREF</label>
                  <input
                    type="text"
                    value={cref}
                    onChange={(e) => setCref(e.target.value)}
                    placeholder="Ex: 08412-SP"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Especialidade Principal
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex: Hipertrofia & Força"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Valor da Hora / Diária Presencial (R$)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">R$</span>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Biografia / Apresentação Profissional
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte sobre sua metodologia de treino e experiência..."
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DADOS ESPECÍFICOS: MODO ALUNO */}
          {!isCoach && (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> Meu Objetivo de Treino (Aluno)
              </h4>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Meta Atual</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as UserProfile["goal"])}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Hipertrofia">Hipertrofia & Ganho de Massa Muscular</option>
                  <option value="Emagrecimento">Emagrecimento & Definição Corporal</option>
                  <option value="Força & Performance">Força Pura & Recordes de Carga (PRs)</option>
                  <option value="Condicionamento Geral">Condicionamento Físico & Saúde</option>
                </select>
              </div>
            </div>
          )}

          {/* Botão de Salvar Alterações */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar Dados da Conta</span>
          </button>
        </form>

        {/* Rodapé com Trocar Conta */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-zinc-900/60 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              onClose();
              if (onOpenAuth) onOpenAuth();
            }}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Entrar com Outro Usuário</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
