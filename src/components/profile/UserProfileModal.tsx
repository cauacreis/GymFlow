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
  Instagram,
  MapPin,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getCurrentUser,
  saveUserProfile,
  switchUserRole,
  UserProfile,
  UserRole,
} from "@/lib/auth-store";
import { updateCoachPublicProfile } from "@/lib/booking-store";
import { AvatarUpload } from "./AvatarUpload";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export function UserProfileModal({ isOpen, onClose, onOpenAuth }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>(() => getCurrentUser());
  const [activeRole, setActiveRole] = useState<UserRole>(profile.activeRole);

  // Foto de Perfil
  const [avatarUrl, setAvatarUrl] = useState(
    profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
  );

  // Campos de formulário
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || "");
  const [goal, setGoal] = useState<UserProfile["goal"]>(profile.goal || "Hipertrofia");
  const [cref, setCref] = useState(profile.cref || "08412-SP");
  const [specialty, setSpecialty] = useState(profile.specialty || "Hipertrofia & Biomecânica");
  const [bio, setBio] = useState(profile.bio || "");
  const [instagram, setInstagram] = useState(profile.instagram || "@rodrigo.gymflow");
  const [location, setLocation] = useState(profile.location || "Salão Principal • Musculação");

  // Preços do Personal
  const [dailyPrice, setDailyPrice] = useState(profile.pricing?.dailySession || 75);
  const [weeklyPrice, setWeeklyPrice] = useState(profile.pricing?.weeklyPlan || 190);
  const [monthlyPrice, setMonthlyPrice] = useState(profile.pricing?.monthlyPlan || 580);

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getCurrentUser();
      setProfile(current);
      setActiveRole(current.activeRole);
      setAvatarUrl(current.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80");
      setName(current.name);
      setEmail(current.email);
      setPhone(current.phone || "");
      setGoal(current.goal || "Hipertrofia");
      setCref(current.cref || "08412-SP");
      setSpecialty(current.specialty || "Hipertrofia & Biomecânica");
      setBio(current.bio || "");
      setInstagram(current.instagram || "@rodrigo.gymflow");
      setLocation(current.location || "Salão Principal • Musculação");
      setDailyPrice(current.pricing?.dailySession || 75);
      setWeeklyPrice(current.pricing?.weeklyPlan || 190);
      setMonthlyPrice(current.pricing?.monthlyPlan || 580);
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

    const pricingObj = {
      dailySession: Number(dailyPrice),
      weeklyPlan: Number(weeklyPrice),
      monthlyPlan: Number(monthlyPrice),
    };

    const updated = saveUserProfile({
      name,
      email,
      phone,
      activeRole,
      avatarUrl,
      goal,
      cref,
      specialty,
      bio,
      instagram,
      location,
      pricing: pricingObj,
    });

    // Se for professor, atualiza os dados públicos no marketplace
    if (isCoach) {
      updateCoachPublicProfile("coach_rodrigo", {
        name,
        cref,
        specialty,
        bio,
        phone,
        avatarUrl,
        instagram,
        location,
        pricing: pricingObj,
      });
    }

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
              className={`w-10 h-10 rounded-2xl overflow-hidden border-2 flex items-center justify-center bg-zinc-900 shrink-0 ${
                isCoach ? "border-amber-500/50" : "border-emerald-500/50"
              }`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-sm text-white">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white leading-none">{name}</h2>
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
              <p className="text-[10px] text-zinc-400 mt-0.5">{email}</p>
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
          {/* UPLOAD & TROCA DE FOTO DE PERFIL */}
          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            userName={name}
            isCoach={isCoach}
            onSelectAvatar={(url) => setAvatarUrl(url)}
          />

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
              <span>Dados do perfil e configurações atualizados com sucesso!</span>
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

          {/* DADOS ESPECÍFICOS: MODO PROFESSOR (CONFIGURAÇÃO DO PERFIL PÚBLICO) */}
          {isCoach && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> Perfil Público do Personal
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
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
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
                    placeholder="Ex: Hipertrofia, Biomecânica & Força"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <Instagram className="w-3 h-3 text-pink-400" /> Instagram Profissional
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@seu.perfil"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> Local de Atendimento
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Salão Principal • Musculação"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Preços dos Planos */}
                <div className="sm:col-span-2 pt-1 border-t border-white/[0.04]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">
                    Tabela de Preços para os Alunos (R$):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-500 block mb-0.5">Diária (R$)</label>
                      <input
                        type="number"
                        value={dailyPrice}
                        onChange={(e) => setDailyPrice(Number(e.target.value))}
                        className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 block mb-0.5">Semanal (R$)</label>
                      <input
                        type="number"
                        value={weeklyPrice}
                        onChange={(e) => setWeeklyPrice(Number(e.target.value))}
                        className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 block mb-0.5">Mensal VIP (R$)</label>
                      <input
                        type="number"
                        value={monthlyPrice}
                        onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                        className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono"
                      />
                    </div>
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
                    placeholder="Conte sobre sua metodologia de treino e experiência com os alunos..."
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
                  <option value="Hipertrofia">Hipertrofia & Ganho de Massa</option>
                  <option value="Emagrecimento">Emagrecimento & Definição</option>
                  <option value="Força & Performance">Força & Performance 5×5</option>
                  <option value="Condicionamento Geral">Condicionamento Geral</option>
                </select>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/[0.06]">
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Entrar com Outra Conta</span>
              </button>
            )}

            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-950 flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ml-auto ${
                isCoach
                  ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20"
                  : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Perfil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
