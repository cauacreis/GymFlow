"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  Flame,
  CheckCircle2,
  Award,
  Sparkles,
  Lock,
  Play,
  Search,
  Filter,
  Dumbbell,
  Heart,
  Video,
  Radio,
  Check,
  Zap,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { canAccessFeature } from "@/lib/subscription-features";
import { FeatureGateModal } from "@/components/subscription/FeatureGateModal";
import { ClassVideoModal } from "./ClassVideoModal";

export interface ClassChapter {
  title: string;
  time: string;
  intensity: "Leve" | "Média" | "Alta" | "Extrema" | "Relax";
}

export interface GymClass {
  id: string;
  title: string;
  category:
    | "Cardio & Spinning"
    | "Lutas & Boxe"
    | "HIIT & Queima"
    | "Força & Hipertrofia"
    | "Mobilidade & Yoga"
    | "Dança & Ritmos"
    | "Pilates & Core";
  difficulty: "Iniciante" | "Intermediário" | "Avançado" | "Todos os Níveis";
  time: string;
  durationMinutes: number;
  instructor: string;
  instructorAvatar?: string;
  coverImage: string;
  videoUrl?: string;
  totalSpots: number;
  bookedSpots: number;
  caloriesBurnEstimate: number;
  isBooked: boolean;
  isLiveToday?: boolean;
  isOnDemand?: boolean;
  description: string;
  equipment: string[];
  targetMuscles: string[];
  chapters?: ClassChapter[];
}

export const INITIAL_CLASSES: GymClass[] = [
  {
    id: "class-spinning-01",
    title: "Spinning Indoor High Intensity",
    category: "Cardio & Spinning",
    difficulty: "Intermediário",
    time: "07:00",
    durationMinutes: 45,
    instructor: "Prof. Rodrigo Costa • Especialista em Ciclismo Indoor",
    instructorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_spinning.jpg",
    videoUrl: "https://www.youtube.com/embed/gC_L9qAHVJ8",
    totalSpots: 25,
    bookedSpots: 23,
    caloriesBurnEstimate: 580,
    isBooked: false,
    isLiveToday: true,
    isOnDemand: true,
    description: "Treino intervalado em bike com subidas simuladas, sprints em alta cadência e trilha sonora imersiva para aceleração metabólica.",
    equipment: ["Bicicleta Ergométrica / Spinning", "Garrafa d'Água", "Toalha de Rosto"],
    targetMuscles: ["Quadríceps", "Glúteos", "Panturrilhas", "Sistema Cardiovascular"],
    chapters: [
      { title: "Aquecimento & Giro Livre (80 RPM)", time: "00:00 - 06:00", intensity: "Leve" },
      { title: "Fase de Escalada & Carga Moderada", time: "06:00 - 20:00", intensity: "Alta" },
      { title: "Sprints Tabata em Alta Rotação (110 RPM)", time: "20:00 - 35:00", intensity: "Extrema" },
      { title: "Desaceleração & Soltura de Pernas", time: "35:00 - 45:00", intensity: "Relax" },
    ],
  },
  {
    id: "class-muay-thai-02",
    title: "Muay Thai Técnico & Combate",
    category: "Lutas & Boxe",
    difficulty: "Todos os Níveis",
    time: "08:30",
    durationMinutes: 60,
    instructor: "Mestre Felipe 'Cyborg' • Faixa Preta Kruang",
    instructorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_muay_thai.jpg",
    videoUrl: "https://www.youtube.com/embed/j6Tf1z7d3yU",
    totalSpots: 16,
    bookedSpots: 14,
    caloriesBurnEstimate: 720,
    isBooked: false,
    isLiveToday: true,
    isOnDemand: true,
    description: "Fundamentos das 8 armas do Muay Thai: socos, chutes com canela, cotoveladas, joelhadas e circuitos de manopla com alta intensidade.",
    equipment: ["Luvas de Boxe/Muay Thai (12-14oz)", "Bandagens de Punho", "Protetor Bucal"],
    targetMuscles: ["Ombros", "Tronco & Oblíquos", "Flexores do Quadril", "Agilidade"],
    chapters: [
      { title: "Corda & Aquecimento Articular", time: "00:00 - 10:00", intensity: "Média" },
      { title: "Técnica de Golpes & Sombra", time: "10:00 - 25:00", intensity: "Média" },
      { title: "Rounds de Manopla & Pares", time: "25:00 - 50:00", intensity: "Extrema" },
      { title: "Abdominal de Luta & Alongamento", time: "50:00 - 60:00", intensity: "Alta" },
    ],
  },
  {
    id: "class-hiit-03",
    title: "HIIT Queima Extrema 30 Min",
    category: "HIIT & Queima",
    difficulty: "Avançado",
    time: "12:15",
    durationMinutes: 30,
    instructor: "Profa. Larissa Neves • Fisiologia do Exercício",
    instructorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_hiit.jpg",
    videoUrl: "https://www.youtube.com/embed/ml6cT4AZdqI",
    totalSpots: 20,
    bookedSpots: 18,
    caloriesBurnEstimate: 490,
    isBooked: false,
    isLiveToday: true,
    isOnDemand: true,
    description: "Sessão compacta de alta densidade projetada para maximizar o efeito EPOC e queimar calorias por até 24 horas após o treino.",
    equipment: ["Colchonete", "Par de Halteres Médios (4-8kg)"],
    targetMuscles: ["Corpo Inteiro", "Core", "Condicionamento Anaeróbico"],
    chapters: [
      { title: "Mobilidade Dinâmica & Elevação de BPM", time: "00:00 - 04:00", intensity: "Leve" },
      { title: "Bloco 1: Burpees, Agachamento & Sprawl", time: "04:00 - 14:00", intensity: "Extrema" },
      { title: "Bloco 2: Mountain Climbers & Halteres", time: "14:00 - 24:00", intensity: "Extrema" },
      { title: "Respiração & Recuperação Ativa", time: "24:00 - 30:00", intensity: "Relax" },
    ],
  },
  {
    id: "class-cross-04",
    title: "Cross Training WOD 'Murph Mod'",
    category: "Força & Hipertrofia",
    difficulty: "Avançado",
    time: "18:00",
    durationMinutes: 50,
    instructor: "Coach Bruno Rocha • Head Coach Cross",
    instructorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_cross_training.jpg",
    videoUrl: "https://www.youtube.com/embed/oAp6yydk8aE",
    totalSpots: 20,
    bookedSpots: 19,
    caloriesBurnEstimate: 660,
    isBooked: true,
    isLiveToday: true,
    isOnDemand: true,
    description: "Circuito funcional completo de força bruta e resistência: barra fixa, flexões, agachamentos e tiros com kettlebell.",
    equipment: ["Barra Fixa", "Kettlebell 16kg", "Caixa Pliométrica"],
    targetMuscles: ["Dorsais", "Peitoral", "Pernas", "Potência Muscular"],
    chapters: [
      { title: "Aquecimento Geral & Ativação Escapular", time: "00:00 - 08:00", intensity: "Leve" },
      { title: "Treino de Força Técnica", time: "08:00 - 20:00", intensity: "Alta" },
      { title: "WOD For Time: 100 Pull-ups & 200 Squats", time: "20:00 - 42:00", intensity: "Extrema" },
      { title: "Cool-down & Soltura", time: "42:00 - 50:00", intensity: "Relax" },
    ],
  },
  {
    id: "class-fitdance-05",
    title: "FitDance Ritmos & Funk",
    category: "Dança & Ritmos",
    difficulty: "Iniciante",
    time: "19:15",
    durationMinutes: 45,
    instructor: "Profa. Camila Lima • Instrutora FitDance",
    instructorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_fitdance.jpg",
    videoUrl: "https://www.youtube.com/embed/ZWk19OVon2k",
    totalSpots: 30,
    bookedSpots: 27,
    caloriesBurnEstimate: 510,
    isBooked: false,
    isLiveToday: true,
    isOnDemand: true,
    description: "Coreografias contagiantes com os maiores sucessos atuais. Uma aula divertida que gasta calorias sem parecer esforço.",
    equipment: ["Tênis Confortável", "Roupa Leve"],
    targetMuscles: ["Membros Inferiores", "Coordenação Motora", "Cardio"],
    chapters: [
      { title: "Warm-up com Ritmos Leves", time: "00:00 - 05:00", intensity: "Leve" },
      { title: "Hits Pop & Coreografias Moderadas", time: "05:00 - 25:00", intensity: "Alta" },
      { title: "Bloco Funk & Alta Queima", time: "25:00 - 40:00", intensity: "Alta" },
      { title: "Desaquecimento & Alongamento", time: "40:00 - 45:00", intensity: "Relax" },
    ],
  },
  {
    id: "class-yoga-06",
    title: "Yoga & Flexibilidade Articular",
    category: "Mobilidade & Yoga",
    difficulty: "Todos os Níveis",
    time: "20:15",
    durationMinutes: 45,
    instructor: "Profa. Amanda Prado • Certificada Hatha & Vinyasa",
    instructorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_yoga.jpg",
    videoUrl: "https://www.youtube.com/embed/sTANio_2E0Q",
    totalSpots: 15,
    bookedSpots: 11,
    caloriesBurnEstimate: 230,
    isBooked: false,
    isLiveToday: true,
    isOnDemand: true,
    description: "Posturas suaves de descompressão lombar, abertura de quadril e respiração guiada para aliviar tensões do dia a dia.",
    equipment: ["Tapete de Yoga (Mat)", "Almofada ou Bloco de EVA"],
    targetMuscles: ["Coluna Vertebral", "Quadril", "Isquiotibiais", "Postura"],
    chapters: [
      { title: "Pranayama & Conexão Respiratória", time: "00:00 - 06:00", intensity: "Relax" },
      { title: "Saudação ao Sol (Surya Namaskar)", time: "06:00 - 18:00", intensity: "Média" },
      { title: "Abertura Pélvica & Guerreiros", time: "18:00 - 35:00", intensity: "Média" },
      { title: "Savasana & Relaxamento Profundo", time: "35:00 - 45:00", intensity: "Relax" },
    ],
  },
  {
    id: "class-pilates-07",
    title: "Power Pilates & Core Profundo",
    category: "Pilates & Core",
    difficulty: "Intermediário",
    time: "09:30",
    durationMinutes: 40,
    instructor: "Profa. Mariana Siqueira • Fisioterapeuta & Pilates",
    instructorAvatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_pilates.jpg",
    videoUrl: "https://www.youtube.com/embed/K-P4h_CvsmA",
    totalSpots: 18,
    bookedSpots: 15,
    caloriesBurnEstimate: 320,
    isBooked: false,
    isLiveToday: true,
    isOnDemand: true,
    description: "Controle de centro de força (powerhouse), alinhamento da pelve e tonificação profunda sem impacto articular.",
    equipment: ["Colchonete / Mat", "Magic Circle / Faixa Elástica"],
    targetMuscles: ["Transverso Abdominal", "Multífidos", "Músculos Posturais"],
    chapters: [
      { title: "Ativação do Powerhouse & The Hundred", time: "00:00 - 08:00", intensity: "Média" },
      { title: "Série Roll-Up & Single Leg Stretch", time: "08:00 - 22:00", intensity: "Alta" },
      { title: "Ponte com Isometria Pélvica", time: "22:00 - 34:00", intensity: "Média" },
      { title: "Alongamento da Cadeia Posterior", time: "34:00 - 40:00", intensity: "Relax" },
    ],
  },
  {
    id: "class-abs-08",
    title: "Abdômen de Aço & Definição 20 min",
    category: "Pilates & Core",
    difficulty: "Intermediário",
    time: "11:00",
    durationMinutes: 20,
    instructor: "Coach Tiago Santos • Especialista em Hipertrofia",
    instructorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_abs_core.jpg",
    videoUrl: "https://www.youtube.com/embed/1f8yoFFdkLU",
    totalSpots: 25,
    bookedSpots: 20,
    caloriesBurnEstimate: 290,
    isBooked: false,
    isLiveToday: false,
    isOnDemand: true,
    description: "Treino rápido e explosivo focado em esculpir o reto abdominal, queimar flancos e reforçar a estabilidade da coluna.",
    equipment: ["Colchonete", "Anilha de 3-5kg (Opcional)"],
    targetMuscles: ["Reto Abdominal", "Oblíquos", "Lombar"],
    chapters: [
      { title: "Prancha Isométrica & Hollow Hold", time: "00:00 - 05:00", intensity: "Alta" },
      { title: "Russian Twists & Bicicleta", time: "05:00 - 12:00", intensity: "Extrema" },
      { title: "Elevação de Pernas Infra & Crunch", time: "12:00 - 18:00", intensity: "Alta" },
      { title: "Alongamento Abdominal Cobra", time: "18:00 - 20:00", intensity: "Relax" },
    ],
  },
  {
    id: "class-boxing-09",
    title: "Boxing Cardio & Sombra Rápida",
    category: "Lutas & Boxe",
    difficulty: "Intermediário",
    time: "17:00",
    durationMinutes: 45,
    instructor: "Prof. Marcos 'Tubarão' • Ex-Boxeador Profissional",
    instructorAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_boxing_cardio.jpg",
    videoUrl: "https://www.youtube.com/embed/U33q1I74j3Q",
    totalSpots: 20,
    bookedSpots: 16,
    caloriesBurnEstimate: 640,
    isBooked: false,
    isLiveToday: true,
    isOnDemand: true,
    description: "Sequências dinâmicas de jabs, diretos, cruzados e esquivas sincronizadas com passos rápidos para queima calórica maciça.",
    equipment: ["Luvas de Bate-Saco", "Corda de Pular", "Bandagens"],
    targetMuscles: ["Ombros & Deltoides", "Cardio", "Tronco", "Panturrilhas"],
    chapters: [
      { title: "Saltos de Corda & Agilidade de Pés", time: "00:00 - 08:00", intensity: "Média" },
      { title: "Combinações de Jab-Direto-Cruzado", time: "08:00 - 22:00", intensity: "Alta" },
      { title: "Trabalho em Saco Pesado / Sombra", time: "22:00 - 38:00", intensity: "Extrema" },
      { title: "Descompressão & Respiração", time: "38:00 - 45:00", intensity: "Relax" },
    ],
  },
  {
    id: "class-glutes-10",
    title: "Glúteos & Pernas Turbinadas",
    category: "Força & Hipertrofia",
    difficulty: "Todos os Níveis",
    time: "16:30",
    durationMinutes: 50,
    instructor: "Profa. Beatriz Mendes • Mestre em Biomecânica",
    instructorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_glutes_legs.jpg",
    videoUrl: "https://www.youtube.com/embed/8OPg80pGkQk",
    totalSpots: 22,
    bookedSpots: 21,
    caloriesBurnEstimate: 540,
    isBooked: false,
    isLiveToday: true,
    isOnDemand: true,
    description: "Protocolo intenso com foco em hip thrust, agachamentos búlgaros e abduções com mini band para formato e firmeza muscular.",
    equipment: ["Mini Bands", "Par de Halteres 6-12kg", "Banco / Step"],
    targetMuscles: ["Glúteo Máximo", "Glúteo Médio", "Quadríceps", "Posterior de Coxa"],
    chapters: [
      { title: "Ativação Glútea com Mini Band", time: "00:00 - 08:00", intensity: "Média" },
      { title: "Elevação Pélvica & Agachamento Búlgaro", time: "08:00 - 25:00", intensity: "Alta" },
      { title: "Passadas & Stiff com Halteres", time: "25:00 - 42:00", intensity: "Extrema" },
      { title: "Alongamento Profundo de Quadril", time: "42:00 - 50:00", intensity: "Relax" },
    ],
  },
  {
    id: "class-calisthenics-11",
    title: "Calistenia & Força Corporal",
    category: "Força & Hipertrofia",
    difficulty: "Intermediário",
    time: "14:00",
    durationMinutes: 45,
    instructor: "Coach Gabriel Castro • Atleta Street Workout",
    instructorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_calisthenics.jpg",
    videoUrl: "https://www.youtube.com/embed/eMjyvIQbn9M",
    totalSpots: 18,
    bookedSpots: 12,
    caloriesBurnEstimate: 470,
    isBooked: false,
    isLiveToday: false,
    isOnDemand: true,
    description: "Domine o peso do próprio corpo com progressões de barras fixas, paralelas, flexões arqueiras e L-sit.",
    equipment: ["Barra Fixa", "Paralelas (ou 2 Cadeiras)", "Peso do Corpo"],
    targetMuscles: ["Dorsais", "Tríceps", "Peitoral", "Core"],
    chapters: [
      { title: "Aquecimento de Punhos & Escápulas", time: "00:00 - 06:00", intensity: "Leve" },
      { title: "Progressão de Barra & Muscle-up Prep", time: "06:00 - 22:00", intensity: "Alta" },
      { title: "Paralelas & Dips Isométricos", time: "22:00 - 36:00", intensity: "Extrema" },
      { title: "Descompressão de Ombros & Alongamento", time: "36:00 - 45:00", intensity: "Relax" },
    ],
  },
  {
    id: "class-mobility-12",
    title: "Alongamento & Mobilidade Matinal",
    category: "Mobilidade & Yoga",
    difficulty: "Iniciante",
    time: "06:30",
    durationMinutes: 25,
    instructor: "Dr. André Valente • Fisioterapeuta Esportivo",
    instructorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    coverImage: "/classes/class_mobility_stretch.jpg",
    videoUrl: "https://www.youtube.com/embed/g_tea8ZNk5A",
    totalSpots: 30,
    bookedSpots: 18,
    caloriesBurnEstimate: 160,
    isBooked: false,
    isLiveToday: true,
    isOnDemand: true,
    description: "Rotina regenerativa matinal para destravar articulações, diminuir rigidez muscular e começar o dia com o corpo leve.",
    equipment: ["Colchonete", "Rolo de Liberação (Opcional)"],
    targetMuscles: ["Coluna Torácica", "Pescoço", "Isquiotibiais", "Tornozelos"],
    chapters: [
      { title: "Gato-Vaca & Rotação Torácica", time: "00:00 - 06:00", intensity: "Relax" },
      { title: "Mobilidade de Quadril 90/90", time: "06:00 - 15:00", intensity: "Leve" },
      { title: "Liberação de Panturrilhas & Posterior", time: "15:00 - 20:00", intensity: "Leve" },
      { title: "Respiração Diafragmática Final", time: "20:00 - 25:00", intensity: "Relax" },
    ],
  },
];

const CATEGORIES = [
  "Todas",
  "Cardio & Spinning",
  "Lutas & Boxe",
  "HIIT & Queima",
  "Força & Hipertrofia",
  "Mobilidade & Yoga",
  "Dança & Ritmos",
  "Pilates & Core",
] as const;

interface GymClassesViewProps {
  onOpenPlans?: () => void;
}

export function GymClassesView({ onOpenPlans }: GymClassesViewProps) {
  const [classes, setClasses] = useState<GymClass[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gymflow_booked_classes_v2");
        if (saved) {
          const bookedIds: string[] = JSON.parse(saved);
          return INITIAL_CLASSES.map((c) => ({
            ...c,
            isBooked: bookedIds.includes(c.id),
            bookedSpots: bookedIds.includes(c.id) ? c.bookedSpots + 1 : c.bookedSpots,
          }));
        }
      } catch {}
    }
    return INITIAL_CLASSES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "video" | "live" | "booked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassForVideo, setSelectedClassForVideo] = useState<GymClass | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isGateOpen, setIsGateOpen] = useState(false);

  const access = canAccessFeature("collective_classes");

  // Salvar reservas persistidas
  const handleToggleBooking = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!access.allowed) {
      triggerHaptic("warning");
      setIsGateOpen(true);
      return;
    }

    triggerHaptic("medium");
    setClasses((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        const newIsBooked = !item.isBooked;
        return {
          ...item,
          isBooked: newIsBooked,
          bookedSpots: newIsBooked ? item.bookedSpots + 1 : Math.max(0, item.bookedSpots - 1),
        };
      });

      if (typeof window !== "undefined") {
        try {
          const bookedIds = updated.filter((c) => c.isBooked).map((c) => c.id);
          localStorage.setItem("gymflow_booked_classes_v2", JSON.stringify(bookedIds));
        } catch {}
      }

      return updated;
    });
  };

  const handleOpenVideo = (gymClass: GymClass) => {
    triggerHaptic("selection");
    setSelectedClassForVideo(gymClass);
    setIsVideoModalOpen(true);
  };

  // Filtragem e busca reativa
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      // Categoria
      if (selectedCategory !== "Todas" && c.category !== selectedCategory) {
        return false;
      }

      // Tipo de Filtro
      if (activeFilterTab === "video" && !c.isOnDemand) return false;
      if (activeFilterTab === "live" && !c.isLiveToday) return false;
      if (activeFilterTab === "booked" && !c.isBooked) return false;

      // Busca por texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesInstructor = c.instructor.toLowerCase().includes(query);
        const matchesCategory = c.category.toLowerCase().includes(query);
        const matchesMuscles = c.targetMuscles.some((m) => m.toLowerCase().includes(query));
        const matchesEquipment = c.equipment.some((eq) => eq.toLowerCase().includes(query));
        return matchesTitle || matchesInstructor || matchesCategory || matchesMuscles || matchesEquipment;
      }

      return true;
    });
  }, [classes, selectedCategory, activeFilterTab, searchQuery]);

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Banner Informativo de Plano se o usuário estiver no Básico */}
      {!access.allowed && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-950 border border-purple-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Aulas Coletivas & Vídeos: Exclusivo Planos Pro & VIP
              </p>
              <p className="text-[11px] text-zinc-400">
                Assista aulas completas guiadas e reserve suas vagas presenciais.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onOpenPlans) onOpenPlans();
              else setIsGateOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs shrink-0 active:scale-95 transition-all shadow-md shadow-purple-500/20"
          >
            Fazer Upgrade
          </button>
        </div>
      )}

      {/* Resumo de Métricas das Aulas */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Catálogo</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-white">{classes.length}</span>
            <span className="text-[10px] text-zinc-500">aulas</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Queima Média</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-emerald-400">~520</span>
            <span className="text-[10px] text-emerald-500/70">kcal</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-amber-400">Em Vídeo</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-amber-400">100%</span>
            <span className="text-[10px] text-amber-500/70">guiado</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar aula por nome, professor, modalidade ou músculo..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Sub-filtros por Modo (Todas / Em Vídeo / Ao Vivo / Inscrito) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveFilterTab("all");
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilterTab === "all"
              ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveFilterTab("video");
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeFilterTab === "video"
              ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Video className="w-3 h-3" />
          <span>Em Vídeo</span>
        </button>
        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveFilterTab("live");
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeFilterTab === "live"
              ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Radio className="w-3 h-3 text-red-500 animate-pulse" />
          <span>Ao Vivo</span>
        </button>
        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveFilterTab("booked");
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeFilterTab === "booked"
              ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Bookmark className="w-3 h-3" />
          <span>Inscrito</span>
        </button>
      </div>

      {/* Categorias em Pílulas com Scroll Horizontal */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              triggerHaptic("light");
              setSelectedCategory(cat);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista / Grade de Cards de Aulas */}
      <div className="flex flex-col gap-3.5">
        {filteredClasses.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col items-center">
            <Video className="w-10 h-10 text-zinc-600 mb-2" />
            <p className="text-sm font-bold text-white">Nenhuma aula encontrada</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Tente mudar a categoria selecionada ou limpar o termo de busca.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("Todas");
                setActiveFilterTab("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-white"
            >
              Ver Todas as Aulas
            </button>
          </div>
        ) : (
          filteredClasses.map((item) => {
            const spotsLeft = item.totalSpots - item.bookedSpots;
            const isFull = spotsLeft <= 0 && !item.isBooked;

            return (
              <div
                key={item.id}
                onClick={() => handleOpenVideo(item)}
                className={`rounded-3xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                  item.isBooked
                    ? "bg-gradient-to-b from-emerald-950/30 to-zinc-950 border-emerald-500/40 shadow-[0_4px_25px_rgba(16,185,129,0.12)]"
                    : "bg-zinc-900/60 hover:bg-zinc-900/80 border-white/[0.08] hover:border-white/[0.15]"
                }`}
              >
                {/* Imagem de Capa 16:9 com Overlay e Botão de Play */}
                <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] bg-zinc-950 overflow-hidden">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                  {/* Badges Flutuantes na Imagem */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    {item.isLiveToday && (
                      <span className="px-2 py-0.5 rounded-lg bg-red-600/90 text-white font-black text-[10px] flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        AO VIVO {item.time}
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                      {item.category}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10">
                      {item.difficulty}
                    </span>
                  </div>

                  {/* Botão de Play Centralizado */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-emerald-500/90 group-hover:bg-emerald-400 text-black flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-all">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{item.instructor}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-400 font-mono text-xs font-bold shrink-0 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.durationMinutes} min</span>
                    </div>
                  </div>

                  {/* Descrição Curta */}
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Tags de Músculos & Equipamentos */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    {item.targetMuscles.slice(0, 3).map((m, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.04]"
                      >
                        {m}
                      </span>
                    ))}
                    {item.targetMuscles.length > 3 && (
                      <span className="text-[10px] text-zinc-500 font-semibold">
                        +{item.targetMuscles.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Barra de Rodapé: Calorias, Vagas & Botão de Reserva */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06] text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Flame className="w-4 h-4 fill-amber-400" />
                        ~{item.caloriesBurnEstimate} kcal
                      </span>

                      <span className="flex items-center gap-1 text-zinc-400">
                        {spotsLeft > 0 ? (
                          <span className="text-zinc-400">
                            <strong className="text-emerald-400">{spotsLeft}</strong> vagas
                          </span>
                        ) : (
                          <span className="text-red-400 font-bold">Lotada</span>
                        )}
                      </span>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenVideo(item);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-xs flex items-center gap-1 transition-all"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span className="hidden xs:inline">Assistir</span>
                      </button>

                      <button
                        disabled={isFull && !item.isBooked}
                        onClick={(e) => handleToggleBooking(item.id, e)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 ${
                          !access.allowed
                            ? "bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30"
                            : item.isBooked
                            ? "bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/35"
                            : isFull
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "bg-emerald-500 text-black shadow-[0_0_14px_rgba(16,185,129,0.3)] hover:bg-emerald-400"
                        }`}
                      >
                        {!access.allowed ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Pro</span>
                          </>
                        ) : item.isBooked ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Inscrito</span>
                          </>
                        ) : isFull ? (
                          "Lotada"
                        ) : (
                          "Reservar"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Interativo de Vídeo & Detalhes da Aula */}
      <ClassVideoModal
        isOpen={isVideoModalOpen}
        gymClass={selectedClassForVideo}
        onClose={() => {
          setIsVideoModalOpen(false);
          setSelectedClassForVideo(null);
        }}
      />

      {/* Modal de Bloqueio & Upgrade Pro/VIP */}
      <FeatureGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        feature="collective_classes"
        requiredPlan="pro"
        onOpenPlans={() => {
          setIsGateOpen(false);
          if (onOpenPlans) onOpenPlans();
        }}
      />
    </div>
  );
}
