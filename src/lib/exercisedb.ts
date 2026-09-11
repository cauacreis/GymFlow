/**
 * ExerciseDB API Integration & Local Catalog Engine
 * Suporta o catálogo nativo offline-first com animações (frames ExerciseDB) e chamadas à API
 */

export interface ExerciseDBItem {
  id: string;
  name: string;
  bodyPart: "chest" | "back" | "shoulders" | "upper arms" | "lower arms" | "upper legs" | "lower legs" | "waist" | "cardio" | string;
  target: string;
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "body weight" | "smith machine" | "band" | string;
  gifUrl?: string;
  mediaFrames?: string[];
  instructions: string[];
  tips?: string[];
  difficulty?: "Iniciante" | "Intermediário" | "Avançado";
  isCustom?: boolean;
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
  isCustom?: boolean;
}

export interface WorkoutSplitTemplate {
  id: string; // "A", "B", "C", "D", "E", "F" ou qualquer identificador de dia
  title: string;
  muscles: string;
  estimatedMinutes: number;
  exercises: ExerciseInWorkout[];
}

export interface PreFormedWorkoutRoutine {
  id: string;
  name: string;
  category: "Hipertrofia" | "Definição" | "Força" | "Feminino / Glúteos" | "Iniciante" | string;
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  description: string;
  frequency: string;
  splits: WorkoutSplitTemplate[];
  isCustom?: boolean;
  createdAt?: string;
  coachId?: string;
  coachName?: string;
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

  // ============================================================
  // PEITORAL (CHEST)
  // ============================================================
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
    id: "ex_incline_barbell_bench_press",
    name: "Supino Inclinado com Barra",
    bodyPart: "chest",
    target: "Peitoral Superior (Porção Clavicular)",
    equipment: "barbell",
    mediaFrames: [
      `${CDN_BASE}/Barbell_Incline_Bench_Press/0.jpg`,
      `${CDN_BASE}/Barbell_Incline_Bench_Press/1.jpg`,
    ],
    instructions: [
      "Ajuste o banco em inclinação de 30° a 45°.",
      "Segure a barra com pegada pronada afastada.",
      "Desça controlando a carga até a altura da clavícula e empurre verticalmente.",
    ],
    tips: [
      "Mantenha as escápulas aduzidas e os ombros colados no encosto.",
      "Não use inclinação superior a 45° para não transferir a tensão para os deltoides anteriores.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_decline_barbell_bench_press",
    name: "Supino Declinado com Barra",
    bodyPart: "chest",
    target: "Peitoral Inferior (Porção Costal)",
    equipment: "barbell",
    instructions: [
      "Prenda as pernas no banco declinado e posicione as mãos na barra.",
      "Desça a barra até a linha inferior do peito / costelas.",
      "Empurre a barra estendendo os braços de forma controlada.",
    ],
    tips: ["Excelente para desenvolver a base inferior e o contorno do peitoral."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_dumbbell_bench_press",
    name: "Supino Reto com Halteres",
    bodyPart: "chest",
    target: "Peitoral Maior & Estabilidade",
    equipment: "dumbbell",
    mediaFrames: [
      `${CDN_BASE}/Dumbbell_Bench_Press/0.jpg`,
      `${CDN_BASE}/Dumbbell_Bench_Press/1.jpg`,
    ],
    instructions: [
      "Deite-se no banco com um halter em cada mão na altura do peito.",
      "Empurre os halteres para cima em movimento convergente suave.",
      "Desça abrindo os cotovelos a cerca de 70° até alongar o peito.",
    ],
    tips: [
      "Permite maior amplitude de movimento que a barra.",
      "Não bata os halteres no topo do movimento.",
    ],
    difficulty: "Iniciante",
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
      "Desça sentindo o alongamento da porção superior do peitoral.",
      "Mantenha os punhos firmes e neutros.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_dumbbell_decline_press",
    name: "Supino Declinado com Halteres",
    bodyPart: "chest",
    target: "Peitoral Inferior",
    equipment: "dumbbell",
    instructions: [
      "Deite no banco declinado travando os tornozelos.",
      "Pressione os halteres acima do peitoral inferior.",
      "Desça controlando até que os cotovelos passem ligeiramente da linha do tronco.",
    ],
    tips: ["Foque em espremer a base inferior do peito no topo."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_machine_chest_press",
    name: "Supino Reto na Máquina (Articulado)",
    bodyPart: "chest",
    target: "Peitoral Maior & Isolamento Seguro",
    equipment: "machine",
    instructions: [
      "Ajuste o assento para que as manoplas fiquem no meio do peitoral.",
      "Apoie as costas e cabeça no encosto e empurre as manoplas à frente.",
      "Retorne devagar sem deixar as placas de peso baterem.",
    ],
    tips: ["Ideal para falhar com máxima segurança sem risco de prender a barra."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_machine_incline_chest_press",
    name: "Supino Inclinado na Máquina",
    bodyPart: "chest",
    target: "Peitoral Superior na Máquina",
    equipment: "machine",
    instructions: [
      "Regule a altura do banco para as pegadas alinharem à clavícula.",
      "Empurre na trajetória inclinada da máquina até a extensão dos braços.",
      "Controle a descida excêntrica em 2 a 3 segundos.",
    ],
    tips: ["Mantenha as escápulas fixas atrás no encosto durante todo o trajeto."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_pec_deck_fly",
    name: "Crucifixo na Máquina (Peck Deck / Voador)",
    bodyPart: "chest",
    target: "Isolamento Esterno-Costal do Peito",
    equipment: "machine",
    instructions: [
      "Ajuste a altura do banco para que os braços fiquem alinhados com o meio do peito.",
      "Com cotovelos semiflexionados, feche os braços apertando o peito ao centro.",
      "Segure 1 segundo na contração máxima e retorne alongando a musculatura.",
    ],
    tips: ["Não deixe os ombros se projetarem para a frente ao fechar."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_dumbbell_flyes",
    name: "Crucifixo Reto com Halteres",
    bodyPart: "chest",
    target: "Alongamento e Abertura Peitoral",
    equipment: "dumbbell",
    mediaFrames: [
      `${CDN_BASE}/Dumbbell_Flyes/0.jpg`,
      `${CDN_BASE}/Dumbbell_Flyes/1.jpg`,
    ],
    instructions: [
      "Deite no banco plano segurando os halteres com as palmas voltadas uma para a outra.",
      "Abra os braços em arco suave mantendo os cotovelos levemente flexionados.",
      "Retorne abraçando o ar até aproximar os halteres.",
    ],
    tips: ["Nunca estique totalmente os cotovelos para proteger as articulações."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_dumbbell_incline_flyes",
    name: "Crucifixo Inclinado com Halteres",
    bodyPart: "chest",
    target: "Alongamento Superior do Peitoral",
    equipment: "dumbbell",
    instructions: [
      "Banco em 30 a 40 graus de inclinação.",
      "Abra os braços lateralmente em semi-arco sentindo puxar o peito superior.",
      "Suba fechando até a linha dos olhos.",
    ],
    tips: ["Foque na sensação de estiramento na descida."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_cable_crossover",
    name: "Crossover no Pulley (Polia Alta)",
    bodyPart: "chest",
    target: "Peitoral Inferior e Medial",
    equipment: "cable",
    instructions: [
      "Posicione as roldanas no topo do crossover.",
      "Dê um passo à frente com tronco levemente inclinado.",
      "Puxe os cabos para baixo e para frente cruzando as mãos levemente à frente do quadril.",
    ],
    tips: ["Mantenha o ângulo fixo nos cotovelos durante todo o movimento."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_crossover_low",
    name: "Crossover no Pulley (Polia Baixa)",
    bodyPart: "chest",
    target: "Peitoral Superior (Porção Clavicular)",
    equipment: "cable",
    instructions: [
      "Roldanas na base inferior do crossover.",
      "Palmas voltadas para cima, traga as manoplas de baixo para cima na linha do queixo.",
      "Aperte o topo do peito por 1 segundo.",
    ],
    tips: ["Mantenha o abdômen contraído para não jogar o quadril para a frente."],
    difficulty: "Intermediário",
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
  {
    id: "ex_dumbbell_pullover",
    name: "Pullover com Halter no Banco",
    bodyPart: "chest",
    target: "Expansão da Caixa Torácica & Peitoral",
    equipment: "dumbbell",
    instructions: [
      "Apoie a parte superior das costas transversalmente no banco plano.",
      "Segure um halter com ambas as mãos em formato de diamante acima do peito.",
      "Desça o halter atrás da cabeça alongando a caixa torácica e puxe de volta.",
    ],
    tips: ["Mantenha os cotovelos levemente flexionados e o quadril baixo."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_smith_bench_press",
    name: "Supino no Smith Machine",
    bodyPart: "chest",
    target: "Peitoral Maior com Trajetória Fixa",
    equipment: "smith machine",
    instructions: [
      "Posicione o banco no centro do Smith alinhando a barra ao meio do peito.",
      "Destrave a barra e desça controladamente até encostar de leve no peito.",
      "Empurre firme e trave novamente no suporte ao terminar.",
    ],
    tips: ["Ótimo para treinar com cargas altas sem risco de desequilíbrio."],
    difficulty: "Iniciante",
  },

  // ============================================================
  // COSTAS & DORSAIS (BACK)
  // ============================================================
  {
    id: "ex_lat_pulldown",
    name: "Puxada Frontal Aberta no Pulley",
    bodyPart: "back",
    target: "Latíssimo do Dorso (Largura Dorsal)",
    equipment: "cable",
    mediaFrames: [
      `${CDN_BASE}/Wide-Grip_Lat_Pulldown/0.jpg`,
      `${CDN_BASE}/Wide-Grip_Lat_Pulldown/1.jpg`,
    ],
    instructions: [
      "Segure a barra com pegada pronada aberta além dos ombros.",
      "Puxe a barra em direção à parte superior do peito direcionando cotovelos para baixo.",
      "Evite balançar excessivamente o tronco para trás.",
    ],
    tips: [
      "Pense em 'puxar com os cotovelos' e não com as mãos para ativar as dorsais.",
      "Alongue totalmente as escápulas na subida sem soltar o tronco.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_lat_pulldown_triangle",
    name: "Puxada Frontal com Triângulo (Pegada Neutra)",
    bodyPart: "back",
    target: "Latíssimo do Dorso & Bíceps Braquial",
    equipment: "cable",
    instructions: [
      "Engate o puxador triângulo na polia alta.",
      "Sente-se firme travando as coxas no apoio.",
      "Puxe o triângulo até a altura da fita do peito apertando as escápulas.",
    ],
    tips: ["A pegada neutra poupa os punhos e permite aplicar bastante força."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_lat_pulldown_underhand",
    name: "Puxada no Pulley com Pegada Supinada",
    bodyPart: "back",
    target: "Latíssimo Inferior & Bíceps",
    equipment: "cable",
    instructions: [
      "Pegada supinada (palmas voltadas para você) na largura dos ombros.",
      "Puxe a barra encostando no topo do peitoral.",
      "Suba controlando o peso até os braços ficarem totalmente estendidos.",
    ],
    tips: ["Permite maior amplitude de contração da porção baixa do dorsal."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_pullup",
    name: "Barra Fixa Pronada (Pull-up)",
    bodyPart: "back",
    target: "Latíssimo do Dorso & Romboides",
    equipment: "body weight",
    mediaFrames: [
      `${CDN_BASE}/Pullups/0.jpg`,
      `${CDN_BASE}/Pullups/1.jpg`,
    ],
    instructions: [
      "Pegada mais larga que os ombros, corpo suspenso na barra.",
      "Inicie a tração conectando as escápulas antes de puxar com os braços.",
      "Passe o queixo acima da barra e desça de forma controlada.",
    ],
    tips: ["Evite embalar as pernas (kipping) para isolar o trabalho hipertrófico."],
    difficulty: "Avançado",
  },
  {
    id: "ex_chinup",
    name: "Barra Fixa Supinada (Chin-up)",
    bodyPart: "back",
    target: "Dorsais, Romboides & Bíceps",
    equipment: "body weight",
    instructions: [
      "Segure na barra com palmas voltadas para você na largura dos ombros.",
      "Puxe o corpo para cima até o queixo ultrapassar a barra.",
      "Desça de forma cadenciada até estender os braços.",
    ],
    tips: ["Excelente para ganho duplo de espessura de costas e força de braço."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_barbell_bent_over_row",
    name: "Remada Curvada com Barra (Pronada)",
    bodyPart: "back",
    target: "Espessura Dorsal & Trapézio Médio",
    equipment: "barbell",
    instructions: [
      "Incline o tronco a 45° mantendo a coluna neutra e joelhos semiflexionados.",
      "Puxe a barra em direção à cicatriz umbilical.",
      "Aperte as escápulas no topo e desça com amplitude completa.",
    ],
    tips: ["Lombar travada, nunca curve as costas para evitar lesões."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_underhand_barbell_row",
    name: "Remada Curvada Pegada Supinada (Yates Row)",
    bodyPart: "back",
    target: "Dorsais Inferiores e Espessura",
    equipment: "barbell",
    instructions: [
      "Pegada com palmas voltadas para a frente.",
      "Tronco inclinado a 60 graus, puxe a barra raspando na coxa até o abdômen.",
      "Contraia o dorsal com vigor no final da puxada.",
    ],
    tips: ["Permite maior torque de força para desenvolver densidade nas costas."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_t_bar_row",
    name: "Remada Cavalinho (T-Bar Row)",
    bodyPart: "back",
    target: "Espessura Dorsal, Trapézio e Romboides",
    equipment: "barbell",
    instructions: [
      "Posicione a barra em um suporte landmine ou use a máquina articulada.",
      "Encaixe o puxador triângulo sob a ponta da barra.",
      "Com tronco inclinado e peito estufado, puxe a barra contra o abdômen.",
    ],
    tips: ["Não impulsione o tronco para trás no início da subida."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_seated_cable_row",
    name: "Remada Baixa na Polia com Triângulo",
    bodyPart: "back",
    target: "Miolo das Costas, Romboides e Latíssimo",
    equipment: "cable",
    instructions: [
      "Sente-se com pés apoiados na plataforma e joelhos levemente destravados.",
      "Puxe o triângulo contra o umbigo projetando o peito para a frente.",
      "Solte o peso deixando as escápulas abrirem de forma controlada.",
    ],
    tips: ["Mantenha os ombros longe das orelhas (deprimidos)."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_dumbbell_row_unilateral",
    name: "Remada Unilateral com Halter (Serrote)",
    bodyPart: "back",
    target: "Latíssimo do Dorso & Simetria",
    equipment: "dumbbell",
    mediaFrames: [
      `${CDN_BASE}/One-Arm_Dumbbell_Row/0.jpg`,
      `${CDN_BASE}/One-Arm_Dumbbell_Row/1.jpg`,
    ],
    instructions: [
      "Apoie um joelho e a mão do mesmo lado no banco horizontal.",
      "Segure o halter com o braço livre e puxe o cotovelo em direção ao quadril.",
      "Desça alongando o dorsal sem rodar excessivamente a bacia.",
    ],
    tips: ["Puxe em trajetória de arco ('j' invertido) em direção à cintura."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_machine_row",
    name: "Remada Articulada na Máquina",
    bodyPart: "back",
    target: "Dorsais e Espessura com Encosto no Peito",
    equipment: "machine",
    instructions: [
      "Ajuste o assento para que as almofadas de peito apoiem o esterno.",
      "Segure nas manoplas (pronada ou neutra) e puxe os cotovelos para trás.",
      "Aperte o meio das costas e volte controlando o retorno.",
    ],
    tips: ["O apoio no peito anula a tensão na lombar, ideal para focar só na dorsal."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_straight_arm_pulldown",
    name: "Pulldown na Polia Alta com Barra Reta / Corda",
    bodyPart: "back",
    target: "Isolamento do Latíssimo do Dorso",
    equipment: "cable",
    instructions: [
      "Fique em pé de frente para a polia alta com braços estendidos segurando a barra.",
      "Com cotovelos quase retos, puxe a barra para baixo num arco até as coxas.",
      "Retorne controlando o peso até a altura dos olhos.",
    ],
    tips: ["Ótimo como pré-exaustão ou finalizador para queimar as asas."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_conventional_deadlift",
    name: "Levantamento Terra Convencional",
    bodyPart: "back",
    target: "Cadeia Posterior Completa, Lombar & Trapézio",
    equipment: "barbell",
    instructions: [
      "Pés na largura do quadril, barra rente às canelas.",
      "Segure a barra fora dos joelhos com peito estufado e lombar em neutro.",
      "Empurre o chão com as pernas e estenda quadris e joelhos simultaneamente.",
    ],
    tips: ["A barra deve subir sempre colada ao corpo."],
    difficulty: "Avançado",
  },
  {
    id: "ex_barbell_shrug",
    name: "Encolhimento de Trapézio com Barra",
    bodyPart: "back",
    target: "Trapézio Superior",
    equipment: "barbell",
    instructions: [
      "Segure a barra em pé à frente das coxas na largura dos ombros.",
      "Eleve os ombros verticalmente em direção às orelhas.",
      "Segure 2 segundos no topo e desça controladamente.",
    ],
    tips: ["Não rode os ombros em círculos para não desgastar os tendões."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_dumbbell_shrug",
    name: "Encolhimento de Trapézio com Halteres",
    bodyPart: "back",
    target: "Trapézio Superior com Pegada Neutra",
    equipment: "dumbbell",
    instructions: [
      "Segure halteres pesados ao lado do corpo.",
      "Puxe os ombros direto para cima o mais alto possível.",
      "Desça alongando o trapézio lentamente.",
    ],
    tips: ["Mantenha o pescoço relaxado e ereto."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_face_pull",
    name: "Face Pull na Polia Alta com Corda",
    bodyPart: "shoulders",
    target: "Deltoide Posterior, Manguito Rotador & Postura",
    equipment: "cable",
    instructions: [
      "Polia posicionada na altura dos olhos com acessório corda.",
      "Puxe as extremidades da corda em direção aos lados do rosto/orelhas.",
      "Gire externamente os ombros no final abrindo os nós da corda.",
    ],
    tips: ["Exercício essencial para saúde articular dos ombros e combate à cifose."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_reverse_pec_deck",
    name: "Crucifixo Inverso no Peck Deck",
    bodyPart: "shoulders",
    target: "Deltoide Posterior & Romboides",
    equipment: "machine",
    instructions: [
      "Sente-se de frente para o encosto do Peck Deck.",
      "Segure nas manoplas com braços na altura dos ombros.",
      "Abra os braços para trás até que os cotovelos fiquem na linha do tronco.",
    ],
    tips: ["Foque em usar a parte de trás dos ombros para mover as manoplas."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_dumbbell_reverse_fly",
    name: "Crucifixo Inverso com Halteres",
    bodyPart: "shoulders",
    target: "Deltoide Posterior Livre",
    equipment: "dumbbell",
    instructions: [
      "Incline o tronco para a frente a 45° ou deite em banco inclinado com o peito apoiado.",
      "Eleve os halteres lateralmente em arco com cotovelos levemente flexionados.",
      "Contraia a parte de trás do ombro e desça controlado.",
    ],
    tips: ["Não balance o tronco para ganhar impulso."],
    difficulty: "Iniciante",
  },

  // ============================================================
  // OMBROS & DELTOIDES (SHOULDERS)
  // ============================================================
  {
    id: "ex_military_press",
    name: "Desenvolvimento Militar com Barra (Overhead Press)",
    bodyPart: "shoulders",
    target: "Deltoide Anterior, Core & Força Geral",
    equipment: "barbell",
    instructions: [
      "Fique em pé com pés firmes e glúteos travados.",
      "Barra apoiada sobre a parte superior do peitoral.",
      "Pressione a barra verticalmente até estender os braços acima da cabeça.",
    ],
    tips: ["Aperte os glúteos e o abdômen para não arquear as costas."],
    difficulty: "Avançado",
  },
  {
    id: "ex_dumbbell_shoulder_press",
    name: "Desenvolvimento com Halteres Sentado",
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
      "Desça lentamente até a linha do queixo sem relaxar a tensão muscular.",
    ],
    tips: ["Não deixe a lombar arquear excessivamente para longe do banco."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_machine_shoulder_press",
    name: "Desenvolvimento na Máquina Articulada",
    bodyPart: "shoulders",
    target: "Deltoides com Trajetória Guiada",
    equipment: "machine",
    instructions: [
      "Ajuste o assento para que as manoplas comecem na altura dos ombros.",
      "Empurre as manoplas para cima até a extensão controlada.",
      "Desça lentamente sem tocar os pesos.",
    ],
    tips: ["Excelente para treinar até a falha sem medo de derrubar pesos."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_smith_shoulder_press",
    name: "Desenvolvimento no Smith Machine",
    bodyPart: "shoulders",
    target: "Deltoide Anterior no Smith",
    equipment: "smith machine",
    instructions: [
      "Posicione o banco a 80 graus centralizado sob a barra do Smith.",
      "Destrave a barra na altura do queixo e pressione acima da cabeça.",
      "Desça controladamente até a altura da clavícula.",
    ],
    tips: ["Mantenha a cabeça ereta e não projete o queixo para a frente."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_arnold_press",
    name: "Desenvolvimento Arnold com Halteres",
    bodyPart: "shoulders",
    target: "Deltoide Anterior e Lateral com Rotação",
    equipment: "dumbbell",
    instructions: [
      "Inicie com os halteres na frente do peito, palmas viradas para você.",
      "Conforme empurra os pesos para cima, gire os punhos para fora.",
      "No topo, as palmas ficam voltadas para a frente; inverta a rotação na descida.",
    ],
    tips: ["Movimento contínuo e fluído sem trancos."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_lateral_raise",
    name: "Elevação Lateral com Halteres",
    bodyPart: "shoulders",
    target: "Deltoide Lateral (Largura dos Ombros)",
    equipment: "dumbbell",
    mediaFrames: [
      `${CDN_BASE}/Side_Lateral_Raise/0.jpg`,
      `${CDN_BASE}/Side_Lateral_Raise/1.jpg`,
    ],
    instructions: [
      "Corpo levemente inclinado para a frente, cotovelos semiflexionados.",
      "Eleve os braços lateralmente até a linha dos ombros.",
      "Foque em liderar a subida pelos cotovelos, não pelos punhos.",
    ],
    tips: ["Evite usar embalo corporal ou jogar os halteres com os trapézios."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_lateral_raise",
    name: "Elevação Lateral na Polia Baixa",
    bodyPart: "shoulders",
    target: "Deltoide Lateral com Tensão Contínua",
    equipment: "cable",
    instructions: [
      "Coloque a polia no ponto mais baixo e segure a manopla com o braço oposto.",
      "Incline o corpo levemente para o lado e eleve a mão até a linha do ombro.",
      "Desça de forma cadenciada aproveitando a tensão do cabo.",
    ],
    tips: ["A tensão constante do cabo estimula fibras que o halter não atinge."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_machine_lateral_raise",
    name: "Elevação Lateral na Máquina",
    bodyPart: "shoulders",
    target: "Isolamento Puro do Deltoide Lateral",
    equipment: "machine",
    instructions: [
      "Ajuste o assento para que o eixo da máquina coincida com as articulações dos ombros.",
      "Apoie os braços nas almofadas e empurre para cima.",
      "Segure 1 segundo no topo e retorne com calma.",
    ],
    tips: ["Não use força no pescoço."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_dumbbell_front_raise",
    name: "Elevação Frontal com Halteres",
    bodyPart: "shoulders",
    target: "Deltoide Anterior",
    equipment: "dumbbell",
    instructions: [
      "Segure os halteres à frente das coxas.",
      "Eleve um braço por vez (ou ambos) à frente até a altura dos olhos.",
      "Desça devagar controlando a descida.",
    ],
    tips: ["Mantenha o tronco estável sem balanço para trás."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_front_raise",
    name: "Elevação Frontal na Polia com Corda",
    bodyPart: "shoulders",
    target: "Deltoide Anterior na Polia",
    equipment: "cable",
    instructions: [
      "Polia baixa entre as pernas com o cabo passando por baixo.",
      "Segure as extremidades da corda e eleve à frente até a altura dos olhos.",
      "Desça controlando a gravidade.",
    ],
    tips: ["Excelente controle mecânico."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_barbell_front_raise",
    name: "Elevação Frontal com Barra ou Anilha",
    bodyPart: "shoulders",
    target: "Deltoide Anterior",
    equipment: "barbell",
    instructions: [
      "Segure a barra ou uma anilha à frente do corpo com ambas as mãos.",
      "Eleve os braços estendidos até a altura dos ombros/olhos.",
      "Desça sustentando o peso.",
    ],
    tips: ["Mantenha o abdômen contraído para firmar a postura."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_upright_row",
    name: "Remada Alta com Barra / Polia",
    bodyPart: "shoulders",
    target: "Deltoide Lateral & Trapézio",
    equipment: "barbell",
    instructions: [
      "Pegada na largura dos ombros na barra ou no puxador da polia.",
      "Puxe os cotovelos para cima até a linha do peito, mantendo os cotovelos mais altos que as mãos.",
      "Desça estendendo os braços.",
    ],
    tips: ["Não puxe muito próximo ao queixo para proteger os manguitos."],
    difficulty: "Intermediário",
  },

  // ============================================================
  // TRÍCEPS (UPPER ARMS)
  // ============================================================
  {
    id: "ex_cable_triceps_pushdown",
    name: "Tríceps Pulley com Barra Reta / V",
    bodyPart: "upper arms",
    target: "Tríceps (Cabeça Lateral & Medial)",
    equipment: "cable",
    instructions: [
      "Engate a barra reta ou em V na polia alta.",
      "Cotovelos colados ao lado das costelas e tronco levemente inclinado à frente.",
      "Empurre a barra para baixo estendendo os antebraços por completo.",
    ],
    tips: [
      "Não deixe os cotovelos se moverem para frente e para trás.",
      "Aperte o tríceps por 1 segundo no ponto de extensão máxima.",
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_triceps_rope",
    name: "Tríceps Corda na Polia Alta",
    bodyPart: "upper arms",
    target: "Tríceps (Cabeça Lateral com Abertura)",
    equipment: "cable",
    instructions: [
      "Segure as extremidades da corda com pegada neutra.",
      "Empurre para baixo e abra as pontas da corda para os lados no final da extensão.",
      "Retorne até os antebraços formarem 90 graus com os braços.",
    ],
    tips: ["A abertura final da corda ativa intensamente a cabeça lateral do tríceps."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_skull_crusher_ez_bar",
    name: "Tríceps Testa com Barra W",
    bodyPart: "upper arms",
    target: "Tríceps (Cabeça Longa & Medial)",
    equipment: "barbell",
    instructions: [
      "Deite-se no banco com a barra W estendida acima do peito.",
      "Mantendo os cotovelos apontados para o teto, flexione os antebraços levando a barra até a testa.",
      "Estenda os cotovelos empurrando a barra de volta ao topo.",
    ],
    tips: [
      "Incline levemente os braços para trás (75°) para manter tensão no topo.",
      "Não deixe os cotovelos abrirem para os lados.",
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_dumbbell_skull_crusher",
    name: "Tríceps Testa com Halteres",
    bodyPart: "upper arms",
    target: "Tríceps com Pegada Neutra Unilateral",
    equipment: "dumbbell",
    instructions: [
      "Deite no banco segurando um par de halteres com palmas viradas uma para a outra.",
      "Flexione os cotovelos descendo os halteres ao lado das orelhas.",
      "Estenda com força de volta ao topo.",
    ],
    tips: ["Excelente para corrigir assimetrias entre os braços."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_french_press_dumbbell",
    name: "Tríceps Francês com Halter Sentado",
    bodyPart: "upper arms",
    target: "Tríceps (Cabeça Longa em Máximo Alongamento)",
    equipment: "dumbbell",
    instructions: [
      "Sente-se com as costas apoiadas e segure um halter com as duas mãos acima da cabeça.",
      "Desça o halter por trás da cabeça flexionando os cotovelos.",
      "Pressione de volta até a extensão total.",
    ],
    tips: ["Mantenha os cotovelos o mais fechados possível apontados para a frente."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_cable_overhead_triceps",
    name: "Tríceps Francês na Polia com Corda",
    bodyPart: "upper arms",
    target: "Tríceps Cabeça Longa na Polia",
    equipment: "cable",
    instructions: [
      "Polia alta ou média, segure a corda de costas para o aparelho.",
      "Incline o tronco e estenda os braços para a frente acima da cabeça.",
      "Controle a volta sentindo o alongamento da cabeça longa.",
    ],
    tips: ["Tensão contínua em todo o percurso."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_parallel_bar_dips",
    name: "Mergulho nas Barras Paralelas (Tríceps)",
    bodyPart: "upper arms",
    target: "Tríceps & Força de Empurrar",
    equipment: "body weight",
    instructions: [
      "Corpo ereto nas barras paralelas (sem inclinar muito para frente).",
      "Desça mantendo os cotovelos colados ao corpo até 90 graus.",
      "Empurre com força focando em estender os braços pelos tríceps.",
    ],
    tips: ["Tronco mais vertical = maior ênfase no tríceps vs peito."],
    difficulty: "Avançado",
  },
  {
    id: "ex_bench_dips_weighted",
    name: "Mergulho no Banco com Carga",
    bodyPart: "upper arms",
    target: "Tríceps Braquial",
    equipment: "body weight",
    instructions: [
      "Apoie as mãos no banco atrás de você e os pés em outro banco ou no solo.",
      "Coloque uma anilha sobre as coxas se desejar sobrecarga.",
      "Desça flexionando os cotovelos até 90° e suba apertando o tríceps.",
    ],
    tips: ["Costas sempre rente à borda do banco."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_dumbbell_kickback",
    name: "Tríceps Coice com Halter",
    bodyPart: "upper arms",
    target: "Pico de Contração do Tríceps",
    equipment: "dumbbell",
    instructions: [
      "Incline o tronco paralelo ao chão com o braço colado à lateral.",
      "Estenda o antebraço para trás até ficar alinhado com o tronco.",
      "Segure a contração por 1 segundo no topo e retorne a 90°.",
    ],
    tips: ["Não deixe o cotovelo descer; ele fica fixo no alto."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_kickback",
    name: "Tríceps Coice na Polia Baixa",
    bodyPart: "upper arms",
    target: "Pico de Contração sem Perda de Tensão",
    equipment: "cable",
    instructions: [
      "Sem manopla, segure no cabo da polia baixa.",
      "Tronco inclinado, estenda o braço para trás contra a resistência do cabo.",
      "Sinta a queimação na extensão máxima.",
    ],
    tips: ["Diferente do halter, o cabo puxa desde o início do movimento."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_close_grip_bench_press",
    name: "Supino Fechado com Barra",
    bodyPart: "upper arms",
    target: "Tríceps com Sobrecarga Máxima",
    equipment: "barbell",
    instructions: [
      "Deite no banco e segure a barra com pegada na largura dos ombros.",
      "Desça a barra mantendo os cotovelos colados às costelas.",
      "Empurre ativando intensamente a extensão do tríceps.",
    ],
    tips: ["Não junte as mãos muito perto para não estressar os punhos."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_machine_triceps_dip",
    name: "Tríceps na Máquina Sentado",
    bodyPart: "upper arms",
    target: "Isolamento Guiado de Tríceps",
    equipment: "machine",
    instructions: [
      "Sente-se e apoie os pés no suporte travando o cinto se houver.",
      "Apoie as mãos nas manoplas e empurre para baixo.",
      "Retorne devagar sem deixar o peso bater.",
    ],
    tips: ["Excelente para drop sets e falha concêntrica segura."],
    difficulty: "Iniciante",
  },

  // ============================================================
  // BÍCEPS & ANTEBRAÇO (UPPER & LOWER ARMS)
  // ============================================================
  {
    id: "ex_barbell_curl",
    name: "Rosca Direta com Barra (Reta ou W)",
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
  {
    id: "ex_dumbbell_curl",
    name: "Rosca Direta com Halteres",
    bodyPart: "upper arms",
    target: "Bíceps Braquial Livre",
    equipment: "dumbbell",
    mediaFrames: [
      `${CDN_BASE}/Dumbbell_Bicep_Curl/0.jpg`,
      `${CDN_BASE}/Dumbbell_Bicep_Curl/1.jpg`,
    ],
    instructions: [
      "Segure os halteres ao lado das coxas com palmas voltadas para a frente.",
      "Flexione ambos os braços ao mesmo tempo até a altura dos ombros.",
      "Desça controladamente sem jogar os cotovelos para trás.",
    ],
    tips: ["Mantenha o peito aberto e postura ereta."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_alternating_dumbbell_curl",
    name: "Rosca Alternada com Halteres",
    bodyPart: "upper arms",
    target: "Bíceps com Supinação Completa",
    equipment: "dumbbell",
    instructions: [
      "Inicie com pegada neutra ao lado do corpo.",
      "Ao subir, gire o punho para fora (supinação) espremendo o pico do bíceps.",
      "Alterne os braços de forma cadenciada.",
    ],
    tips: ["A supinação potencializa a ativação do pico do bíceps."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_preacher_curl_ez_bar",
    name: "Rosca Scott com Barra W",
    bodyPart: "upper arms",
    target: "Porção Distal do Bíceps & Isolamento",
    equipment: "barbell",
    instructions: [
      "Apoie os braços no banco Scott com as axilas encaixadas no topo da almofada.",
      "Segure a barra W nas curvas internas.",
      "Flexione os antebraços e desça controlando sem esticar excessivamente o tendão.",
    ],
    tips: ["Nunca trave o cotovelo na descida com carga pesada para evitar estiramento."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_machine_preacher_curl",
    name: "Rosca Scott na Máquina",
    bodyPart: "upper arms",
    target: "Bíceps Guiado com Resistência Contínua",
    equipment: "machine",
    instructions: [
      "Ajuste a altura do banco para as axilas apoiarem firmes.",
      "Puxe a manopla em direção ao queixo.",
      "Retorne devagar sentindo o peso trabalhar o bíceps.",
    ],
    tips: ["Perfeita para repetições forçadas com segurança."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_hammer_curl_dumbbell",
    name: "Rosca Martelo com Halteres",
    bodyPart: "upper arms",
    target: "Braquial & Braquiorradial (Espessura do Braço)",
    equipment: "dumbbell",
    mediaFrames: [
      `${CDN_BASE}/Hammer_Curls/0.jpg`,
      `${CDN_BASE}/Hammer_Curls/1.jpg`,
    ],
    instructions: [
      "Segure os halteres com as palmas voltadas uma para a outra (pegada neutra).",
      "Flexione os cotovelos mantendo os polegares apontados para cima.",
      "Desça até a extensão quase completa.",
    ],
    tips: ["Fundamental para criar a 'divisão' lateral entre o bíceps e o tríceps."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_rope_hammer_curl",
    name: "Rosca Martelo na Polia com Corda",
    bodyPart: "upper arms",
    target: "Braquial com Tensão Contínua",
    equipment: "cable",
    instructions: [
      "Polia baixa com o acessório corda.",
      "Segure as pontas da corda na pegada neutra e flexione os antebraços.",
      "Segure 1s no ponto de maior contração.",
    ],
    tips: ["Mantenha os cotovelos fixos ao lado do corpo."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_concentration_curl",
    name: "Rosca Concentrada com Halter",
    bodyPart: "upper arms",
    target: "Pico Máximo de Bíceps",
    equipment: "dumbbell",
    instructions: [
      "Sente-se com as pernas abertas e apoie o cotovelo na parte interna da coxa.",
      "Eleve o halter sem mexer o cotovelo da coxa.",
      "Aperte o bíceps com máxima força no topo e desça com calma.",
    ],
    tips: ["Evite usar o ombro ou inclinar o tronco para roubar."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_incline_dumbbell_curl",
    name: "Rosca Inclinada no Banco 45° com Halteres",
    bodyPart: "upper arms",
    target: "Cabeça Longa do Bíceps (Pico)",
    equipment: "dumbbell",
    instructions: [
      "Deite em um banco inclinado a 45° deixando os braços pendurados para trás.",
      "Flexione os cotovelos mantendo os braços apontados para baixo.",
      "Aproveite o grande alongamento na base do movimento.",
    ],
    tips: ["Um dos melhores exercícios biomecânicos para a cabeça longa do bíceps."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_spider_curl",
    name: "Rosca Spider no Banco Inclinado com Barra W",
    bodyPart: "upper arms",
    target: "Cabeça Curta do Bíceps",
    equipment: "barbell",
    instructions: [
      "Deite de bruços no banco inclinado a 45° com o peito apoiado.",
      "Braços perpendiculares ao chão segurando a barra W.",
      "Flexione em direção à testa sem mover a parte superior do braço.",
    ],
    tips: ["O apoio de bruços impede qualquer roubo com o corpo."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_cable_bicep_curl",
    name: "Rosca na Polia Baixa com Barra Reta",
    bodyPart: "upper arms",
    target: "Bíceps com Cabo",
    equipment: "cable",
    instructions: [
      "Barra reta engatada na polia baixa.",
      "Puxe a barra em arco para cima contraindo os bíceps.",
      "Desça resistindo à tração do cabo.",
    ],
    tips: ["A tensão permanece alta até mesmo no ponto mais baixo."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_21s_bicep_curl",
    name: "Rosca 21 com Barra W",
    bodyPart: "upper arms",
    target: "Pump Extremo e Resistência Muscular",
    equipment: "barbell",
    instructions: [
      "7 repetições da metade inferior até o meio (90 graus).",
      "7 repetições do meio (90 graus) até a contração máxima no topo.",
      "7 repetições completas com amplitude total.",
    ],
    tips: ["Não use carga muito pesada; o foco é queimação metabólica e pump."],
    difficulty: "Avançado",
  },
  {
    id: "ex_reverse_curl_ez_bar",
    name: "Rosca Inversa com Barra W",
    bodyPart: "lower arms",
    target: "Braquiorradial & Extensores de Punho",
    equipment: "barbell",
    instructions: [
      "Segure a barra W com pegada pronada (palmas para baixo).",
      "Flexione os cotovelos elevando a barra até o peito.",
      "Desça controladamente sentindo queimar o antebraço.",
    ],
    tips: ["Excelente para engrossar a região do antebraço próxima ao cotovelo."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_wrist_curl_barbell",
    name: "Rosca Punho com Barra (Flexão de Punho)",
    bodyPart: "lower arms",
    target: "Flexores do Punho & Força de Pegada",
    equipment: "barbell",
    instructions: [
      "Apoie os antebraços sobre as coxas ou no banco plano com os punhos para fora.",
      "Palmas voltadas para cima, flexione apenas os punhos elevando a barra.",
      "Deixe a barra rolar até a ponta dos dedos na descida e retome.",
    ],
    tips: ["Carga moderada com repetições altas (15 a 20 reps)."],
    difficulty: "Iniciante",
  },

  // ============================================================
  // QUADRÍCEPS & MEMBROS INFERIORES (UPPER LEGS)
  // ============================================================
  {
    id: "ex_barbell_squat",
    name: "Agachamento Livre com Barra",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteos & Força Estrutural",
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
    id: "ex_front_squat_barbell",
    name: "Agachamento Frontal com Barra",
    bodyPart: "upper legs",
    target: "Quadríceps Anterior & Core Rígido",
    equipment: "barbell",
    instructions: [
      "Barra apoiada sobre a clavícula e deltoides anteriores, cotovelos altos.",
      "Desça mantendo o tronco estritamente vertical.",
      "Quebre o paralelo dos 90° e suba empurrando com as coxas.",
    ],
    tips: ["Exige grande mobilidade de tornozelo e força de eretores da espinha."],
    difficulty: "Avançado",
  },
  {
    id: "ex_smith_machine_squat",
    name: "Agachamento no Smith Machine",
    bodyPart: "upper legs",
    target: "Quadríceps e Glúteos com Estabilidade",
    equipment: "smith machine",
    instructions: [
      "Posicione a barra do Smith sobre os ombros.",
      "Coloque os pés ligeiramente à frente da linha da barra para proteger os joelhos.",
      "Agache até 90 graus e empurre de volta.",
    ],
    tips: ["A estabilidade da barra permite concentrar o esforço no quadríceps."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_hack_squat_machine",
    name: "Agachamento Hack na Máquina",
    bodyPart: "upper legs",
    target: "Quadríceps com Ênfase no Vasto Lateral",
    equipment: "machine",
    instructions: [
      "Apoie as costas e ombros nas almofadas do Hack.",
      "Pés na plataforma na largura dos ombros.",
      "Destrave a máquina e desça até os joelhos dobrarem a 90 graus.",
      "Suba sem hiperestender ou travar violentamente os joelhos no topo.",
    ],
    tips: ["Mantenha a lombar 100% apoiada no encosto durante toda a repetição."],
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
  {
    id: "ex_horizontal_leg_press",
    name: "Leg Press Horizontal / Sentado",
    bodyPart: "upper legs",
    target: "Quadríceps e Membros Inferiores",
    equipment: "machine",
    instructions: [
      "Sente-se com as costas bem acomodadas e apoie os pés na placa frontal.",
      "Empurre a plataforma e retorne sem deixar as placas colidirem.",
      "Mantenha os joelhos alinhados com a ponta dos pés.",
    ],
    tips: ["Ótimo para iniciantes e reabilitação articular."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_leg_extension_machine",
    name: "Cadeira Extensora",
    bodyPart: "upper legs",
    target: "Isolamento do Reto Femoral & Quadríceps",
    equipment: "machine",
    instructions: [
      "Ajuste o encosto para o joelho alinhar ao eixo de rotação da máquina.",
      "Rolete de apoio posicionado sobre a canela logo acima dos tornozelos.",
      "Estenda os joelhos até a contração máxima e segure 1 segundo no topo.",
      "Desça controladamente resistindo ao peso.",
    ],
    tips: ["Mantenha a ponta dos pés apontada para cima (dorsiflexão)."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_bulgarian_split_squat",
    name: "Agachamento Búlgaro com Halteres",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteos & Equilíbrio Unilateral",
    equipment: "dumbbell",
    instructions: [
      "Apoie o peito de um dos pés atrás em um banco.",
      "Dê um passo à frente com a outra perna segurando um halter em cada mão.",
      "Desça o joelho de trás em direção ao chão até o joelho da frente formar 90 graus.",
      "Empurre pelo calcanhar da frente de volta ao topo.",
    ],
    tips: ["Mantenha o tronco levemente inclinado para a frente para ativar mais o glúteo."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_walking_lunge_dumbbell",
    name: "Passada / Avanço com Halteres",
    bodyPart: "upper legs",
    target: "Coxas, Glúteos & Queima Calórica",
    equipment: "dumbbell",
    instructions: [
      "Segure um par de halteres ao lado do corpo.",
      "Dê passos largos contínuos descendo até o joelho de trás quase encostar no chão.",
      "Mantenha o tronco firme e avance alternando os passos.",
    ],
    tips: ["Não deixe o joelho dianteiro colapsar para dentro."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_goblet_squat",
    name: "Agachamento Goblet com Halter / Kettlebell",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteos & Mobilidade",
    equipment: "dumbbell",
    instructions: [
      "Segure um halter na vertical contra o peitoral.",
      "Pés ligeiramente mais largos que os ombros, pontas apontadas para fora.",
      "Agache profundamente abrindo os joelhos com os cotovelos entre as coxas.",
    ],
    tips: ["Excelente exercício para ensinar padrão motor de agachamento profundo."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_sissy_squat",
    name: "Agachamento Sissy no Suporte",
    bodyPart: "upper legs",
    target: "Isolamento Extremo do Quadríceps",
    equipment: "machine",
    instructions: [
      "Prenda os tornozelos e canelas nas almofadas do suporte sissy.",
      "Incline o tronco para trás dobrando os joelhos.",
      "Suba estendendo com toda a força das coxas.",
    ],
    tips: ["Intensidade altíssima no tendão patelar; comece com amplitude moderada."],
    difficulty: "Avançado",
  },

  // ============================================================
  // POSTERIOR DE COXA / ISQUIOSSURAIS (UPPER LEGS - HAMSTRINGS)
  // ============================================================
  {
    id: "ex_lying_leg_curl",
    name: "Mesa Flexora Deitada",
    bodyPart: "upper legs",
    target: "Isquiotibiais (Posterior de Coxa)",
    equipment: "machine",
    instructions: [
      "Deite-se de bruços no banco ajustando o rolete atrás dos calcanhares.",
      "Segure nas manoplas e flexione as pernas puxando os calcanhares em direção aos glúteos.",
      "Segure 1 segundo no topo e estenda controlando a descida.",
    ],
    tips: ["Pressione a pelve e o quadril contra o banco para não sobrecarregar a lombar."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_seated_leg_curl",
    name: "Cadeira Flexora Sentada",
    bodyPart: "upper legs",
    target: "Posterior de Coxa em Posição Alongada",
    equipment: "machine",
    instructions: [
      "Ajuste a almofada superior travando as coxas firmemente.",
      "Rolete atrás das canelas/calcanhares.",
      "Puxe as pernas para baixo flexionando os joelhos.",
      "Retorne controlando até estender quase por completo.",
    ],
    tips: ["Estudos mostram maior hipertrofia na cadeira flexora devido ao quadril fletido."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_standing_single_leg_curl",
    name: "Flexora Vertical em Pé (Unilateral)",
    bodyPart: "upper legs",
    target: "Isolamento Unilateral de Isquiotibiais",
    equipment: "machine",
    instructions: [
      "Apoie a coxa na almofada frontal e posicione o rolete atrás do tornozelo.",
      "Flexione a perna para cima até a altura do glúteo.",
      "Desça devagar e repita na outra perna.",
    ],
    tips: ["Corrige assimetrias de força e volume entre as pernas."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_barbell_romanian_deadlift_stiff",
    name: "Stiff com Barra (Romanian Deadlift)",
    bodyPart: "upper legs",
    target: "Isquiotibiais, Glúteos & Lombar",
    equipment: "barbell",
    instructions: [
      "Em pé com a barra nas mãos e joelhos levemente destravados (semiflexionados).",
      "Projete o quadril para trás como se quisesse tocar a parede com os glúteos.",
      "Desça a barra rente às pernas até sentir forte alongamento no posterior.",
      "Suba contraindo os glúteos.",
    ],
    tips: ["A coluna deve permanecer reta como uma tábua durante todo o percurso."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_dumbbell_romanian_deadlift_stiff",
    name: "Stiff com Halteres",
    bodyPart: "upper legs",
    target: "Alongamento Profundo de Isquiotibiais",
    equipment: "dumbbell",
    instructions: [
      "Segure um par de halteres à frente das coxas.",
      "Empurre o quadril para trás e deslize os halteres rentes às canelas.",
      "Estenda o quadril apertando glúteos e posterior no topo.",
    ],
    tips: ["Os halteres permitem trajetória mais ergonômica que a barra."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_sumo_deadlift",
    name: "Levantamento Terra Sumô",
    bodyPart: "upper legs",
    target: "Adutores, Glúteos & Posterior",
    equipment: "barbell",
    instructions: [
      "Base bem aberta com pontas dos pés viradas para fora.",
      "Pegada na barra por dentro das pernas.",
      "Com tronco mais verticalizado, empurre o chão abrindo os joelhos.",
    ],
    tips: ["Maior recrutamento de glúteos e adutores comparado ao terra convencional."],
    difficulty: "Avançado",
  },
  {
    id: "ex_barbell_good_morning",
    name: "Bom Dia com Barra (Good Morning)",
    bodyPart: "upper legs",
    target: "Cadeia Posterior e Eretores Espinhais",
    equipment: "barbell",
    instructions: [
      "Barra apoiada sobre o trapézio como no agachamento.",
      "Com joelhos semiflexionados, flexione o quadril para a frente até o tronco ficar quase paralelo ao solo.",
      "Retorne à posição em pé contraindo glúteos.",
    ],
    tips: ["Comece com cargas leves para dominar a flexão pura do quadril."],
    difficulty: "Avançado",
  },

  // ============================================================
  // GLÚTEOS (GLUTES)
  // ============================================================
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
    id: "ex_machine_hip_thrust",
    name: "Elevação Pélvica na Máquina",
    bodyPart: "upper legs",
    target: "Glúteo Máximo na Máquina",
    equipment: "machine",
    instructions: [
      "Sente-se na máquina e aperte o cinto almofadado sobre a bacia.",
      "Empurre a plataforma com os calcanhares até a extensão completa.",
      "Segure 2s no ponto mais alto e desça controlado.",
    ],
    tips: ["Elimina a montagem de barra e anilhas pesadas."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_abductor_machine",
    name: "Cadeira Abdutora",
    bodyPart: "upper legs",
    target: "Glúteo Médio & Mínimo",
    equipment: "machine",
    instructions: [
      "Sente-se com as costas apoiadas e joelhos posicionados nas almofadas laterais.",
      "Abra as pernas com força contra a resistência.",
      "Segure 1 segundo aberta e feche devagar sem deixar as placas encostarem.",
    ],
    tips: ["Inclinar o tronco levemente à frente recruta fibras superiores do glúteo."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_glute_kickback",
    name: "Glúteo Coice na Polia com Caneleira",
    bodyPart: "upper legs",
    target: "Isolamento do Glúteo Máximo no Cabo",
    equipment: "cable",
    instructions: [
      "Prenda o puxador de tornozelo na polia baixa.",
      "Apoie as mãos na estrutura do crossover com tronco inclinado.",
      "Chute a perna para trás e para cima apertando o glúteo.",
      "Retorne sem deixar a perna balançar.",
    ],
    tips: ["Mantenha o joelho levemente flexionado e não arqueie a lombar."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_floor_glute_kickback",
    name: "Glúteo 4 Apoios no Solo com Caneleira",
    bodyPart: "upper legs",
    target: "Glúteo Máximo no Solo",
    equipment: "body weight",
    instructions: [
      "Posição de quatro apoios no colchonete com caneleiras nos tornozelos.",
      "Eleve a perna dobrada a 90 graus com a sola do pé apontada para o teto.",
      "Aperte o glúteo no topo e desça sem encostar o joelho no chão.",
    ],
    tips: ["Mantenha o quadril nivelado."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_machine_glute_kickback",
    name: "Glúteo na Máquina Articulada",
    bodyPart: "upper legs",
    target: "Glúteo Máximo com Trajetória Guiada",
    equipment: "machine",
    instructions: [
      "Apoie o peito na almofada e posicione o pé no pedal da máquina.",
      "Empurre a perna para trás estendendo o quadril.",
      "Volte devagar resistindo à carga.",
    ],
    tips: ["Foque em empurrar com a força do glúteo e não com a lombar."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_sumo_squat_dumbbell",
    name: "Agachamento Sumô com Halter",
    bodyPart: "upper legs",
    target: "Glúteos & Adutores da Coxa",
    equipment: "dumbbell",
    instructions: [
      "Fique em pé com pés bem afastados e pontas a 45 graus para fora.",
      "Segure um halter pesado com as duas mãos entre as pernas.",
      "Agache profundamente até o halter quase tocar o chão e suba apertando os glúteos.",
    ],
    tips: ["Pode ser feito sobre dois steps para maior amplitude de descida."],
    difficulty: "Iniciante",
  },

  // ============================================================
  // PANTURRILHAS (LOWER LEGS - CALVES)
  // ============================================================
  {
    id: "ex_standing_calf_raise_machine",
    name: "Panturrilha em Pé na Máquina",
    bodyPart: "lower legs",
    target: "Gastrocnêmio (Músculo Principal da Panturrilha)",
    equipment: "machine",
    instructions: [
      "Apoie as pontas dos pés na borda da plataforma e almofadas sobre os ombros.",
      "Desça os calcanhares ao máximo alongando a panturrilha.",
      "Suba na ponta máxima dos pés e segure 2 segundos no topo.",
    ],
    tips: ["Não pule ou dê rebote no fundo; pause 1s no ponto de alongamento."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_seated_calf_raise_machine",
    name: "Panturrilha Sentado (Gêmeos na Máquina)",
    bodyPart: "lower legs",
    target: "Sóleo (Espessura e Densidade da Panturrilha)",
    equipment: "machine",
    instructions: [
      "Sente-se com as almofadas sobre a parte inferior das coxas.",
      "Apoie a ponta dos pés na plataforma e solte a trava.",
      "Desça alongando completamente e suba espremendo o sóleo.",
    ],
    tips: ["Com joelhos fletidos a 90°, o sóleo assume quase todo o trabalho."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_calf_raise_on_leg_press",
    name: "Panturrilha no Leg Press 45°",
    bodyPart: "lower legs",
    target: "Gastrocnêmio com Sobrecarga",
    equipment: "machine",
    instructions: [
      "Sente-se no Leg Press com as pontas dos pés na borda inferior da plataforma.",
      "Empurre com as pontas dos pés para estender os tornozelos.",
      "Deixe a plataforma descer alongando bem a fáscia plantar.",
    ],
    tips: ["Mantenha as travas de segurança acionadas para emergências."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_smith_calf_raise",
    name: "Panturrilha em Pé no Smith Machine",
    bodyPart: "lower legs",
    target: "Panturrilha Livre com Step",
    equipment: "smith machine",
    instructions: [
      "Coloque um step ou bloco sob a barra do Smith.",
      "Suba na ponta dos pés no step com a barra sobre o trapézio.",
      "Realize flexões plantares completas com cadência lenta.",
    ],
    tips: ["Permite empilhar anilhas com estabilidade de trilho."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_single_leg_calf_raise",
    name: "Panturrilha Unilateral no Degrau com Halter",
    bodyPart: "lower legs",
    target: "Força e Simetria de Panturrilhas",
    equipment: "dumbbell",
    instructions: [
      "Apoie um pé no degrau e segure um halter na mão do mesmo lado.",
      "Use a outra mão para equilibrar na parede.",
      "Suba e desça com amplitude máxima em uma perna por vez.",
    ],
    tips: ["Muito eficiente para quem tem dificuldade de crescer panturrilhas."],
    difficulty: "Iniciante",
  },

  // ============================================================
  // ABDÔMEN & CORE (WAIST)
  // ============================================================
  {
    id: "ex_decline_crunch",
    name: "Abdominal no Banco Declinado",
    bodyPart: "waist",
    target: "Reto Abdominal com Gravidade Aumentada",
    equipment: "body weight",
    instructions: [
      "Prenda os pés no suporte do banco declinado.",
      "Cruze os braços no peito ou mãos ao lado da cabeça.",
      "Flexione a coluna enrolando o abdômen para subir.",
      "Desça sem encostar totalmente as costas no banco.",
    ],
    tips: ["Para maior intensidade, segure uma anilha sobre o peito."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_cable_kneeling_crunch",
    name: "Abdominal na Polia Ajoelhado (Cable Crunch)",
    bodyPart: "waist",
    target: "Reto Abdominal com Carga Progressiva",
    equipment: "cable",
    instructions: [
      "Ajoelhe-se de frente para a polia alta segurando a corda atrás da cabeça.",
      "Flexione a coluna trazendo os cotovelos em direção aos joelhos.",
      "Solte todo o ar na descida e contraia forte o abdômen.",
    ],
    tips: ["Não dobre o quadril; dobre a coluna para o abdômen fazer o trabalho."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_machine_crunch",
    name: "Abdominal na Máquina Sentado",
    bodyPart: "waist",
    target: "Isolamento Abdominal Guiado",
    equipment: "machine",
    instructions: [
      "Sente-se ajustando as almofadas no peito e pés travados.",
      "Enrole o tronco para a frente empurrando a resistência.",
      "Segure 1 segundo no pico e retorne devagar.",
    ],
    tips: ["Permite aplicar sobrecarga progressiva com facilidade."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_hanging_leg_raise",
    name: "Elevação de Pernas na Barra Fixa (Infra)",
    bodyPart: "waist",
    target: "Abdômen Infra & Flexores do Quadril",
    equipment: "body weight",
    instructions: [
      "Pendure-se na barra com pegada pronada.",
      "Eleve as pernas estendidas (ou joelhos flexionados) até a linha do quadril.",
      "Enrole a bacia para cima no final para ativar o abdômen e desça sem embalar.",
    ],
    tips: ["O segredo está em rodar a bacia para cima e não apenas subir a perna."],
    difficulty: "Avançado",
  },
  {
    id: "ex_captain_chair_leg_raise",
    name: "Elevação de Joelhos na Paralela (Capitão)",
    bodyPart: "waist",
    target: "Abdômen Inferior com Apoio",
    equipment: "body weight",
    instructions: [
      "Apoie os antebraços nas almofadas do suporte capitão com costas no encosto.",
      "Eleve os joelhos em direção ao peito.",
      "Desça de forma controlada sem balançar.",
    ],
    tips: ["Mais acessível que na barra fixa por ter suporte para a coluna."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_side_plank",
    name: "Prancha Lateral Isométrica",
    bodyPart: "waist",
    target: "Oblíquos, Quadrado Lombar & Core Lateral",
    equipment: "body weight",
    instructions: [
      "Deite de lado apoiando o antebraço no chão sob o ombro.",
      "Eleve o quadril do solo até formar uma linha reta dos pés à cabeça.",
      "Segure de 30 a 45 segundos e troque o lado.",
    ],
    tips: ["Não deixe o quadril cair em direção ao chão."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_ab_wheel_rollout",
    name: "Roda Abdominal no Solo (Rolinho)",
    bodyPart: "waist",
    target: "Transverso Abdominal, Reto Abdominal & Core Total",
    equipment: "body weight",
    instructions: [
      "Ajoelhe-se segurando a roda abdominal à sua frente.",
      "Role a roda para a frente estendendo o corpo o máximo que conseguir sem arquear as costas.",
      "Puxe de volta usando puramente a força do abdômen.",
    ],
    tips: ["Mantenha a pelve retrovertida para proteger a coluna lombar."],
    difficulty: "Avançado",
  },
  {
    id: "ex_stomach_vacuum",
    name: "Vacum Abdominal (Stomach Vacuum)",
    bodyPart: "waist",
    target: "Transverso do Abdômen (Afinamento de Cintura)",
    equipment: "body weight",
    instructions: [
      "Em pé ou inclinado apoiando as mãos nos joelhos, expire todo o ar dos pulmões.",
      "Sem puxar ar, 'chupe' o estômago para dentro e para cima em direção às costelas.",
      "Mantenha por 15 a 20 segundos e respire.",
    ],
    tips: ["Fortalece a cinta natural do corpo reduzindo medidas da cintura."],
    difficulty: "Iniciante",
  },

  // ============================================================
  // CARDIO & AQUECIMENTO (CARDIO)
  // ============================================================
  {
    id: "ex_treadmill",
    name: "Esteira Ergométrica (Corrida / Caminhada Inclinada)",
    bodyPart: "cardio",
    target: "Sistema Cardiovascular & Queima de Gordura",
    equipment: "machine",
    instructions: [
      "Inicie com caminhada de aquecimento a 5 km/h por 3 minutos.",
      "Ajuste a inclinação (ex: 8% a 12%) para caminhada aeróbica sem impacto nas articulações.",
      "Ou aumente a velocidade para corrida contínua ou tiros intervalados (HIIT).",
    ],
    tips: ["Evite se apoiar nas barras laterais para não diminuir o gasto calórico."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_stationary_bike",
    name: "Bicicleta Ergométrica (Vertical / Horizontal)",
    bodyPart: "cardio",
    target: "Resistência Aeróbica & Aquecimento de Joelhos",
    equipment: "machine",
    instructions: [
      "Ajuste a altura do banco na altura do osso do quadril.",
      "Pedale com cadência constante de 70 a 90 RPM.",
      "Ajuste a carga eletromagnética para simular subidas.",
    ],
    tips: ["Excelente para quem tem dores nos joelhos ou sobrepeso."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_elliptical_trainer",
    name: "Elíptico / Transport",
    bodyPart: "cardio",
    target: "Cardio Total Zero Impacto Articular",
    equipment: "machine",
    instructions: [
      "Suba nos pedais e segure nas hastes móveis.",
      "Mova os pés em trajetória elíptica enquanto empurra e puxa com os braços.",
      "Mantenha postura ereta durante toda a sessão.",
    ],
    tips: ["Zero choque nos tornozelos e coluna."],
    difficulty: "Iniciante",
  },
  {
    id: "ex_stair_climber",
    name: "Escada Ergométrica (Stairmaster)",
    bodyPart: "cardio",
    target: "Glúteos, Pernas & Alto Gasto Calórico",
    equipment: "machine",
    instructions: [
      "Suba os degraus em ritmo constante pisando com a sola inteira no degrau.",
      "Mantenha o tronco ereto sem debruçar nos apoios de mão.",
      "Sessões de 15 a 30 minutos geram queima calórica maciça.",
    ],
    tips: ["Pise com o calcanhar para transferir a queimação diretamente para o glúteo."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_rowing_machine",
    name: "Remo Seco Ergométrico",
    bodyPart: "cardio",
    target: "Costas, Pernas & Potência Cardiorrespiratória",
    equipment: "machine",
    instructions: [
      "Prenda os pés nas tiras e segure na barra com braços estendidos.",
      "Empurre com as pernas primeiro, incline o tronco para trás e puxe a barra até a boca do estômago.",
      "Inverta a sequência no retorno de forma ritmada.",
    ],
    tips: ["Potência 60% nas pernas, 20% no core e 20% nos braços."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_jump_rope",
    name: "Pular Corda (Cardio & Agilidade)",
    bodyPart: "cardio",
    target: "Coordenação Motora, Panturrilhas & Queima Rápida",
    equipment: "body weight",
    instructions: [
      "Segure as manoplas da corda na altura do quadril.",
      "Gire a corda com os punhos e salte de 2 a 3 cm do solo nas pontas dos pés.",
      "Mantenha ritmo constante sem bater os calcanhares no chão.",
    ],
    tips: ["Aterrissagem macia e saltos baixos poupam energia."],
    difficulty: "Intermediário",
  },
  {
    id: "ex_assault_air_bike",
    name: "Air Bike / Assault Bike (HIIT Intenso)",
    bodyPart: "cardio",
    target: "Capacidade Anaeróbica & Queima Extrema",
    equipment: "machine",
    instructions: [
      "Ajuste o assento e posicione mãos nas manoplas e pés nos pedais.",
      "Empurre e puxe com os braços enquanto pedala com máxima força.",
      "Quanto mais força aplicar, maior a resistência gerada pelo ventilador.",
    ],
    tips: ["Ideal para protocolos Tabata de 20s pedalada máxima por 10s descanso."],
    difficulty: "Avançado",
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
// GESTÃO DE EXERCÍCIOS PERSONALIZADOS (LOCAL STORAGE)
// -------------------------------------------------------------
const STORAGE_KEY_CUSTOM_EXERCISES = "gymflow_custom_exercises_v1";

export function getCustomExercises(): ExerciseDBItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_EXERCISES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomExercise(
  exercise: Omit<ExerciseDBItem, "id"> & { id?: string }
): ExerciseDBItem {
  const customList = getCustomExercises();
  const newEx: ExerciseDBItem = {
    ...exercise,
    id: exercise.id || `custom_${Date.now()}`,
    isCustom: true,
  };

  const existingIdx = customList.findIndex(
    (e) => e.id === newEx.id || e.name.toLowerCase().trim() === newEx.name.toLowerCase().trim()
  );

  let updatedList: ExerciseDBItem[];
  if (existingIdx >= 0) {
    updatedList = [...customList];
    updatedList[existingIdx] = newEx;
  } else {
    updatedList = [newEx, ...customList];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_CUSTOM_EXERCISES, JSON.stringify(updatedList));
    window.dispatchEvent(new Event("gymflow:custom-exercises-updated"));
  }
  return newEx;
}

export function deleteCustomExercise(id: string): void {
  if (typeof window === "undefined") return;
  const customList = getCustomExercises();
  const updated = customList.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY_CUSTOM_EXERCISES, JSON.stringify(updated));
  window.dispatchEvent(new Event("gymflow:custom-exercises-updated"));
}

export function getAllExercises(): ExerciseDBItem[] {
  const custom = getCustomExercises();
  return [...custom, ...LOCAL_EXERCISE_DB];
}

// -------------------------------------------------------------
// SERVIÇO DE BUSCA E INTEGRAÇÃO DE EXERCÍCIOS
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

  // Se houver chave remota configurada, tenta buscar na API externa com fallback transparente
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
      console.warn("Falha no fetch remoto, usando banco local de exercícios:", e);
    }
  }

  // Busca no catálogo completo (exercícios locais + personalizados)
  let filtered = getAllExercises();

  if (filters?.bodyPart && filters.bodyPart !== "todos") {
    filtered = filtered.filter((ex) => ex.bodyPart.toLowerCase() === filters.bodyPart?.toLowerCase());
  }

  if (filters?.equipment && filters.equipment !== "todos") {
    filtered = filtered.filter((ex) => ex.equipment.toLowerCase() === filters.equipment?.toLowerCase());
  }

  if (query.trim()) {
    const term = query.toLowerCase().trim();
    filtered = filtered.filter(
      (ex) =>
        ex.name.toLowerCase().includes(term) ||
        ex.target.toLowerCase().includes(term) ||
        ex.bodyPart.toLowerCase().includes(term) ||
        ex.equipment.toLowerCase().includes(term)
    );
  }

  return filtered;
}

/**
 * Retorna os dados de mídia e instruções de um exercício por ID ou nome
 */
export function getExerciseDetails(exerciseIdOrName: string): ExerciseDBItem | undefined {
  if (!exerciseIdOrName) return undefined;
  const all = getAllExercises();

  const matchById = all.find((ex) => ex.id === exerciseIdOrName);
  if (matchById) return matchById;

  const matchByName = all.find(
    (ex) => ex.name.toLowerCase().trim() === exerciseIdOrName.toLowerCase().trim()
  );
  return matchByName;
}

