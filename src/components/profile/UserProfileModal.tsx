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
  Scale,
  Ruler,
  Plus,
  AlertCircle,
  ArrowRight,
  Check,
  Navigation,
  Loader2,
  Globe,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import {
  getCurrentUser,
  saveUserProfile,
  switchUserRole,
  enableCoachRole,
  logoutUser,
  isUserAuthenticated,
  UserProfile,
  UserRole,
} from "@/lib/auth-store";

import { updateCoachPublicProfile } from "@/lib/booking-store";
import { saveProfileToSupabase } from "@/lib/supabase-service";
import { formatPhone, sanitizeInput } from "@/lib/security";
import { BRAZIL_STATES, reverseGeocode, isValidCoordinate } from "@/lib/geo";
import { AvatarUpload } from "./AvatarUpload";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
  onOpenCustomization?: () => void;
}

export function UserProfileModal({ isOpen, onClose, onOpenAuth, onOpenCustomization }: UserProfileModalProps) {
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
  const [experienceLevel, setExperienceLevel] = useState<UserProfile["experienceLevel"]>(
    profile.experienceLevel || "Iniciante"
  );

  // Biometria & Dados Corporais (Altura, Peso, %BF e Metas)
  const [height, setHeight] = useState(profile.height || 178);
  const [weight, setWeight] = useState(profile.weight || 78.4);
  const [bodyFat, setBodyFat] = useState(profile.bodyFat || 13.8);
  const [targetWeight, setTargetWeight] = useState(profile.targetWeight || 76.0);
  const [targetBodyFat, setTargetBodyFat] = useState(profile.targetBodyFat || 12.0);
  const [gender, setGender] = useState<UserProfile["gender"]>(profile.gender || "masculino");

  const [cref, setCref] = useState(profile.cref || "");
  const [specialty, setSpecialty] = useState(profile.specialty || "Hipertrofia & Biomecânica");
  const [bio, setBio] = useState(profile.bio || "");
  const [instagram, setInstagram] = useState(profile.instagram || "@rodrigo.gymflow");
  const [location, setLocation] = useState(profile.location || "Salão Principal • Musculação");

  // Localização Geográfica (Cidade, Estado, Bairro e GPS)
  const [state, setState] = useState<string>(profile.state || "SP");
  const [city, setCity] = useState<string>(profile.city || "");
  const [neighborhood, setNeighborhood] = useState<string>(profile.neighborhood || "");
  const [latitude, setLatitude] = useState<number | undefined>(profile.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(profile.longitude);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSuccess, setLocationSuccess] = useState<boolean>(
    Boolean(profile.latitude && profile.longitude)
  );
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [serviceModality, setServiceModality] = useState<"presencial" | "online" | "hibrido">(
    profile.serviceModality || "presencial"
  );
  const [operatingRadiusKm, setOperatingRadiusKm] = useState<number>(profile.operatingRadiusKm || 15);

  // Preços Mensais do Personal (35, 45, 55)
  const [basicPrice, setBasicPrice] = useState(profile.pricing?.basicMonthly || profile.pricing?.dailySession || 35);
  const [proPrice, setProPrice] = useState(profile.pricing?.proMonthly || profile.pricing?.weeklyPlan || 45);
  const [vipPrice, setVipPrice] = useState(profile.pricing?.vipMonthly || profile.pricing?.monthlyPlan || 55);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Estado para ativação de Modo Professor a partir de conta de Aluno
  const hasCoachRole = Boolean(profile.enabledRoles?.includes("coach") || activeRole === "coach");
  const [isCoachUpgradeOpen, setIsCoachUpgradeOpen] = useState(false);
  const [upgradeSpecialty, setUpgradeSpecialty] = useState(profile.specialty || "");
  const [upgradeCref, setUpgradeCref] = useState(profile.cref || "");
  const [upgradeBio, setUpgradeBio] = useState(profile.bio || "");
  const [upgradeLocation, setUpgradeLocation] = useState(profile.location || "Salão Principal • Musculação");
  const [upgradeInstagram, setUpgradeInstagram] = useState(profile.instagram || "");
  const [upgradeBasicPrice, setUpgradeBasicPrice] = useState(profile.pricing?.basicMonthly || 35);
  const [upgradeProPrice, setUpgradeProPrice] = useState(profile.pricing?.proMonthly || 45);
  const [upgradeVipPrice, setUpgradeVipPrice] = useState(profile.pricing?.vipMonthly || 55);
  const [upgradeError, setUpgradeError] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);

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
      setExperienceLevel(current.experienceLevel || "Iniciante");
      setHeight(current.height || 178);
      setWeight(current.weight || 78.4);
      setBodyFat(current.bodyFat || 13.8);
      setTargetWeight(current.targetWeight || 76.0);
      setTargetBodyFat(current.targetBodyFat || 12.0);
      setGender(current.gender || "masculino");
      setCref(current.cref || "");
      setSpecialty(current.specialty || "Hipertrofia & Biomecânica");
      setBio(current.bio || "");
      setInstagram(current.instagram || "@rodrigo.gymflow");
      setLocation(current.location || "Salão Principal • Musculação");
      
      // Sincroniza localização
      setState(current.state || "SP");
      setCity(current.city || "");
      setNeighborhood(current.neighborhood || "");
      setLatitude(current.latitude);
      setLongitude(current.longitude);
      setLocationSuccess(Boolean(current.latitude && current.longitude));
      setLocationNotice(null);
      setServiceModality(current.serviceModality || "presencial");
      setOperatingRadiusKm(current.operatingRadiusKm || 15);

      setBasicPrice(current.pricing?.basicMonthly || current.pricing?.dailySession || 35);
      setProPrice(current.pricing?.proMonthly || current.pricing?.weeklyPlan || 45);
      setVipPrice(current.pricing?.vipMonthly || current.pricing?.monthlyPlan || 55);

      // Sincroniza campos do painel de ativação de professor
      setUpgradeSpecialty(current.specialty || "");
      setUpgradeCref(current.cref || "");
      setUpgradeBio(current.bio || "");
      setUpgradeLocation(current.location || "Salão Principal • Musculação");
      setUpgradeInstagram(current.instagram || "");
      setUpgradeBasicPrice(current.pricing?.basicMonthly || current.pricing?.dailySession || 35);
      setUpgradeProPrice(current.pricing?.proMonthly || current.pricing?.weeklyPlan || 45);
      setUpgradeVipPrice(current.pricing?.vipMonthly || current.pricing?.monthlyPlan || 55);
      setUpgradeError("");
      setIsCoachUpgradeOpen(false);
      setIsUpgrading(false);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  // Detecção e geocodificação reversa de localização
  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationNotice("Geolocalização não suportada no seu navegador. Você pode preencher manualmente abaixo.");
      triggerHaptic("warning");
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);
    triggerHaptic("selection");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!isValidCoordinate(lat, lng)) {
          setIsLocating(false);
          setLocationNotice("Coordenadas de GPS inválidas. Preencha sua região manualmente.");
          triggerHaptic("warning");
          return;
        }

        setLatitude(lat);
        setLongitude(lng);
        setLocationSuccess(true);
        triggerHaptic("success");

        try {
          const geo = await reverseGeocode(lat, lng);
          if (geo && (geo.city || geo.state)) {
            if (geo.city) setCity(geo.city);
            if (geo.state) setState(geo.state);
            if (geo.neighborhood) setNeighborhood(geo.neighborhood);
            const detectedLabel = [geo.neighborhood, geo.city, geo.state].filter(Boolean).join(" - ");
            setLocationNotice(
              `📍 Localização identificada: ${detectedLabel}. Se algo estiver incorreto, você pode corrigir nos campos abaixo.`
            );
          } else {
            setLocationNotice("📍 GPS ativo com sucesso! Confirme sua cidade e estado abaixo.");
          }
        } catch {
          setLocationNotice("📍 GPS ativo! Confirme sua cidade e estado abaixo.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = "Não foi possível obter sua localização. Por favor, preencha manualmente.";
        if (err.code === 1) {
          msg = "Permissão de localização não concedida. Preencha sua cidade e estado manualmente.";
        } else if (err.code === 2) {
          msg = "Sinal de GPS indisponível no momento. Preencha sua cidade manualmente.";
        } else if (err.code === 3) {
          msg = "Tempo esgotado ao buscar sinal do GPS. Preencha sua cidade manualmente.";
        }
        setLocationNotice(msg);
        triggerHaptic("warning");
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  };

  if (!isOpen) return null;

  // Alternar papel Aluno ⇄ Professor
  const handleSwitchRole = (newRole: UserRole) => {
    triggerHaptic("medium");
    setActiveRole(newRole);
    const updated = switchUserRole(newRole);
    setProfile(updated);
  };

  // Ativação do papel de professor com preenchimento das informações faltantes
  const handleUpgradeToCoach = (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeError("");

    const cleanSpecialty = sanitizeInput(upgradeSpecialty).trim();
    if (!cleanSpecialty) {
      setUpgradeError("Por favor, informe sua especialidade principal de atendimento.");
      triggerHaptic("warning");
      return;
    }

    setIsUpgrading(true);
    triggerHaptic("success");

    const pricingObj = {
      basicMonthly: Number(upgradeBasicPrice) || 35,
      proMonthly: Number(upgradeProPrice) || 45,
      vipMonthly: Number(upgradeVipPrice) || 55,
      dailySession: Number(upgradeBasicPrice) || 35,
      weeklyPlan: Number(upgradeProPrice) || 45,
      monthlyPlan: Number(upgradeVipPrice) || 55,
    };

    const cleanCref = sanitizeInput(upgradeCref).trim() || undefined;
    const cleanBio = sanitizeInput(upgradeBio).trim() || undefined;
    const cleanLocation = sanitizeInput(upgradeLocation).trim() || "Salão Principal";
    const cleanInstagram = sanitizeInput(upgradeInstagram).trim() || undefined;

    const updated = enableCoachRole({
      specialty: cleanSpecialty,
      cref: cleanCref,
      bio: cleanBio,
      location: cleanLocation,
      instagram: cleanInstagram,
      pricing: pricingObj,
    });

    // Se possui perfil no marketplace, atualiza para refletir novo personal
    updateCoachPublicProfile(updated.id || "coach_rodrigo", {
      name: updated.name,
      cref: cleanCref,
      specialty: cleanSpecialty,
      bio: cleanBio || "",
      phone: updated.phone || "",
      avatarUrl: updated.avatarUrl || avatarUrl,
      instagram: cleanInstagram || "",
      location: cleanLocation,
      pricing: pricingObj,
    });

    setProfile(updated);
    setActiveRole("coach");
    setSpecialty(cleanSpecialty);
    if (cleanCref) setCref(cleanCref);
    if (cleanBio) setBio(cleanBio);
    if (cleanLocation) setLocation(cleanLocation);
    if (cleanInstagram) setInstagram(cleanInstagram);
    setBasicPrice(pricingObj.basicMonthly);
    setProPrice(pricingObj.proMonthly);
    setVipPrice(pricingObj.vipMonthly);

    setIsUpgrading(false);
    setIsCoachUpgradeOpen(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  // Salvar edições de perfil
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic("success");

    const pricingObj = {
      basicMonthly: Number(basicPrice) || 35,
      proMonthly: Number(proPrice) || 45,
      vipMonthly: Number(vipPrice) || 55,
      dailySession: Number(basicPrice) || 35,
      weeklyPlan: Number(proPrice) || 45,
      monthlyPlan: Number(vipPrice) || 55,
    };

    const validCoords = isValidCoordinate(latitude, longitude);
    const cleanCity = sanitizeInput(city.trim());
    const cleanState = sanitizeInput(state.trim().toUpperCase());
    const cleanNeighborhood = sanitizeInput(neighborhood.trim());

    const updated = saveUserProfile({
      name,
      email,
      phone,
      activeRole,
      avatarUrl,
      goal,
      experienceLevel,
      height: Number(height) || 178,
      weight: Number(weight) || 78.4,
      bodyFat: Number(bodyFat) || 13.8,
      targetWeight: Number(targetWeight) || undefined,
      targetBodyFat: Number(targetBodyFat) || undefined,
      gender,
      cref: cref.trim() || undefined,
      specialty,
      bio,
      instagram,
      location,
      city: cleanCity || undefined,
      state: cleanState || undefined,
      neighborhood: cleanNeighborhood || undefined,
      latitude: validCoords ? latitude : undefined,
      longitude: validCoords ? longitude : undefined,
      serviceModality,
      operatingRadiusKm,
      pricing: pricingObj,
    });

    // Salva de forma assíncrona no Supabase
    saveProfileToSupabase(updated);

    // Se for professor, atualiza os dados públicos no marketplace
    if (isCoach) {
      updateCoachPublicProfile(profile.id || "coach_rodrigo", {
        name,
        cref: cref.trim() || undefined,
        specialty,
        bio,
        phone,
        avatarUrl,
        instagram,
        location: location || `${cleanCity || "Salão Principal"} - ${cleanState || "SP"}`,
        city: cleanCity || undefined,
        state: cleanState || undefined,
        neighborhood: cleanNeighborhood || undefined,
        latitude: validCoords ? latitude : undefined,
        longitude: validCoords ? longitude : undefined,
        serviceModality,
        operatingRadiusKm,
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

          {/* SE A CONTA NÃO POSSUI PAPEL DE PROFESSOR: EXIBE CARD PARA ATIVAR COM PAINEL DE DADOS */}
          {!hasCoachRole ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 border border-amber-500/20 shadow-lg relative overflow-hidden">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" /> Tornar-se Personal Trainer
                  </span>
                  <h3 className="text-xs font-black text-white mt-1">
                    Ativar Perfil Profissional de Professor
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Opcional
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                Sua conta está configurada como aluno. Se você também prescreve treinos ou atende alunos particulares, adicione suas informações de professor para desbloquear o modo treinador.
              </p>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  setIsCoachUpgradeOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Informações de Professor</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </button>
            </div>
          ) : (
            /* SE JÁ POSSUI PAPEL DE PROFESSOR: EXIBE O ALTERNADOR DE MODO */
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
          )}

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
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(sanitizeInput(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">E-mail</label>
                <input
                  type="email"
                  required
                  maxLength={100}
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, 100))}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  WhatsApp / Telefone de Contato
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99123-4567"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Matrícula Digital</label>
                <input
                  type="text"
                  disabled
                  maxLength={40}
                  value={profile.matricula || "GF-84920"}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950/50 border border-white/[0.04] text-xs text-zinc-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO: BIOMETRIA & DADOS CORPORAIS (ALTURA, PESO, GORDURA E METAS) */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-sky-400" /> Biometria & Dados Corporais
              </h4>
              <span className="text-[9px] text-sky-400 font-mono">
                {height ? `${(height / 100).toFixed(2)}m` : "--"} • {weight ? `${weight}kg` : "--"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Sua altura e dados base são utilizados para calcular o IMC, taxa de gordura e alimentar os gráficos de evolução.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-sky-400" /> Altura (cm)
                </label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  step="1"
                  required
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  placeholder="Ex: 178"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                  <Scale className="w-3 h-3 text-emerald-400" /> Peso Atual (kg)
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder="Ex: 78.4"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" /> Gordura (% BF)
                </label>
                <input
                  type="number"
                  min="3"
                  max="60"
                  step="0.1"
                  required
                  value={bodyFat}
                  onChange={(e) => setBodyFat(Number(e.target.value))}
                  placeholder="Ex: 13.8"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Meta Peso (kg)</label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  step="0.1"
                  value={targetWeight || ""}
                  onChange={(e) => setTargetWeight(e.target.value ? Number(e.target.value) : 0)}
                  placeholder="Ex: 76.0"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Meta Gordura (% BF)</label>
                <input
                  type="number"
                  min="3"
                  max="50"
                  step="0.1"
                  value={targetBodyFat || ""}
                  onChange={(e) => setTargetBodyFat(e.target.value ? Number(e.target.value) : 0)}
                  placeholder="Ex: 12.0"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Sexo Biológico</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as UserProfile["gender"])}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
          </div>

          {/* DADOS ESPECÍFICOS: MODO ALUNO (OBJETIVO & EXPERIÊNCIA) */}
          {!isCoach && (
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> Objetivo & Nível de Treino
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Objetivo Principal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as UserProfile["goal"])}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Hipertrofia">Hipertrofia</option>
                    <option value="Emagrecimento">Emagrecimento</option>
                    <option value="Força & Performance">Força & Performance</option>
                    <option value="Condicionamento Geral">Condicionamento Geral</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Nível de Experiência</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as UserProfile["experienceLevel"])}
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Iniciante">Iniciante (menos de 6 meses)</option>
                    <option value="Intermediário">Intermediário (6 meses a 2 anos)</option>
                    <option value="Avançado">Avançado (mais de 2 anos)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

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
                  <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center justify-between">
                    <span>Registro CREF</span>
                    <span className="text-[9px] text-zinc-500 font-normal lowercase">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={cref}
                    onChange={(e) => setCref(sanitizeInput(e.target.value))}
                    placeholder="Ex: 08412-SP (opcional)"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Especialidade Principal
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={specialty}
                    onChange={(e) => setSpecialty(sanitizeInput(e.target.value))}
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
                    maxLength={40}
                    value={instagram}
                    onChange={(e) => setInstagram(sanitizeInput(e.target.value))}
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
                    maxLength={80}
                    value={location}
                    onChange={(e) => setLocation(sanitizeInput(e.target.value))}
                    placeholder="Ex: Salão Principal • Musculação"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Preços dos Planos Mensais */}
                <div className="sm:col-span-2 pt-1 border-t border-white/[0.04]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">
                    Tabela de Planos Mensais para os Alunos (R$ / mês):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-400 font-bold block mb-0.5">Básico (R$/mês)</label>
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        value={basicPrice}
                        onChange={(e) => setBasicPrice(Math.min(10000, Math.max(0, Number(e.target.value) || 0)))}
                        className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-amber-400 font-bold block mb-0.5">Pro (R$/mês)</label>
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        value={proPrice}
                        onChange={(e) => setProPrice(Math.min(10000, Math.max(0, Number(e.target.value) || 0)))}
                        className="w-full p-2 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-emerald-400 font-bold block mb-0.5">VIP (R$/mês)</label>
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        value={vipPrice}
                        onChange={(e) => setVipPrice(Math.min(10000, Math.max(0, Number(e.target.value) || 0)))}
                        className="w-full p-2 rounded-xl bg-zinc-950 border border-emerald-500/30 text-xs text-white font-mono"
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
                    maxLength={300}
                    value={bio}
                    onChange={(e) => setBio(sanitizeInput(e.target.value))}
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

          {/* SEÇÃO: LOCALIZAÇÃO & REGIÃO GEOGRÁFICA (ALUNO E PROFESSOR) */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className={`w-3.5 h-3.5 ${isCoach ? "text-amber-400" : "text-emerald-400"}`} />
                <span>{isCoach ? "Região & Modalidade de Atendimento" : "Localização & Região"}</span>
              </h4>
              <span className="text-[9px] text-zinc-400 font-mono">
                {city ? `${city} - ${state}` : "Não configurada"}
              </span>
            </div>

            <p className="text-[10px] text-zinc-400">
              {isCoach
                ? "Defina onde você atende. Seu perfil será priorizado para alunos que buscam personais na sua cidade ou proximidades."
                : "Sua localização é usada para encontrar personais trainers próximos de você por proximidade em tempo real."}
            </p>

            {/* Botão de Localização Automática via GPS */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border ${
                  locationSuccess
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10"
                    : isCoach
                    ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Detectando GPS...</span>
                  </>
                ) : locationSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Localização GPS Ativa</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Usar Minha Localização Atual</span>
                  </>
                )}
              </button>

              {locationSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    setLatitude(undefined);
                    setLongitude(undefined);
                    setLocationSuccess(false);
                    setLocationNotice(null);
                    triggerHaptic("light");
                  }}
                  className="text-[10px] text-zinc-500 hover:text-rose-400 underline transition-colors px-1"
                >
                  Desativar GPS
                </button>
              )}
            </div>

            {locationNotice && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-start gap-2 animate-in fade-in ${
                  locationSuccess
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="flex-1 text-[11px] leading-relaxed">{locationNotice}</span>
              </div>
            )}

            {/* Inputs: Estado e Cidade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Estado (UF) <span className={isCoach ? "text-amber-400" : "text-emerald-400"}>*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-emerald-500/50"
                >
                  {BRAZIL_STATES.map((s) => (
                    <option key={s.uf} value={s.uf}>
                      {s.uf} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Cidade <span className={isCoach ? "text-amber-400" : "text-emerald-400"}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(sanitizeInput(e.target.value))}
                  placeholder="Ex: São Paulo, Rio de Janeiro, Curitiba..."
                  maxLength={80}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Bairro / Região (Opcional)
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(sanitizeInput(e.target.value))}
                  placeholder="Ex: Jardins, Copacabana, Savassi, Batel..."
                  maxLength={80}
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Configurações extras para Professor */}
              {isCoach && (
                <>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-amber-400 uppercase">
                      Modalidade de Atendimento
                    </label>
                    <select
                      value={serviceModality}
                      onChange={(e) => setServiceModality(e.target.value as any)}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="presencial">Presencial (na minha cidade/bairro)</option>
                      <option value="online">100% Online / Consultoria Remota</option>
                      <option value="hibrido">Híbrido (Presencial + Acompanhamento Online)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-amber-400 uppercase">
                      Raio Máximo (km)
                    </label>
                    <select
                      value={operatingRadiusKm}
                      onChange={(e) => setOperatingRadiusKm(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value={5}>Até 5 km</option>
                      <option value={10}>Até 10 km</option>
                      <option value={15}>Até 15 km</option>
                      <option value={25}>Até 25 km</option>
                      <option value={50}>Até 50 km</option>
                      <option value={100}>Até 100 km</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] flex-wrap">
            <div className="flex items-center gap-2">
              {profile.email && profile.id !== "user_me" ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("warning");
                    logoutUser();
                    onClose();
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20"
                  title="Sair desta conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta</span>
                </button>
              ) : (
                onOpenAuth && (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 font-bold"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Entrar / Cadastrar</span>
                  </button>
                )
              )}

              {profile.email && profile.id !== "user_me" && onOpenAuth && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1.5"
                  title="Acessar com outro e-mail"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Trocar</span>
                </button>
              )}

              {onOpenCustomization && (
                <button
                  type="button"
                  onClick={onOpenCustomization}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 font-bold"
                  title="Personalizar detalhes da conta"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Personalizar</span>
                </button>
              )}
            </div>

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

      {/* MODAL / PAINEL DE ADIÇÃO DE INFORMAÇÕES DE PROFESSOR */}
      {isCoachUpgradeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-zinc-950 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do Painel de Upgrade */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-zinc-900/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Ativar Perfil de Professor</h3>
                  <p className="text-[11px] text-zinc-400">Complete seus dados profissionais para prescrever treinos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setIsCoachUpgradeOpen(false);
                }}
                className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário do Painel */}
            <form onSubmit={handleUpgradeToCoach} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
              {upgradeError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{upgradeError}</span>
                </div>
              )}

              {/* Especialidade Principal */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center justify-between">
                  <span>Especialidade Principal *</span>
                  <span className="text-[9px] text-amber-400">Obrigatório</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={upgradeSpecialty}
                  onChange={(e) => setUpgradeSpecialty(sanitizeInput(e.target.value))}
                  placeholder="Ex: Hipertrofia & Biomecânica"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                {/* Sugestões rápidas */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    "Hipertrofia & Ganho de Massa",
                    "Emagrecimento & Definição",
                    "Treinamento Funcional",
                    "Reabilitação & Postura",
                    "Força & Performance",
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setUpgradeSpecialty(sug)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                        upgradeSpecialty === sug
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                          : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* CREF (Opcional) */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center justify-between">
                  <span>Registro CREF</span>
                  <span className="text-[9px] text-zinc-500 lowercase">(opcional no GymFlow)</span>
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={upgradeCref}
                  onChange={(e) => setUpgradeCref(sanitizeInput(e.target.value))}
                  placeholder="Ex: 08412-SP (opcional)"
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>

              {/* Local de Atendimento & Instagram */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> Local de Atendimento
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={upgradeLocation}
                    onChange={(e) => setUpgradeLocation(sanitizeInput(e.target.value))}
                    placeholder="Ex: Salão Principal • Musculação"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <Instagram className="w-3 h-3 text-pink-400" /> Instagram Profissional
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={upgradeInstagram}
                    onChange={(e) => setUpgradeInstagram(sanitizeInput(e.target.value))}
                    placeholder="@seu.perfil"
                    className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>
              </div>

              {/* Preços dos Planos Mensais */}
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">
                  Planos Mensais para Alunos (R$/mês):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-zinc-400 font-bold block mb-0.5">Básico</label>
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={upgradeBasicPrice}
                      onChange={(e) => setUpgradeBasicPrice(Math.min(10000, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full p-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-amber-400 font-bold block mb-0.5">Pro</label>
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={upgradeProPrice}
                      onChange={(e) => setUpgradeProPrice(Math.min(10000, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full p-2 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-emerald-400 font-bold block mb-0.5">VIP</label>
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={upgradeVipPrice}
                      onChange={(e) => setUpgradeVipPrice(Math.min(10000, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full p-2 rounded-xl bg-zinc-950 border border-emerald-500/30 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Biografia / Apresentação */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Biografia & Apresentação Profissional
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={upgradeBio}
                  onChange={(e) => setUpgradeBio(sanitizeInput(e.target.value))}
                  placeholder="Apresente sua metodologia, experiência com alunos e diferenciais de treino..."
                  className="w-full mt-1 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Botões do Rodapé do Painel */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCoachUpgradeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpgrading}
                  className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isUpgrading ? "Ativando..." : "Confirmar e Ativar Modo Professor"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

