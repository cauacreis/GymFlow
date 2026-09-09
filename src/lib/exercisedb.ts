/**
 * ExerciseDB API Integration & Local Catalog Engine
 * Suporta o catálogo nativo offline-first com animações (frames ExerciseDB) e chamadas à API
 */

export interface ExerciseDBItem {
  id: string;
  name: string;
  bodyPart: "chest" | "back" | "shoulders" | "upper arms" | "lower arms" | "upper legs" | "lower legs" | "waist" | "cardio";
  target: string;
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "body weight" | "smith machine" | "band";
  gifUrl?: string;
  mediaFrames?: string[];
  instructions: string[];
  tips?: string[];
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
  gifUrl?: string;
  mediaFrames?: string[];
  instructions?: string[];
  tips?: string[];
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

const CDN_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// -------------------------------------------------------------
// CATÁLOGO EXPANDIDO DE EXERCÍCIOS BASEADOS NA EXERCISEDB
// COM ANIMAÇÕES (FRAMES CONCÊNTRICO/EXCÊNTRICO) E DICAS DO PERSONAL
// -------------------------------------------------------------
export const LOCAL_EXERCISE_DB: ExerciseDBItem[] = [
  // TREINO EM CASA / CALISTENIA (0 EQUIPAMENTOS)
  {
    id: "ex_pushups",
    name: "Flexão de Braço (Push-ups)",
    bodyPart: "chest",
    target: "Peitoral, Tríceps & Core",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Pushups/0.jpg`,
      `${CDN_BASE}/Pushups/1.jpg`,
    ],
    instructions: [
      "Posicione as palmas das mãos no chão, ligeiramente mais afastadas que a largura dos ombros.",
      "Mantenha o corpo alinhado da cabeça aos calcanhares, glúteos e abdômen contraídos.",
      "Desça flexionando os cotovelos a 45° até o peito quase tocar o chão e empurre com força.",
    ],
    tips: [
      "Mantenha a coluna neutra: nunca deixe o quadril desabar.",
      "Expire no momento em que empurra o chão e inspire na descida.",
      "Se cansar, apoie os joelhos temporariamente para manter o volume.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_bodyweight_squat",
    name: "Agachamento Livre (Peso do Corpo)",
    bodyPart: "upper legs",
    target: "Quadríceps & Glúteos",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Bodyweight_Squat/0.jpg`,
      `${CDN_BASE}/Bodyweight_Squat/1.jpg`,
    ],
    instructions: [
      "Fique em pé com os pés na largura dos ombros e pontas apontando levemente para fora.",
      "Inicie o movimento projetando os quadris para trás como se fosse sentar em uma cadeira.",
      "Desça até os quadris ultrapassarem a linha dos joelhos (quebrar 90°) mantendo o peito ereto.",
      "Empurre através de toda a sola do pé retornando à posição ereta.",
    ],
    tips: [
      "Não deixe os joelhos fecharem para dentro (valgo dinâmico).",
      "Mantenha os calcanhares totalmente colados ao chão.",
      "Olhe fixamente para a frente para estabilizar o equilíbrio.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_plank",
    name: "Prancha Abdominal Isométrica",
    bodyPart: "waist",
    target: "Core, Reto Abdominal & Transverso",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Plank/0.jpg`,
      `${CDN_BASE}/Plank/0.jpg`,
    ],
    instructions: [
      "Apoie os antebraços no chão alinhados logo abaixo da linha dos ombros.",
      "Apoie as pontas dos pés atrás mantendo o corpo reto como uma prancha rígida.",
      "Puxe o umbigo para dentro em direção à coluna e mantenha a respiração estável.",
    ],
    tips: [
      "Contraia fortemente os glúteos para tirar pressão da lombar.",
      "Não deixe o pescoço cair, mantenha a cabeça alinhada com as costas.",
      "Foque em isometria ativa de 30 a 60 segundos por série.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_bench_dips",
    name: "Tríceps no Banco / Cadeira",
    bodyPart: "upper arms",
    target: "Tríceps Braquial & Peitoral Inferior",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Bench_Dips/0.jpg`,
      `${CDN_BASE}/Bench_Dips/1.jpg`,
    ],
    instructions: [
      "Apoie as mãos na borda de um banco resistente, sofá ou cadeira com os dedos voltados para a frente.",
      "Estenda as pernas para a frente (ou flexione joelhos para facilitar).",
      "Desça o corpo flexionando os cotovelos até 90 graus, rente ao banco.",
      "Empurre de volta contraindo os tríceps no topo da extensão.",
    ],
    tips: [
      "Mantenha as costas o mais próximas possível do apoio durante a descida.",
      "Evite hiperflexionar os ombros para não sobrecarregar a articulação.",
      "Segure 1 segundo no pico de contração no topo.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_walking_lunge",
    name: "Passada / Avanço com Peso do Corpo",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteos & Isquiotibiais",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Bodyweight_Walking_Lunge/0.jpg`,
      `${CDN_BASE}/Bodyweight_Walking_Lunge/1.jpg`,
    ],
    instructions: [
      "Em pé com pés juntos, dê um passo largo para a frente.",
      "Desça o joelho de trás até quase tocar o chão formando 90° em ambas as pernas.",
      "Empurre pela perna da frente e avance com a perna oposta.",
    ],
    tips: [
      "Mantenha o tronco ereto e o core sempre ativado.",
      "O joelho da frente não deve colapsar para dentro.",
      "Distribua a carga no calcanhar do pé dianteiro.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_crunches",
    name: "Abdominal Supra Clássico",
    bodyPart: "waist",
    target: "Reto Abdominal (Foco Superior)",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Crunches/0.jpg`,
      `${CDN_BASE}/Crunches/1.jpg`,
    ],
    instructions: [
      "Deite-se no chão com os joelhos flexionados e pés apoiados.",
      "Apoie as mãos ao lado das orelhas sem puxar a nuca.",
      "Flexione a coluna elevando os ombros em direção aos joelhos, contraindo o abdômen.",
      "Retorne sem relaxar a musculatura abdominal.",
    ],
    tips: [
      "Imagine uma maçã entre seu queixo e peito para não forçar o pescoço.",
      "Solte todo o ar (expire) no ponto mais alto da contração.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_butt_lift_bridge",
    name: "Ponte de Glúteos no Solo (Glute Bridge)",
    bodyPart: "upper legs",
    target: "Glúteo Máximo & Isquiotibiais",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Butt_Lift_Bridge/0.jpg`,
      `${CDN_BASE}/Butt_Lift_Bridge/1.jpg`,
    ],
    instructions: [
      "Deite de costas com braços estendidos ao lado do corpo e joelhos flexionados.",
      "Pressione os calcanhares contra o solo e eleve o quadril até formar uma linha reta com as coxas.",
      "Aperte o glúteo no topo por 2 segundos antes de descer lentamente.",
    ],
    tips: [
      "Evite arquear a coluna lombar no topo, o movimento vem do quadril.",
      "Para aumentar a intensidade, faça com uma perna de cada vez (unilateral).",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_mountain_climbers",
    name: "Escalador na Prancha (Mountain Climbers)",
    bodyPart: "waist",
    target: "Core, Abdômen & Cardio",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Mountain_Climbers/0.jpg`,
      `${CDN_BASE}/Mountain_Climbers/1.jpg`,
    ],
    instructions: [
      "Inicie na posição de prancha alta com as mãos alinhadas aos ombros.",
      "Puxe um dos joelhos em direção ao peito em velocidade constante.",
      "Alterne as pernas rapidamente como se estivesse escalando em ritmo acelerado.",
    ],
    tips: [
      "Não eleve o quadril muito alto, mantenha-o no plano dos ombros.",
      "Excelente para queima calórica e condicionamento metabólico.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_jump_squat",
    name: "Agachamento com Salto (Jump Squat)",
    bodyPart: "upper legs",
    target: "Potência de Membros Inferiores & Glúteos",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Freehand_Jump_Squat/0.jpg`,
      `${CDN_BASE}/Freehand_Jump_Squat/1.jpg`,
    ],
    instructions: [
      "Posicione-se para o agachamento e desça até 90°.",
      "Exploda para cima num salto vertical impulsionando os braços.",
      "Aterrisse suavemente com as pontas dos pés flexionando os joelhos para absorver o impacto.",
    ],
    tips: [
      "Priorize uma aterrissagem macia e silenciosa para proteger os meniscos.",
      "Respire no agachamento e solte o ar na explosão do salto.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_russian_twist",
    name: "Russian Twist no Solo",
    bodyPart: "waist",
    target: "Oblíquos & Abdômen Lateral",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Russian_Twist/0.jpg`,
      `${CDN_BASE}/Russian_Twist/1.jpg`,
    ],
    instructions: [
      "Sente-se no chão, incline o tronco 45° para trás e retire levemente os pés do solo.",
      "Gire o tronco de um lado para o outro tocando as mãos próximo ao chão de cada lado.",
      "Mantenha o peito aberto e respiração contínua.",
    ],
    tips: [
      "Gire os ombros por completo e não apenas os braços.",
      "Se for difícil manter os pés suspensos, apoie os calcanhares no chão.",
    ],
    difficulty: "Iniciante",
  },

  // PEITO (CHEST - MUSCULAÇÃO)
  {
    id: "ex_bench_press",
    name: "Supino Reto com Barra",
    bodyPart: "chest",
    target: "Peitoral Maior",
    equipment: "barbell",
    mediaFrames: [
      `${CDN_BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
      `${CDN_BASE}/Barbell_Bench_Press_-_Medium_Grip/1.jpg`,
    ],
    instructions: [
      "Deite-se no banco plano com os olhos alinhados à barra.",
      "Pegada ligeiramente mais larga que os ombros, escápulas retraídas.",
      "Desça a barra controladamente até o terço inferior do peito e empurre.",
    ],
    tips: [
      "Plante os pés firmemente no chão para tração de força (leg drive).",
      "Cotovelos a 70 graus do tronco, nunca a 90 graus para preservar o manguito.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_incline_dumbbell_press",
    name: "Supino Inclinado com Halteres",
    bodyPart: "chest",
    target: "Peitoral Superior (Clavicular)",
    equipment: "dumbbell",
    mediaFrames: [
      `${CDN_BASE}/Incline_Dumbbell_Press/0.jpg`,
      `${CDN_BASE}/Incline_Dumbbell_Press/1.jpg`,
    ],
    instructions: [
      "Ajuste o banco entre 30° e 45°.",
      "Mantenha os cotovelos a 75° do tronco.",
      "Eleve os halteres em arco suave sem bater um no outro no topo.",
    ],
    tips: [
      "Não use inclinação acima de 45°, pois transfere a carga para os ombros.",
      "Desça sentindo o alongamento da porção clavicular do peito.",
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
    tips: ["Mantenha a articulação do cotovelo travada no mesmo ângulo."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_dips_chest",
    name: "Paralelas com Foco no Peito",
    bodyPart: "chest",
    target: "Peitoral Inferior & Tríceps",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Dips_-_Chest_Version/0.jpg`,
      `${CDN_BASE}/Dips_-_Chest_Version/1.jpg`,
    ],
    instructions: [
      "Incline o tronco para a frente em aproximadamente 30 graus.",
      "Desça até os cotovelos atingirem 90 graus de flexão.",
      "Empurre ativando a porção inferior do peitoral.",
    ],
    tips: ["Cruze as pernas atrás e mantenha o olhar para baixo para focar no peito."],
    difficulty: "Avançado",
  },

  // COSTAS (BACK)
  {
    id: "ex_lat_pulldown",
    name: "Puxada Frontal Aberta",
    bodyPart: "back",
    target: "Latíssimo do Dorso",
    equipment: "cable",
    mediaFrames: [
      `${CDN_BASE}/Wide-Grip_Lat_Pulldown/0.jpg`,
      `${CDN_BASE}/Wide-Grip_Lat_Pulldown/1.jpg`,
    ],
    instructions: [
      "Segure a barra com pegada pronada aberta.",
      "Puxe a barra em direção à parte superior do peito direcionando cotovelos para baixo.",
      "Evite balançar excessivamente o tronco para trás.",
    ],
    tips: [
      "Pense em 'puxar com os cotovelos' e não com as mãos para ativar as dorsais.",
      "Alongue totalmente as escápulas na subida.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_pullup",
    name: "Barra Fixa Pronada (Pull-up)",
    bodyPart: "back",
    target: "Latíssimo do Dorso & Bíceps",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Pullups/0.jpg`,
      `${CDN_BASE}/Pullups/1.jpg`,
    ],
    instructions: [
      "Pegada mais larga que os ombros, corpo suspenso.",
      "Inicie a tração com as escápulas antes dos braços.",
      "Passe o queixo acima da barra e desça controlado.",
    ],
    tips: ["Evite o 'kipping' ou impulso das pernas para foco máximo em hipertrofia."],
    difficulty: "Avançado",
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
    tips: ["Lombar travada, nunca curve as costas para evitar lesões."],
    difficulty: "Intermediário",
  },

  // PERNAS & GLÚTEOS (UPPER LEGS & GLUTES)
  {
    id: "ex_barbell_squat",
    name: "Agachamento Livre com Barra",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteos & Core",
    equipment: "barbell",
    mediaFrames: [
      `${CDN_BASE}/Barbell_Squat/0.jpg`,
      `${CDN_BASE}/Barbell_Squat/1.jpg`,
    ],
    instructions: [
      "Barra apoiada sobre o trapézio, pés na largura dos ombros.",
      "Desça flexionando quadris e joelhos até que as coxas quebrem o paralelo (90°).",
      "Empurre o chão através dos calcanhares mantendo o peito ereto.",
    ],
    tips: [
      "Mantenha os cotovelos sob a barra para suporte firme da parte superior das costas.",
      "Preencha o abdômen com ar na descida e solte na subida.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_hip_thrust",
    name: "Elevação Pélvica com Barra (Hip Thrust)",
    bodyPart: "upper legs",
    target: "Glúteo Máximo",
    equipment: "barbell",
    mediaFrames: [
      `${CDN_BASE}/Barbell_Hip_Thrust/0.jpg`,
      `${CDN_BASE}/Barbell_Hip_Thrust/1.jpg`,
    ],
    instructions: [
      "Apoie as costas no banco abaixo das escápulas, barra sobre o quadril com almofada.",
      "Pés firmes no chão, canelas verticais no topo do movimento.",
      "Estenda o quadril completamente e contraia os glúteos por 2 segundos no topo.",
    ],
    tips: [
      "Olhe sempre para a frente e mantenha o queixo apontado para o peito.",
      "Empurre com os calcanhares para isolar o glúteo.",
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
      "Empurre sem travar totalmente os joelhos no final.",
    ],
    tips: ["Nunca tire a lombar ou bacia do apoio do assento."],
    difficulty: "Iniciante",
  },

  // OMBROS (SHOULDERS)
  {
    id: "ex_dumbbell_shoulder_press",
    name: "Desenvolvimento com Halteres",
    bodyPart: "shoulders",
    target: "Deltoide Anterior & Lateral",
    equipment: "dumbbell",
    mediaFrames: [
      `${CDN_BASE}/Dumbbell_Shoulder_Press/0.jpg`,
      `${CDN_BASE}/Dumbbell_Shoulder_Press/1.jpg`,
    ],
    instructions: [
      "Banco em 75°-80°, halteres na altura das orelhas.",
      "Pressione os pesos acima da cabeça em arco convergente.",
      "Desça lentamente sem relaxar a tensão muscular.",
    ],
    tips: ["Não deixe a lombar arquear excessivamente para longe do banco."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_lateral_raise",
    name: "Elevação Lateral com Halteres",
    bodyPart: "shoulders",
    target: "Deltoide Lateral",
    equipment: "dumbbell",
    mediaFrames: [
      `${CDN_BASE}/Side_Lateral_Raise/0.jpg`,
      `${CDN_BASE}/Side_Lateral_Raise/1.jpg`,
    ],
    instructions: [
      "Corpo levemente inclinado para a frente, cotovelos levemente flexionados.",
      "Eleve os braços lateralmente até a linha dos ombros.",
      "Foque em liderar a subida pelos cotovelos, não pelos punhos.",
    ],
    tips: ["Evite usar embalo corporal ou jogar os halteres com os trapézios."],
    difficulty: "Iniciante",
  },

  // BRAÇOS (UPPER ARMS)
  {
    id: "ex_barbell_curl",
    name: "Rosca Direta com Barra",
    bodyPart: "upper arms",
    target: "Bíceps Braquial",
    equipment: "barbell",
    mediaFrames: [
      `${CDN_BASE}/Barbell_Curl/0.jpg`,
      `${CDN_BASE}/Barbell_Curl/1.jpg`,
    ],
    instructions: [
      "Cotovelos colados ao lado do tronco durante toda a execução.",
      "Flexione os braços sem balançar a lombar.",
      "Desça estendendo quase por completo sem relaxar a tensão.",
    ],
    tips: ["Não projete os cotovelos para a frente no topo do movimento."],
    difficulty: "Iniciante",
  },
];

// -------------------------------------------------------------
// TEMPLATES DE TREINOS PRÉ-FORMADOS PRONTOS PARA O PROFESSOR
// -------------------------------------------------------------
export const PREFORMED_ROUTINES: PreFormedWorkoutRoutine[] = [
  // 1. NOVO: TREINO EM CASA (0 EQUIPAMENTOS)
  {
    id: "routine_home_calisthenics",
    name: "Treino em Casa (0 Equipamentos / Peso do Corpo)",
    category: "Iniciante",
    difficulty: "Iniciante",
    frequency: "3 a 5 dias na semana",
    description: "Sessão 100% funcional para realizar na sala ou quarto sem precisar de nenhum acessório. Acompanhe a cadência perfeita com as animações.",
    splits: [
      {
        id: "A",
        title: "Treino A — Superior & Core (Sala de Casa)",
        muscles: "Peitoral, Tríceps, Abdômen & Core",
        estimatedMinutes: 35,
        exercises: [
          {
            id: "hc1",
            exerciseId: "ex_pushups",
            name: "Flexão de Braço (Push-ups)",
            muscle: "Peitoral, Tríceps & Core",
            equipment: "Peso do Corpo",
            target: "4 séries × 10-15 reps",
            restSeconds: 60,
            notes: "Mantenha o corpo em linha reta e abdômen contraído.",
            mediaFrames: [
              `${CDN_BASE}/Pushups/0.jpg`,
              `${CDN_BASE}/Pushups/1.jpg`,
            ],
            instructions: [
              "Palmas apoiadas na largura dos ombros.",
              "Desça o peito até 2 dedos do chão.",
              "Empurre de volta com cadência controlada.",
            ],
            tips: ["Se necessário, apoie os joelhos nas últimas repetições."],
            sets: [
              { setNumber: 1, reps: 15, weightKg: 0 },
              { setNumber: 2, reps: 12, weightKg: 0 },
              { setNumber: 3, reps: 10, weightKg: 0 },
              { setNumber: 4, reps: 10, weightKg: 0 },
            ],
          },
          {
            id: "hc2",
            exerciseId: "ex_bench_dips",
            name: "Tríceps no Banco / Cadeira",
            muscle: "Tríceps Braquial",
            equipment: "Cadeira / Sofá",
            target: "3 séries × 12-15 reps",
            restSeconds: 45,
            notes: "Mãos apoiadas no assento da cadeira, costas rentes ao apoio.",
            mediaFrames: [
              `${CDN_BASE}/Bench_Dips/0.jpg`,
              `${CDN_BASE}/Bench_Dips/1.jpg`,
            ],
            instructions: [
              "Apoie as mãos na borda do banco e estenda as pernas à frente.",
              "Desça até 90 graus de flexão dos cotovelos.",
              "Estenda os braços contraindo o tríceps no topo.",
            ],
            tips: ["Segure 1 segundo no pico de contração."],
            sets: [
              { setNumber: 1, reps: 15, weightKg: 0 },
              { setNumber: 2, reps: 12, weightKg: 0 },
              { setNumber: 3, reps: 12, weightKg: 0 },
            ],
          },
          {
            id: "hc3",
            exerciseId: "ex_mountain_climbers",
            name: "Escalador na Prancha (Mountain Climbers)",
            muscle: "Core & Queima Calórica",
            equipment: "Solo / Peso do Corpo",
            target: "3 séries × 30 segundos",
            restSeconds: 45,
            notes: "Alterne os joelhos ao peito mantendo a prancha firme.",
            mediaFrames: [
              `${CDN_BASE}/Mountain_Climbers/0.jpg`,
              `${CDN_BASE}/Mountain_Climbers/1.jpg`,
            ],
            instructions: [
              "Posição de prancha alta com mãos firmes.",
              "Puxe os joelhos em ritmo dinâmico e ritmado.",
            ],
            tips: ["Não deixe o quadril subir muito alto."],
            sets: [
              { setNumber: 1, reps: "30s", weightKg: 0 },
              { setNumber: 2, reps: "30s", weightKg: 0 },
              { setNumber: 3, reps: "30s", weightKg: 0 },
            ],
          },
          {
            id: "hc4",
            exerciseId: "ex_crunches",
            name: "Abdominal Supra Clássico",
            muscle: "Reto Abdominal",
            equipment: "Tapete / Solo",
            target: "4 séries × 20 reps",
            restSeconds: 45,
            notes: "Expire todo o ar no topo da contração.",
            mediaFrames: [
              `${CDN_BASE}/Crunches/0.jpg`,
              `${CDN_BASE}/Crunches/1.jpg`,
            ],
            instructions: [
              "Deite com joelhos flexionados.",
              "Flexione a coluna elevando os ombros do chão.",
            ],
            tips: ["Não puxe a cabeça com as mãos."],
            sets: [
              { setNumber: 1, reps: 20, weightKg: 0 },
              { setNumber: 2, reps: 20, weightKg: 0 },
              { setNumber: 3, reps: 18, weightKg: 0 },
              { setNumber: 4, reps: 15, weightKg: 0 },
            ],
          },
          {
            id: "hc5",
            exerciseId: "ex_plank",
            name: "Prancha Abdominal Isométrica",
            muscle: "Core & Estabilizadores",
            equipment: "Solo",
            target: "3 séries × 45 segundos",
            restSeconds: 60,
            notes: "Corpo como uma barra de ferro, sem arquear a lombar.",
            mediaFrames: [
              `${CDN_BASE}/Plank/0.jpg`,
              `${CDN_BASE}/Plank/0.jpg`,
            ],
            instructions: [
              "Apoie antebraços e pontas dos pés.",
              "Mantenha o alinhamento corporal perfeito.",
            ],
            tips: ["Aperte os glúteos para proteção da lombar."],
            sets: [
              { setNumber: 1, reps: "45s", weightKg: 0 },
              { setNumber: 2, reps: "40s", weightKg: 0 },
              { setNumber: 3, reps: "35s", weightKg: 0 },
            ],
          },
        ],
      },
      {
        id: "B",
        title: "Treino B — Pernas & Glúteos (Zero Equipamentos)",
        muscles: "Quadríceps, Glúteos & Oblíquos",
        estimatedMinutes: 40,
        exercises: [
          {
            id: "hc6",
            exerciseId: "ex_bodyweight_squat",
            name: "Agachamento Livre (Peso do Corpo)",
            muscle: "Quadríceps & Glúteos",
            equipment: "Peso do Corpo",
            target: "4 séries × 15-20 reps",
            restSeconds: 60,
            notes: "Quebre o paralelo com peito aberto e calcanhares firmes.",
            mediaFrames: [
              `${CDN_BASE}/Bodyweight_Squat/0.jpg`,
              `${CDN_BASE}/Bodyweight_Squat/1.jpg`,
            ],
            instructions: [
              "Pés na largura dos ombros.",
              "Desça empurrando o quadril para trás.",
              "Suba apertando o quadríceps e glúteos.",
            ],
            tips: ["Não deixe os joelhos fecharem para dentro."],
            sets: [
              { setNumber: 1, reps: 20, weightKg: 0 },
              { setNumber: 2, reps: 20, weightKg: 0 },
              { setNumber: 3, reps: 15, weightKg: 0 },
              { setNumber: 4, reps: 15, weightKg: 0 },
            ],
          },
          {
            id: "hc7",
            exerciseId: "ex_walking_lunge",
            name: "Passada / Avanço com Peso do Corpo",
            muscle: "Glúteos & Coxas",
            equipment: "Passada no Quarto/Sala",
            target: "3 séries × 12 reps cada perna",
            restSeconds: 60,
            notes: "Passo largo com 90° em ambos os joelhos.",
            mediaFrames: [
              `${CDN_BASE}/Bodyweight_Walking_Lunge/0.jpg`,
              `${CDN_BASE}/Bodyweight_Walking_Lunge/1.jpg`,
            ],
            instructions: [
              "Avance com uma perna flexionando até 90°.",
              "Impulsione para o próximo passo.",
            ],
            tips: ["Mantenha o tronco ereto e o core acionado."],
            sets: [
              { setNumber: 1, reps: 12, weightKg: 0 },
              { setNumber: 2, reps: 12, weightKg: 0 },
              { setNumber: 3, reps: 12, weightKg: 0 },
            ],
          },
          {
            id: "hc8",
            exerciseId: "ex_butt_lift_bridge",
            name: "Ponte de Glúteos no Solo",
            muscle: "Glúteo Máximo",
            equipment: "Tapete / Solo",
            target: "4 séries × 15 reps (2s isometria)",
            restSeconds: 45,
            notes: "Segure 2 segundos apertando o glúteo no topo.",
            mediaFrames: [
              `${CDN_BASE}/Butt_Lift_Bridge/0.jpg`,
              `${CDN_BASE}/Butt_Lift_Bridge/1.jpg`,
            ],
            instructions: [
              "Deite de costas e eleve o quadril pelos calcanhares.",
              "Contraia o topo e desça sem encostar totalmente o quadril.",
            ],
            tips: ["Mantenha os calcanhares firmes no chão."],
            sets: [
              { setNumber: 1, reps: 15, weightKg: 0 },
              { setNumber: 2, reps: 15, weightKg: 0 },
              { setNumber: 3, reps: 15, weightKg: 0 },
              { setNumber: 4, reps: 15, weightKg: 0 },
            ],
          },
          {
            id: "hc9",
            exerciseId: "ex_jump_squat",
            name: "Agachamento com Salto (Jump Squat)",
            muscle: "Potência & Queima Metabólica",
            equipment: "Peso do Corpo",
            target: "3 séries × 10 reps",
            restSeconds: 60,
            notes: "Exploda no salto e aterrisse suavemente amortecendo.",
            mediaFrames: [
              `${CDN_BASE}/Freehand_Jump_Squat/0.jpg`,
              `${CDN_BASE}/Freehand_Jump_Squat/1.jpg`,
            ],
            instructions: [
              "Agache até 90° e salte com potência.",
              "Aterrisse suave com a ponta dos pés.",
            ],
            tips: ["Aterrissagem macia para amortecer articulações."],
            sets: [
              { setNumber: 1, reps: 10, weightKg: 0 },
              { setNumber: 2, reps: 10, weightKg: 0 },
              { setNumber: 3, reps: 10, weightKg: 0 },
            ],
          },
          {
            id: "hc10",
            exerciseId: "ex_russian_twist",
            name: "Russian Twist no Solo",
            muscle: "Oblíquos & Abdômen",
            equipment: "Tapete / Solo",
            target: "3 séries × 20 rotações",
            restSeconds: 45,
            notes: "Tronco em 45 graus, gire os ombros de um lado ao outro.",
            mediaFrames: [
              `${CDN_BASE}/Russian_Twist/0.jpg`,
              `${CDN_BASE}/Russian_Twist/1.jpg`,
            ],
            instructions: [
              "Sente-se inclinado para trás e gire o tronco alternando os lados.",
            ],
            tips: ["Gire os ombros por completo e não apenas os braços."],
            sets: [
              { setNumber: 1, reps: 20, weightKg: 0 },
              { setNumber: 2, reps: 20, weightKg: 0 },
              { setNumber: 3, reps: 20, weightKg: 0 },
            ],
          },
        ],
      },
    ],
  },

  // 2. HIPERTROFIA CLÁSSICA ABC
  {
    id: "routine_hypertrophy_abc",
    name: "Hipertrofia Clássica ABC (Push / Pull / Legs)",
    category: "Hipertrofia",
    difficulty: "Intermediário",
    frequency: "3 a 6 dias na semana",
    description: "Divisão consagrada da musculação para ganho de massa magra e densidade muscular.",
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
            mediaFrames: [
              `${CDN_BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
              `${CDN_BASE}/Barbell_Bench_Press_-_Medium_Grip/1.jpg`,
            ],
            instructions: [
              "Deite com os olhos alinhados à barra e pegada na largura dos ombros.",
              "Desça a barra até a linha dos mamilos controladamente e empurre.",
            ],
            tips: ["Mantenha os pés firmes no chão para empurrar com força."],
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
            mediaFrames: [
              `${CDN_BASE}/Incline_Dumbbell_Press/0.jpg`,
              `${CDN_BASE}/Incline_Dumbbell_Press/1.jpg`,
            ],
            instructions: [
              "Ajuste o banco em 30°. Empurre os halteres em arco convergente.",
            ],
            tips: ["Não deixe os halteres colidirem no topo."],
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
            notes: "Cotovelos ligeiramente flexionados, sem impulsão lombar.",
            mediaFrames: [
              `${CDN_BASE}/Side_Lateral_Raise/0.jpg`,
              `${CDN_BASE}/Side_Lateral_Raise/1.jpg`,
            ],
            instructions: [
              "Suba os halteres lateralmente até a linha do ombro liderando pelos cotovelos.",
            ],
            tips: ["Não jogue o tronco para trás."],
            sets: [
              { setNumber: 1, reps: 15, weightKg: 10 },
              { setNumber: 2, reps: 12, weightKg: 12 },
              { setNumber: 3, reps: 12, weightKg: 12 },
              { setNumber: 4, reps: 12, weightKg: 12 },
            ],
          },
          {
            id: "e4",
            exerciseId: "ex_dips_chest",
            name: "Paralelas com Foco no Peito",
            muscle: "Peitoral Inferior & Tríceps",
            equipment: "Barras Paralelas",
            target: "3 séries × até a falha",
            restSeconds: 75,
            notes: "Incline o tronco para a frente a 30 graus.",
            mediaFrames: [
              `${CDN_BASE}/Dips_-_Chest_Version/0.jpg`,
              `${CDN_BASE}/Dips_-_Chest_Version/1.jpg`,
            ],
            instructions: [
              "Incline o tronco e flexione os cotovelos a 90°.",
            ],
            tips: ["Se estiver pesado, use a máquina graviton."],
            sets: [
              { setNumber: 1, reps: 12, weightKg: 0 },
              { setNumber: 2, reps: 10, weightKg: 0 },
              { setNumber: 3, reps: 8, weightKg: 0 },
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
            mediaFrames: [
              `${CDN_BASE}/Wide-Grip_Lat_Pulldown/0.jpg`,
              `${CDN_BASE}/Wide-Grip_Lat_Pulldown/1.jpg`,
            ],
            instructions: [
              "Segure aberto e traga a barra até o peito.",
            ],
            tips: ["Alongue as escápulas na subida."],
            sets: [
              { setNumber: 1, reps: 10, weightKg: 55 },
              { setNumber: 2, reps: 10, weightKg: 65 },
              { setNumber: 3, reps: 8, weightKg: 70 },
              { setNumber: 4, reps: 8, weightKg: 70 },
            ],
          },
          {
            id: "e6",
            exerciseId: "ex_pullup",
            name: "Barra Fixa Pronada",
            muscle: "Dorsais & Antebraço",
            equipment: "Barra Fixa",
            target: "4 séries × 8-10 reps",
            restSeconds: 90,
            notes: "Passe o queixo acima da barra sem embalo.",
            mediaFrames: [
              `${CDN_BASE}/Pullups/0.jpg`,
              `${CDN_BASE}/Pullups/1.jpg`,
            ],
            instructions: [
              "Puxe com a força das costas passando o queixo da barra.",
            ],
            tips: ["Cruze os pés para maior estabilidade corporal."],
            sets: [
              { setNumber: 1, reps: 10, weightKg: 0 },
              { setNumber: 2, reps: 8, weightKg: 0 },
              { setNumber: 3, reps: 8, weightKg: 0 },
              { setNumber: 4, reps: 6, weightKg: 0 },
            ],
          },
          {
            id: "e7",
            exerciseId: "ex_barbell_curl",
            name: "Rosca Direta com Barra",
            muscle: "Bíceps Braquial",
            equipment: "Barra",
            target: "4 séries × 10-12 reps",
            restSeconds: 60,
            notes: "Sem usar embalo corporal.",
            mediaFrames: [
              `${CDN_BASE}/Barbell_Curl/0.jpg`,
              `${CDN_BASE}/Barbell_Curl/1.jpg`,
            ],
            instructions: [
              "Flexione os cotovelos sem movimentar a coluna.",
            ],
            tips: ["Mantenha os cotovelos colados ao lado das costelas."],
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
            mediaFrames: [
              `${CDN_BASE}/Barbell_Squat/0.jpg`,
              `${CDN_BASE}/Barbell_Squat/1.jpg`,
            ],
            instructions: [
              "Desça até quebrar o paralelo de 90 graus e suba com força.",
            ],
            tips: ["Pressione os calcanhares no chão."],
            sets: [
              { setNumber: 1, reps: 10, weightKg: 80 },
              { setNumber: 2, reps: 10, weightKg: 90 },
              { setNumber: 3, reps: 8, weightKg: 100 },
              { setNumber: 4, reps: 8, weightKg: 100 },
            ],
          },
          {
            id: "e9",
            exerciseId: "ex_hip_thrust",
            name: "Elevação Pélvica com Barra",
            muscle: "Glúteo Máximo",
            equipment: "Barra + Banco",
            target: "4 séries × 10-12 reps",
            restSeconds: 90,
            notes: "Segure 2s no topo contraindo o glúteo.",
            mediaFrames: [
              `${CDN_BASE}/Barbell_Hip_Thrust/0.jpg`,
              `${CDN_BASE}/Barbell_Hip_Thrust/1.jpg`,
            ],
            instructions: [
              "Apoie as costas no banco e eleve a barra com a pelve.",
            ],
            tips: ["Segure 2 segundos de contração máxima."],
            sets: [
              { setNumber: 1, reps: 12, weightKg: 70 },
              { setNumber: 2, reps: 12, weightKg: 80 },
              { setNumber: 3, reps: 10, weightKg: 90 },
              { setNumber: 4, reps: 10, weightKg: 100 },
            ],
          },
        ],
      },
    ],
  },

  // 3. FOCO GLÚTEOS & COXAS (FEMININO)
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
            mediaFrames: [
              `${CDN_BASE}/Barbell_Hip_Thrust/0.jpg`,
              `${CDN_BASE}/Barbell_Hip_Thrust/1.jpg`,
            ],
            instructions: [
              "Empurre pelos calcanhares até a extensão completa.",
            ],
            tips: ["Mantenha o queixo no peito."],
            sets: [
              { setNumber: 1, reps: 12, weightKg: 60 },
              { setNumber: 2, reps: 12, weightKg: 70 },
              { setNumber: 3, reps: 10, weightKg: 80 },
              { setNumber: 4, reps: 10, weightKg: 90 },
            ],
          },
          {
            id: "fg2",
            exerciseId: "ex_barbell_squat",
            name: "Agachamento Livre com Barra",
            muscle: "Quadríceps & Glúteos",
            equipment: "Barra Olímpica",
            target: "4 séries × 10 reps",
            restSeconds: 90,
            notes: "Desça com controle até passar os 90°.",
            mediaFrames: [
              `${CDN_BASE}/Barbell_Squat/0.jpg`,
              `${CDN_BASE}/Barbell_Squat/1.jpg`,
            ],
            instructions: [
              "Agache quebrando o paralelo e suba pelo calcanhar.",
            ],
            tips: ["Não deixe os joelhos fecharem."],
            sets: [
              { setNumber: 1, reps: 10, weightKg: 40 },
              { setNumber: 2, reps: 10, weightKg: 50 },
              { setNumber: 3, reps: 10, weightKg: 55 },
              { setNumber: 4, reps: 8, weightKg: 60 },
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

/**
 * Retorna os dados de mídia e instruções de um exercício por ID ou nome
 */
export function getExerciseDetails(exerciseIdOrName: string): ExerciseDBItem | undefined {
  const matchById = LOCAL_EXERCISE_DB.find((ex) => ex.id === exerciseIdOrName);
  if (matchById) return matchById;

  const matchByName = LOCAL_EXERCISE_DB.find(
    (ex) => ex.name.toLowerCase() === exerciseIdOrName.toLowerCase()
  );
  return matchByName;
}
