/**
 * ExerciseDB API Integration & Local Catalog Engine
 * Suporta o catálogo nativo offline-first e chamadas à ExerciseDB API (RapidAPI ou self-hosted)
 */

export interface ExerciseDBItem {
  id: string;
  name: string;
  bodyPart: "chest" | "back" | "shoulders" | "upper arms" | "lower arms" | "upper legs" | "lower legs" | "waist" | "cardio";
  target: string;
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "body weight" | "smith machine" | "band";
  gifUrl?: string;
  instructions: string[];
  difficulty?: "Iniciante" | "Intermediário" | "Avançado";
}

export interface WorkoutSetTemplate {
  setNumber: number;
  reps: number | string;
  weightKg: number;
  completed?: boolean;
}

export interface ExerciseInWorkout {
  id: string;
  exerciseId: string;
  name: string;
  muscle: string;
  equipment: string;
  target: string;
  restSeconds: number;
  notes?: string;
  sets: WorkoutSetTemplate[];
}

export interface WorkoutSplitTemplate {
  id: "A" | "B" | "C" | "D";
  title: string;
  muscles: string;
  estimatedMinutes: number;
  exercises: ExerciseInWorkout[];
}

export interface PreFormedWorkoutRoutine {
  id: string;
  name: string;
  category: "Hipertrofia" | "Definição" | "Força" | "Feminino / Glúteos" | "Iniciante";
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  description: string;
  frequency: string;
  splits: WorkoutSplitTemplate[];
}

// -------------------------------------------------------------
// CATÁLOGO EXPANDIDO DE EXERCÍCIOS BASEADOS NA EXERCISEDB
// -------------------------------------------------------------
export const LOCAL_EXERCISE_DB: ExerciseDBItem[] = [
  // PEITO (CHEST)
  {
    id: "ex_bench_press",
    name: "Supino Reto com Barra",
    bodyPart: "chest",
    target: "Peitoral Maior",
    equipment: "barbell",
    instructions: [
      "Deite-se no banco plano com os olhos alinhados à barra.",
      "Pegada ligeiramente mais larga que os ombros, escápulas retraídas.",
      "Desça a barra controladamente até o terço inferior do peito e empurre.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_incline_dumbbell_press",
    name: "Supino Inclinado com Halteres",
    bodyPart: "chest",
    target: "Peitoral Superior (Clavicular)",
    equipment: "dumbbell",
    instructions: [
      "Ajuste o banco entre 30° e 45°.",
      "Mantenha os cotovelos a 75° do tronco.",
      "Eleve os halteres em arco suave sem bater um no outro no topo.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_cable_crossover",
    name: "Crossover no Pulley",
    bodyPart: "chest",
    target: "Peitoral Maior (Fase Medial)",
    equipment: "cable",
    instructions: [
      "Posicione os cabos na altura média ou alta.",
      "Tronco levemente inclinado para frente, cotovelos semiflexionados.",
      "Aperte as mãos à frente do peito segurando o pico de contração por 1s.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_dips_chest",
    name: "Paralelas com Foco no Peito",
    bodyPart: "chest",
    target: "Peitoral Inferior & Tríceps",
    equipment: "body weight",
    instructions: [
      "Incline o tronco para a frente em aproximadamente 30 graus.",
      "Desça até os cotovelos atingirem 90 graus de flexão.",
      "Empurre ativando a porção inferior do peitoral.",
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_chest_press_machine",
    name: "Supino Reto Articulado / Máquina",
    bodyPart: "chest",
    target: "Peitoral Maior",
    equipment: "machine",
    instructions: [
      "Ajuste a altura do banco para que as manoplas fiquem na linha do peito.",
      "Mantenha os pés firmes e escápulas aduzidas.",
      "Empurre de forma explosiva e controle a volta por 3 segundos.",
    ],
    difficulty: "Iniciante",
  },

  // COSTAS (BACK)
  {
    id: "ex_lat_pulldown",
    name: "Puxada Frontal Aberta",
    bodyPart: "back",
    target: "Latíssimo do Dorso",
    equipment: "cable",
    instructions: [
      "Segure a barra com pegada pronada aberta.",
      "Puxe a barra em direção à parte superior do peito direcionando cotovelos para baixo.",
      "Evite balançar excessivamente o tronco para trás.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_barbell_bent_over_row",
    name: "Remada Curvada com Barra",
    bodyPart: "back",
    target: "Espessura Dorsal & Romboides",
    equipment: "barbell",
    instructions: [
      "Incline o tronco a 45° mantendo a coluna neutra e joelhos semiflexionados.",
      "Puxe a barra em direção à cicatriz umbilical.",
      "Aperte as escápulas no topo e desça com amplitude completa.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_seated_cable_row",
    name: "Remada Baixa com Triângulo",
    bodyPart: "back",
    target: "Latíssimo e Miolo das Costas",
    equipment: "cable",
    instructions: [
      "Sente-se com pés apoiados e coluna ereta.",
      "Puxe a manopla contra o abdômen sem hiperextender a lombar.",
      "Alongue bem as dorsais na fase excêntrica.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_deadlift",
    name: "Levantamento Terra Clássico",
    bodyPart: "back",
    target: "Cadeia Posterior, Lombar e Dorsais",
    equipment: "barbell",
    instructions: [
      "Pés na largura dos quadris, barra rente às canelas.",
      "Abdômen travado com manobra de Valsalva.",
      "Suba estendendo joelhos e quadris simultaneamente com a barra colada ao corpo.",
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_pullup",
    name: "Barra Fixa Pronada",
    bodyPart: "back",
    target: "Latíssimo do Dorso",
    equipment: "body weight",
    instructions: [
      "Pegada mais larga que os ombros, corpo suspenso.",
      "Inicie a tração com as escápulas antes dos braços.",
      "Passe o queixo acima da barra e desça controlado.",
    ],
    difficulty: "Avançado",
  },

  // PERNAS & GLÚTEOS (UPPER LEGS & GLUTES)
  {
    id: "ex_barbell_squat",
    name: "Agachamento Livre com Barra",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteos & Core",
    equipment: "barbell",
    instructions: [
      "Barra apoiada sobre o trapézio, pés na largura dos ombros.",
      "Desça flexionando quadris e joelhos até que as coxas quebrem o paralelo (90°).",
      "Empurre o chão através dos calcanhares mantendo o peito ereto.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_leg_press_45",
    name: "Leg Press 45°",
    bodyPart: "upper legs",
    target: "Quadríceps e Glúteos",
    equipment: "machine",
    instructions: [
      "Pés no meio da plataforma na largura dos ombros.",
      "Destrave o peso e desça até que os joelhos formem 90 graus sem tirar o quadril do encosto.",
      "Empurre sem travar/hiperextender totalmente os joelhos no final.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_hip_thrust",
    name: "Elevação Pélvica com Barra",
    bodyPart: "upper legs",
    target: "Glúteo Máximo",
    equipment: "barbell",
    instructions: [
      "Apoie as costas no banco abaixo das escápulas, barra sobre o quadril com almofada.",
      "Pés firmes no chão, canelas verticais no topo do movimento.",
      "Estenda o quadril completamente e contraia os glúteos por 2 segundos no topo.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_bulgarian_split_squat",
    name: "Agachamento Búlgaro com Halteres",
    bodyPart: "upper legs",
    target: "Glúteo e Quadríceps Unilateral",
    equipment: "dumbbell",
    instructions: [
      "Apoie o peito do pé de trás sobre um banco.",
      "Desça o joelho de trás em direção ao chão mantendo o tronco levemente inclinado à frente.",
      "Empurre pela perna da frente focando na ativação glútea.",
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_leg_extension",
    name: "Cadeira Extensora",
    bodyPart: "upper legs",
    target: "Reto Femoral / Quadríceps",
    equipment: "machine",
    instructions: [
      "Ajuste o rolo logo acima dos tornozelos e o encosto na lombar.",
      "Estenda as pernas controlando o movimento, segure 1 segundo no pico.",
      "Retorne lentamente sem deixar as placas de peso baterem.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_seated_leg_curl",
    name: "Cadeira Flexora",
    bodyPart: "upper legs",
    target: "Isquiotibiais (Posterior de Coxa)",
    equipment: "machine",
    instructions: [
      "Trave a almofada firmemente acima dos joelhos.",
      "Flexione as pernas para trás puxando o calcanhar sob o assento.",
      "Sinta o posterior de coxa alongar durante a subida controlada.",
    ],
    difficulty: "Iniciante",
  },

  // OMBROS (SHOULDERS)
  {
    id: "ex_dumbbell_shoulder_press",
    name: "Desenvolvimento com Halteres",
    bodyPart: "shoulders",
    target: "Deltoide Anterior & Lateral",
    equipment: "dumbbell",
    instructions: [
      "Banco em 75°-80°, halteres na altura das orelhas.",
      "Pressione os pesos acima da cabeça em arco convergente.",
      "Desça lentamente sem relaxar a tensão muscular.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_lateral_raise",
    name: "Elevação Lateral com Halteres",
    bodyPart: "shoulders",
    target: "Deltoide Lateral",
    equipment: "dumbbell",
    instructions: [
      "Corpo levemente inclinado para a frente, cotovelos levemente flexionados.",
      "Eleve os braços lateralmente até a linha dos ombros.",
      "Foque em liderar a subida pelos cotovelos, não pelos punhos.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_face_pull",
    name: "Face Pull na Polia",
    bodyPart: "shoulders",
    target: "Deltoide Posterior & Manguito",
    equipment: "cable",
    instructions: [
      "Corda na altura do rosto ou olhos.",
      "Puxe em direção à testa afastando as mãos e rotacionando externamente os ombros.",
      "Excelente para postura e proteção articular dos ombros.",
    ],
    difficulty: "Iniciante",
  },

  // BRAÇOS (UPPER ARMS - BICEPS & TRICEPS)
  {
    id: "ex_barbell_curl",
    name: "Rosca Direta com Barra W",
    bodyPart: "upper arms",
    target: "Bíceps Braquial",
    equipment: "barbell",
    instructions: [
      "Cotovelos colados ao lado do tronco durante toda a execução.",
      "Flexione os braços sem balançar a lombar.",
      "Desça estendendo quase por completo sem relaxar a tensão.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_incline_dumbbell_curl",
    name: "Rosca Inclinada 45°",
    bodyPart: "upper arms",
    target: "Cabeça Longa do Bíceps",
    equipment: "dumbbell",
    instructions: [
      "Deite em banco inclinado a 45° com os braços suspensos para trás.",
      "Flexione os cotovelos mantendo o alongamento máximo na base.",
      "Supine os punhos no topo do movimento.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_triceps_rope_pushdown",
    name: "Tríceps Corda no Pulley",
    bodyPart: "upper arms",
    target: "Cabeça Lateral do Tríceps",
    equipment: "cable",
    instructions: [
      "Prenda a corda na polia alta, cotovelos travados ao lado do corpo.",
      "Empurre para baixo e abra as pontas da corda na extensão total.",
      "Retorne até os antebraços formarem 90 graus.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_skull_crusher",
    name: "Tríceps Testa com Barra W",
    bodyPart: "upper arms",
    target: "Cabeça Longa e Medial do Tríceps",
    equipment: "barbell",
    instructions: [
      "Deitado no banco, barra suspensa com braços verticais.",
      "Flexione os cotovelos descendo a barra até a testa ou pouco atrás da cabeça.",
      "Estenda os antebraços mantendo os cotovelos estáveis.",
    ],
    difficulty: "Intermediário",
  },

  // ABDÔMEN & CORE (WAIST)
  {
    id: "ex_hanging_leg_raise",
    name: "Elevação de Pernas na Barra Fixa",
    bodyPart: "waist",
    target: "Abdômen Infra & Flexores de Quadril",
    equipment: "body weight",
    instructions: [
      "Pendure-se na barra fixa com pegada firme.",
      "Eleve os joelhos ou pernas retas em direção ao peito arredondando a bacia.",
      "Desça sem usar o balanço pendular do corpo.",
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_cable_crunch",
    name: "Abdominal no Pulley (Cable Crunch)",
    bodyPart: "waist",
    target: "Reto Abdominal",
    equipment: "cable",
    instructions: [
      "Ajoelhe-se em frente à polia alta segurando a corda atrás da nuca.",
      "Flexione a coluna aproximando as costelas da pelve.",
      "Mantenha o quadril fixo, sem sentar nos calcanhares.",
    ],
    difficulty: "Intermediário",
  },
];

// -------------------------------------------------------------
// TEMPLATES DE TREINOS PRÉ-FORMADOS PRONTOS PARA O PROFESSOR
// -------------------------------------------------------------
export const PREFORMED_ROUTINES: PreFormedWorkoutRoutine[] = [
  {
    id: "routine_hypertrophy_abc",
    name: "Hipertrofia Clássica ABC (Push / Pull / Legs)",
    category: "Hipertrofia",
    difficulty: "Intermediário",
    frequency: "3 a 6 dias na semana",
    description: "Divisão mais consagrada da musculação para ganho de massa magra e densidade muscular.",
    splits: [
      {
        id: "A",
        title: "Treino A — Empurrar (Peito, Ombros & Tríceps)",
        muscles: "Peitoral, Deltoide Anterior e Tríceps",
        estimatedMinutes: 50,
        exercises: [
          {
            id: "e1",
            exerciseId: "ex_bench_press",
            name: "Supino Reto com Barra",
            muscle: "Peitoral Maior",
            equipment: "Barra Olímpica",
            target: "4 séries × 8-10 reps",
            restSeconds: 90,
            notes: "Cadência 3-0-1. Escápulas travadas no banco.",
            sets: [
              { setNumber: 1, reps: 10, weightKg: 60 },
              { setNumber: 2, reps: 10, weightKg: 70 },
              { setNumber: 3, reps: 8, weightKg: 80 },
              { setNumber: 4, reps: 8, weightKg: 80 },
            ],
          },
          {
            id: "e2",
            exerciseId: "ex_incline_dumbbell_press",
            name: "Supino Inclinado com Halteres",
            muscle: "Peitoral Superior",
            equipment: "Banco 30° + Halteres",
            target: "4 séries × 10-12 reps",
            restSeconds: 60,
            notes: "Alongamento profundo sem hiperextensão do ombro.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 24 },
              { setNumber: 2, reps: 10, weightKg: 26 },
              { setNumber: 3, reps: 10, weightKg: 28 },
              { setNumber: 4, reps: 10, weightKg: 28 },
            ],
          },
          {
            id: "e3",
            exerciseId: "ex_lateral_raise",
            name: "Elevação Lateral com Halteres",
            muscle: "Deltoide Lateral",
            equipment: "Halteres",
            target: "4 séries × 12-15 reps",
            restSeconds: 45,
            notes: "Conduza o movimento pelos cotovelos.",
            sets: [
              { setNumber: 1, reps: 15, weightKg: 10 },
              { setNumber: 2, reps: 12, weightKg: 12 },
              { setNumber: 3, reps: 12, weightKg: 12 },
              { setNumber: 4, reps: 12, weightKg: 12 },
            ],
          },
          {
            id: "e4",
            exerciseId: "ex_triceps_rope_pushdown",
            name: "Tríceps Corda no Pulley",
            muscle: "Tríceps Braquial",
            equipment: "Polia Alta + Corda",
            target: "4 séries × 12 reps",
            restSeconds: 45,
            notes: "Abra a corda na contração máxima.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 25 },
              { setNumber: 2, reps: 12, weightKg: 30 },
              { setNumber: 3, reps: 10, weightKg: 35 },
              { setNumber: 4, reps: 10, weightKg: 35 },
            ],
          },
        ],
      },
      {
        id: "B",
        title: "Treino B — Puxar (Dorsal, Posterior & Bíceps)",
        muscles: "Latíssimo, Romboides e Bíceps",
        estimatedMinutes: 50,
        exercises: [
          {
            id: "e5",
            exerciseId: "ex_lat_pulldown",
            name: "Puxada Frontal Aberta",
            muscle: "Latíssimo do Dorso",
            equipment: "Polia Alta",
            target: "4 séries × 10 reps",
            restSeconds: 75,
            notes: "Puxe direcionando cotovelos para o chão.",
            sets: [
              { setNumber: 1, reps: 10, weightKg: 55 },
              { setNumber: 2, reps: 10, weightKg: 65 },
              { setNumber: 3, reps: 8, weightKg: 70 },
              { setNumber: 4, reps: 8, weightKg: 70 },
            ],
          },
          {
            id: "e6",
            exerciseId: "ex_barbell_bent_over_row",
            name: "Remada Curvada com Barra",
            muscle: "Espessura Dorsal",
            equipment: "Barra + Anilhas",
            target: "4 séries × 8-10 reps",
            restSeconds: 90,
            notes: "Lombar travada em 45 graus.",
            sets: [
              { setNumber: 1, reps: 10, weightKg: 50 },
              { setNumber: 2, reps: 10, weightKg: 60 },
              { setNumber: 3, reps: 8, weightKg: 70 },
              { setNumber: 4, reps: 8, weightKg: 70 },
            ],
          },
          {
            id: "e7",
            exerciseId: "ex_barbell_curl",
            name: "Rosca Direta com Barra W",
            muscle: "Bíceps Braquial",
            equipment: "Barra W",
            target: "4 séries × 10-12 reps",
            restSeconds: 60,
            notes: "Sem usar embalo corporal.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 20 },
              { setNumber: 2, reps: 10, weightKg: 25 },
              { setNumber: 3, reps: 10, weightKg: 25 },
              { setNumber: 4, reps: 8, weightKg: 30 },
            ],
          },
        ],
      },
      {
        id: "C",
        title: "Treino C — Pernas Completo (Inferiores & Core)",
        muscles: "Quadríceps, Glúteos, Isquiotibiais & Panturrilhas",
        estimatedMinutes: 55,
        exercises: [
          {
            id: "e8",
            exerciseId: "ex_barbell_squat",
            name: "Agachamento Livre com Barra",
            muscle: "Quadríceps e Glúteos",
            equipment: "Barra Olímpica",
            target: "4 séries × 8-10 reps",
            restSeconds: 120,
            notes: "Quebre o paralelo com peito aberto.",
            sets: [
              { setNumber: 1, reps: 10, weightKg: 80 },
              { setNumber: 2, reps: 10, weightKg: 90 },
              { setNumber: 3, reps: 8, weightKg: 100 },
              { setNumber: 4, reps: 8, weightKg: 100 },
            ],
          },
          {
            id: "e9",
            exerciseId: "ex_leg_press_45",
            name: "Leg Press 45°",
            muscle: "Quadríceps e Glúteos",
            equipment: "Aparelho 45°",
            target: "4 séries × 12 reps",
            restSeconds: 75,
            notes: "Não hiperextenda os joelhos no topo.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 160 },
              { setNumber: 2, reps: 12, weightKg: 200 },
              { setNumber: 3, reps: 10, weightKg: 220 },
              { setNumber: 4, reps: 10, weightKg: 220 },
            ],
          },
          {
            id: "e10",
            exerciseId: "ex_seated_leg_curl",
            name: "Cadeira Flexora",
            muscle: "Isquiotibiais",
            equipment: "Aparelho Flexor",
            target: "4 séries × 12 reps",
            restSeconds: 60,
            notes: "Segure 1s na contração do calcanhar.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 40 },
              { setNumber: 2, reps: 12, weightKg: 45 },
              { setNumber: 3, reps: 10, weightKg: 50 },
              { setNumber: 4, reps: 10, weightKg: 50 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "routine_female_glutes",
    name: "Foco Glúteos & Coxas (Especial Feminino)",
    category: "Feminino / Glúteos",
    difficulty: "Intermediário",
    frequency: "4 dias na semana",
    description: "Estruturado com alta ativação eletromiográfica do glúteo máximo e modelagem de quadríceps.",
    splits: [
      {
        id: "A",
        title: "Treino A — Foco Glúteo Máximo & Isquiotibiais",
        muscles: "Glúteo Máximo, Médio e Posterior de Coxa",
        estimatedMinutes: 50,
        exercises: [
          {
            id: "fg1",
            exerciseId: "ex_hip_thrust",
            name: "Elevação Pélvica com Barra",
            muscle: "Glúteo Máximo",
            equipment: "Barra + Almofada",
            target: "4 séries × 10-12 reps",
            restSeconds: 90,
            notes: "2 segundos de isometria no topo em cada repetição.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 60 },
              { setNumber: 2, reps: 12, weightKg: 70 },
              { setNumber: 3, reps: 10, weightKg: 80 },
              { setNumber: 4, reps: 10, weightKg: 90 },
            ],
          },
          {
            id: "fg2",
            exerciseId: "ex_bulgarian_split_squat",
            name: "Agachamento Búlgaro com Halteres",
            muscle: "Glúteo & Quadríceps",
            equipment: "Halteres + Banco",
            target: "3 séries × 10 reps cada perna",
            restSeconds: 60,
            notes: "Incline o tronco 20° para recrutar mais glúteo.",
            sets: [
              { setNumber: 1, reps: 10, weightKg: 10 },
              { setNumber: 2, reps: 10, weightKg: 12 },
              { setNumber: 3, reps: 10, weightKg: 12 },
            ],
          },
          {
            id: "fg3",
            exerciseId: "ex_seated_leg_curl",
            name: "Cadeira Flexora",
            muscle: "Posterior de Coxa",
            equipment: "Máquina Flexora",
            target: "4 séries × 12 reps",
            restSeconds: 45,
            notes: "Foco na fase excêntrica lenta.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 35 },
              { setNumber: 2, reps: 12, weightKg: 40 },
              { setNumber: 3, reps: 10, weightKg: 45 },
              { setNumber: 4, reps: 10, weightKg: 45 },
            ],
          },
        ],
      },
      {
        id: "B",
        title: "Treino B — Superior & Deltoides Harmônicos",
        muscles: "Dorsais, Ombros e Tríceps",
        estimatedMinutes: 45,
        exercises: [
          {
            id: "fg4",
            exerciseId: "ex_lat_pulldown",
            name: "Puxada Frontal Aberta",
            muscle: "Dorsal",
            equipment: "Polia",
            target: "4 séries × 12 reps",
            restSeconds: 60,
            notes: "Criação de cintura visualmente mais fina.",
            sets: [
              { setNumber: 1, reps: 12, weightKg: 30 },
              { setNumber: 2, reps: 12, weightKg: 35 },
              { setNumber: 3, reps: 10, weightKg: 40 },
              { setNumber: 4, reps: 10, weightKg: 40 },
            ],
          },
          {
            id: "fg5",
            exerciseId: "ex_lateral_raise",
            name: "Elevação Lateral com Halteres",
            muscle: "Deltoide Lateral",
            equipment: "Halteres",
            target: "4 séries × 15 reps",
            restSeconds: 45,
            notes: "Execução cadenciada sem trancos.",
            sets: [
              { setNumber: 1, reps: 15, weightKg: 5 },
              { setNumber: 2, reps: 15, weightKg: 6 },
              { setNumber: 3, reps: 12, weightKg: 7 },
              { setNumber: 4, reps: 12, weightKg: 7 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "routine_strength_5x5",
    name: "Força Bruta 5×5 (Compostos Básicos)",
    category: "Força",
    difficulty: "Avançado",
    frequency: "3 dias na semana",
    description: "Método clássico para maximizar o recrutamento neural e quebrar recordes pessoais de carga.",
    splits: [
      {
        id: "A",
        title: "Treino A — Base de Força",
        muscles: "Quadríceps, Peito e Dorsal",
        estimatedMinutes: 60,
        exercises: [
          {
            id: "s1",
            exerciseId: "ex_barbell_squat",
            name: "Agachamento Livre com Barra",
            muscle: "Quadríceps & Glúteos",
            equipment: "Barra Olímpica",
            target: "5 séries × 5 reps",
            restSeconds: 150,
            notes: "Carga pesada. Descanso longo obrigatório.",
            sets: [
              { setNumber: 1, reps: 5, weightKg: 100 },
              { setNumber: 2, reps: 5, weightKg: 110 },
              { setNumber: 3, reps: 5, weightKg: 120 },
              { setNumber: 4, reps: 5, weightKg: 120 },
              { setNumber: 5, reps: 5, weightKg: 120 },
            ],
          },
          {
            id: "s2",
            exerciseId: "ex_bench_press",
            name: "Supino Reto com Barra",
            muscle: "Peitoral Maior",
            equipment: "Barra Olímpica",
            target: "5 séries × 5 reps",
            restSeconds: 150,
            notes: "Arco torácico e leg drive estáveis.",
            sets: [
              { setNumber: 1, reps: 5, weightKg: 80 },
              { setNumber: 2, reps: 5, weightKg: 85 },
              { setNumber: 3, reps: 5, weightKg: 90 },
              { setNumber: 4, reps: 5, weightKg: 90 },
              { setNumber: 5, reps: 5, weightKg: 90 },
            ],
          },
          {
            id: "s3",
            exerciseId: "ex_barbell_bent_over_row",
            name: "Remada Curvada com Barra",
            muscle: "Dorsal & Trapézio",
            equipment: "Barra + Anilhas",
            target: "5 séries × 5 reps",
            restSeconds: 120,
            notes: "Potência controlada na fase concêntrica.",
            sets: [
              { setNumber: 1, reps: 5, weightKg: 70 },
              { setNumber: 2, reps: 5, weightKg: 75 },
              { setNumber: 3, reps: 5, weightKg: 80 },
              { setNumber: 4, reps: 5, weightKg: 80 },
              { setNumber: 5, reps: 5, weightKg: 80 },
            ],
          },
        ],
      },
    ],
  },
];

// -------------------------------------------------------------
// SERVIÇO DE BUSCA E INTEGRAÇÃO REMOTA (EXERCISEDB API)
// -------------------------------------------------------------
export async function searchExercises(
  query: string = "",
  filters?: {
    bodyPart?: string;
    equipment?: string;
  }
): Promise<ExerciseDBItem[]> {
  const apiKey = process.env.NEXT_PUBLIC_EXERCISE_DB_API_KEY || process.env.EXERCISE_DB_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_EXERCISE_DB_BASE_URL || "https://exercisedb.p.rapidapi.com";

  // Se houver chave RapidAPI configurada, tenta buscar na API externa com fallback transparente
  if (apiKey && query.trim()) {
    try {
      const endpoint = `${baseUrl}/exercises/name/${encodeURIComponent(query.toLowerCase())}?limit=20`;
      const res = await fetch(endpoint, {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      });
      if (res.ok) {
        const remoteData = await res.json();
        if (Array.isArray(remoteData) && remoteData.length > 0) {
          return remoteData.map((item: any) => ({
            id: item.id || `remote_${Math.random()}`,
            name: item.name,
            bodyPart: item.bodyPart,
            target: item.target,
            equipment: item.equipment,
            gifUrl: item.gifUrl,
            instructions: Array.isArray(item.instructions) ? item.instructions : [item.instructions || ""],
            difficulty: "Intermediário",
          }));
        }
      }
    } catch (e) {
      console.warn("ExerciseDB Remote fetch fallback to local database:", e);
    }
  }

  // Busca no catálogo local nativo
  let filtered = LOCAL_EXERCISE_DB;

  if (filters?.bodyPart && filters.bodyPart !== "todos") {
    filtered = filtered.filter((ex) => ex.bodyPart === filters.bodyPart);
  }

  if (filters?.equipment && filters.equipment !== "todos") {
    filtered = filtered.filter((ex) => ex.equipment === filters.equipment);
  }

  if (query.trim()) {
    const term = query.toLowerCase().trim();
    filtered = filtered.filter(
      (ex) =>
        ex.name.toLowerCase().includes(term) ||
        ex.target.toLowerCase().includes(term) ||
        ex.bodyPart.toLowerCase().includes(term)
    );
  }

  return filtered;
}
