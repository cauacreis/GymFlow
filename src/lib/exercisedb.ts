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

  {
    id: "ex_hex_press_dumbbell",
    name: "Supino Hex Press com Halteres",
    bodyPart: "chest",
    target: "Peitoral Maior (Foco Medial) & Tríceps",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Supino_Hex_Press_com_Halteres/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Supino_Hex_Press_com_Halteres/1.jpg",
    ],
    instructions: [
      "Deite no banco reto segurando dois halteres colados um contra o outro no centro do peito.",
      "Mantenha uma pressão constante empurrando os halteres um contra o outro durante todo o trajeto.",
      "Empurre para cima estendendo os braços e aperte o centro do peito no topo.",
      "Desça mantendo a adução ativa e constante."
    ],
    tips: [
      "A chave do exercício é a compressão contínua entre os halteres.",
      "Excelente para quem sente dificuldade em conectar a mente com a contração do miolo do peitoral."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_mid_cable_crossover",
    name: "Crossover na Polia Média",
    bodyPart: "chest",
    target: "Peitoral Maior (Foco Esternal)",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crossover_na_Polia_M_dia/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crossover_na_Polia_M_dia/1.jpg",
    ],
    instructions: [
      "Ajuste as duas roldanas na altura média (linha dos mamilos ou costelas).",
      "Dê um passo à frente com base dividida e una as mãos em arco à frente do peito.",
      "Cruze ligeiramente as mãos no final do movimento para contração máxima.",
      "Retorne controlando a abertura até sentir o alongamento peitoral."
    ],
    tips: [
      "Mantenha uma leve flexão nos cotovelos durante todo o trajeto.",
      "Evite inclinar excessivamente o tronco para a frente."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_diamond_pushups",
    name: "Flexão Diamante no Solo",
    bodyPart: "chest",
    target: "Tríceps Braquial & Peitoral Medial",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flex_o_Diamante_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flex_o_Diamante_no_Solo/1.jpg",
    ],
    instructions: [
      "Fique em posição de flexão no chão com as mãos unidas sob o esterno formando um diamante com polegares e indicadores.",
      "Mantenha o corpo reto e abdômen firme.",
      "Desça flexionando os cotovelos junto ao corpo até o peito encostar nas mãos.",
      "Empurre o solo com foco nos tríceps e peitoral medial."
    ],
    tips: [
      "Se sentir desconforto nos punhos, afaste ligeiramente as mãos mantendo pegada fechada.",
      "Pode ser executado com apoio dos joelhos para iniciantes."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_decline_pushups",
    name: "Flexão Declinada (Pés Elevados no Banco)",
    bodyPart: "chest",
    target: "Peitoral Superior (Porção Clavicular) & Deltoide Anterior",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flex_o_Declinada/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flex_o_Declinada/1.jpg",
    ],
    instructions: [
      "Apoie a ponta dos pés em um banco, cadeira ou degrau e as mãos no solo na largura dos ombros.",
      "Mantenha a prancha corporal perfeita sem deixar o quadril desabar.",
      "Desça o peito em direção ao chão e empurre com explosão controlada."
    ],
    tips: [
      "Quanto mais alto o apoio dos pés, maior o recrutamento da porção superior do peito e ombros.",
      "Não deixe a cabeça pender para baixo."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_incline_smith_bench_press",
    name: "Supino Inclinado no Smith Machine",
    bodyPart: "chest",
    target: "Peitoral Superior & Deltoide Anterior",
    equipment: "smith machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Supino_Inclinado_no_Smith_Machine/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Supino_Inclinado_no_Smith_Machine/1.jpg",
    ],
    instructions: [
      "Posicione o banco inclinado a 30° centralizado sob a barra guiada do Smith.",
      "Segure a barra com pegada ligeiramente mais aberta que os ombros.",
      "Destrave e desça a barra até tocar suavemente a parte alta do peito (logo abaixo da clavícula).",
      "Empurre a barra em linha reta focando na contração do peitoral superior."
    ],
    tips: [
      "O Smith permite aplicar sobrecarga com segurança e focar totalmente na ativação muscular sem perda de estabilidade.",
      "Mantenha os cotovelos apontando a 45°-60° do tronco."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_decline_dumbbell_fly",
    name: "Crucifixo Declinado com Halteres",
    bodyPart: "chest",
    target: "Peitoral Inferior (Porção Abdominal)",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crucifixo_Declinado_com_Halteres/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crucifixo_Declinado_com_Halteres/1.jpg",
    ],
    instructions: [
      "Deite em um banco declinado com os pés travados no suporte, segurando os halteres acima do peito.",
      "Abra os braços em arco suave até sentir alongamento na porção inferior do peito.",
      "Traga os halteres de volta ao centro em movimento de abraço."
    ],
    tips: [
      "Mantenha os cotovelos fixos em leve flexão para proteger a articulação.",
      "Concentre-se em espremer a base do peitoral no topo."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_dumbbell_floor_press",
    name: "Supino no Chão com Halteres (Floor Press)",
    bodyPart: "chest",
    target: "Peitoral Maior & Tríceps (Bloqueio)",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Supino_no_Ch_o_com_Halteres/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Supino_no_Ch_o_com_Halteres/1.jpg",
    ],
    instructions: [
      "Deite de costas no solo com os joelhos flexionados e pés apoiados.",
      "Segure os halteres acima do peito e desça até que a parte posterior dos braços toque o chão.",
      "Faça uma pausa de 1 segundo com os braços no solo sem relaxar a tensão muscular.",
      "Empurre com força até a extensão completa."
    ],
    tips: [
      "Elimina o estresse excessivo no ombro na fase mais funda do supino.",
      "Excelente para hipertrofia de tríceps e superação de pontos de estagnação no supino reto."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_svend_press",
    name: "Supino Svend com Anilhas (Svend Press)",
    bodyPart: "chest",
    target: "Peitoral Maior (Isometria e Densidade)",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Supino_Svend_com_Anilhas/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Supino_Svend_com_Anilhas/1.jpg",
    ],
    instructions: [
      "Fique em pé segurando duas anilhas pequenas (ou uma de 5kg) prensadas entre as palmas das mãos na frente do peito.",
      "Pressione as palmas com máxima força e estenda os braços horizontalmente para a frente.",
      "Segure 2 segundos de contração peitoral com braços estendidos e retorne ao peito."
    ],
    tips: [
      "Não use peso excessivo; o estímulo vem da pressão isométrica entre as mãos.",
      "Perfeito como finalizador (burnout) no final do treino de peito."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_single_arm_cable_fly",
    name: "Crucifixo Unilateral na Polia (Single Arm Fly)",
    bodyPart: "chest",
    target: "Peitoral Maior & Correção de Assimetrias",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crucifixo_Unilateral_na_Polia/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crucifixo_Unilateral_na_Polia/1.jpg",
    ],
    instructions: [
      "Posicione-se de lado para a torre de polia com o cabo na altura do peito.",
      "Puxe a manilha cruzando a linha média do tronco em direção ao ombro oposto.",
      "Aperte o peitoral por 2 segundos no ponto de maior adução e retorne devagar."
    ],
    tips: [
      "Permite uma amplitude de adução muito maior que o crucifixo bilateral tradicional.",
      "Excelente para corrigir desbalanços de força e volume entre os lados direito e esquerdo."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_incline_cable_fly",
    name: "Crucifixo Inclinado na Polia Baixa",
    bodyPart: "chest",
    target: "Peitoral Superior & Clavicular",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crucifixo_Inclinado_na_Polia_Baixa/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crucifixo_Inclinado_na_Polia_Baixa/1.jpg",
    ],
    instructions: [
      "Posicione um banco inclinado a 30° entre duas polias baixas.",
      "Segure as manoplas e traga os cabos para cima e para o centro em arco convergente.",
      "Aperte o topo do peitoral e retorne alongando sob tensão contínua do cabo."
    ],
    tips: [
      "A tensão constante dos cabos mantém o peitoral superior ativado mesmo no topo do movimento.",
      "Mantenha o peito estufado e ombros para trás."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_archer_pushups",
    name: "Flexão Arqueiro no Solo (Archer Push-ups)",
    bodyPart: "chest",
    target: "Peitoral Maior, Tríceps & Força Unilateral",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flex_o_Arqueiro_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flex_o_Arqueiro_no_Solo/1.jpg",
    ],
    instructions: [
      "Inicie em posição de flexão com mãos bem afastadas além da largura dos ombros.",
      "Desça o corpo sobre um dos braços flexionando-o enquanto o outro braço permanece estendido lateralmente.",
      "Empurre de volta ao centro e repita para o lado oposto em padrão arqueiro."
    ],
    tips: [
      "Excelente progressão de calistenia para a flexão unilateral de um braço só.",
      "Mantenha o core rígido para evitar torção do quadril."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_v_bar_lat_pulldown",
    name: "Puxada com Triângulo / Barra V no Pulley",
    bodyPart: "back",
    target: "Grande Dorsal (Foco Inferior) & Romboides",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Puxada_com_Tri_ngulo___Barra_V_no_Pulley/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Puxada_com_Tri_ngulo___Barra_V_no_Pulley/1.jpg",
    ],
    instructions: [
      "Prenda o puxador triângulo (V-Bar) na polia alta e sente-se com coxas travadas nas almofadas.",
      "Incline levemente o tronco para trás (10°-15°) e puxe o triângulo até o topo do peito.",
      "Aperte as escápulas e mantenha os cotovelos direcionados para baixo e para dentro.",
      "Suba controladamente permitindo que as dorsais se alonguem por completo."
    ],
    tips: [
      "A pegada neutra fechada favorece o recrutamento das fibras inferiores da grande dorsal.",
      "Não use impulso do tronco para puxar a carga."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_single_arm_lat_pulldown",
    name: "Puxada Unilateral na Polia Alta",
    bodyPart: "back",
    target: "Grande Dorsal & Redondo Maior",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Puxada_Unilateral_na_Polia_Alta/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Puxada_Unilateral_na_Polia_Alta/1.jpg",
    ],
    instructions: [
      "Ajoelhe-se ou sente-se lateralmente à polia alta segurando uma manilha individual.",
      "Inicie o movimento puxando o cotovelo para baixo em direção ao quadril do mesmo lado.",
      "Faça uma ligeira flexão lateral do tronco no final para contração máxima da dorsal.",
      "Deixe o cabo puxar e alongar a dorsal completamente no topo."
    ],
    tips: [
      "Permite seguir perfeitamente a linha de tração anatômica das fibras da dorsal.",
      "Ideal para atletas com assimetria de costas ou escoliose leve."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_converging_machine_pulldown",
    name: "Puxada Articulada Convergente na Máquina",
    bodyPart: "back",
    target: "Grande Dorsal, Redondo Maior & Bíceps",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Puxada_Articulada_Convergente_na_M_quina/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Puxada_Articulada_Convergente_na_M_quina/1.jpg",
    ],
    instructions: [
      "Ajuste o assento para que os braços comecem totalmente estendidos ao segurar as manoplas.",
      "Puxe os braços articulados para baixo com movimento fluido e convergente até a linha do queixo/peito.",
      "Segure 1 segundo no ponto de pico e retorne controlando a fase excêntrica."
    ],
    tips: [
      "A trajetória convergente respeita a biomecânica natural dos ombros e escápulas.",
      "Permite trabalhar com altas cargas sem risco de desequilíbrio."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_chest_supported_db_row",
    name: "Remada no Banco Inclinado com Halteres (Chest-Supported)",
    bodyPart: "back",
    target: "Romboides, Trapézio Médio e Dorsais",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_no_Banco_Inclinado_com_Halteres/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_no_Banco_Inclinado_com_Halteres/1.jpg",
    ],
    instructions: [
      "Deite de bruços em um banco inclinado a 30°-45° com o peito totalmente apoiado.",
      "Segure os halteres com os braços pendurados perpendicularmente ao solo.",
      "Puxe os halteres trazendo os cotovelos para trás e apertando as escápulas com força.",
      "Desça devagar estendendo os braços e sentindo as escápulas se abrirem."
    ],
    tips: [
      "Isola completamente as costas retirando qualquer sobrecarga ou compensação da lombar.",
      "Mantenha o peito sempre colado no acolchoado do banco."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_meadows_row",
    name: "Remada Meadows com Barra / Landmine",
    bodyPart: "back",
    target: "Grande Dorsal, Redondo Maior e Trapézio",
    equipment: "barbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Meadows_com_Barra___Landmine/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Meadows_com_Barra___Landmine/1.jpg",
    ],
    instructions: [
      "Posicione uma barra no suporte Landmine (canto) e fique perpendicular à ponta da barra com base dividida.",
      "Segure a ponta da barra com pegada pronada com uma das mãos, apoiando o cotovelo oposto na coxa.",
      "Puxe a barra liderando pelo cotovelo até que ele ultrapasse a linha do tronco.",
      "Desça alongando a dorsal profundamente."
    ],
    tips: [
      "Criada pelo lendário bodybuilder John Meadows para hipertrofia extrema da porção lateral das costas.",
      "Use straps na pegada para focar 100% nas costas sem cansar o antebraço."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_kroc_row",
    name: "Remada Kroc com Halter Pesado",
    bodyPart: "back",
    target: "Dorsais, Trapézio, Romboides & Pegada",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Kroc_com_Halter_Pesado/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Kroc_com_Halter_Pesado/1.jpg",
    ],
    instructions: [
      "Apoie uma mão em um banco ou suporte e incline o tronco quase paralelo ao solo.",
      "Segure um halter pesado e execute remadas explosivas em altas repetições (15-25 reps).",
      "Permita uma leve rotação controlada da parte superior do tronco no pico para amplitude máxima.",
      "Mantenha o ritmo intenso com controle postural."
    ],
    tips: [
      "Excelente para ganho de força brutal na pegada e espessura dorsal.",
      "Diferente do serrote clássico, o Kroc Row usa cargas elevadas com alta intensidade metabólica."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_seal_row",
    name: "Remada Seal no Banco Reto (Seal Row)",
    bodyPart: "back",
    target: "Romboides, Trapézio Médio/Inferior e Grande Dorsal",
    equipment: "barbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Seal_no_Banco_Reto/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Seal_no_Banco_Reto/1.jpg",
    ],
    instructions: [
      "Deite de bruços em um banco reto elevado segurando uma barra por baixo.",
      "Puxe a barra em direção à base do banco/peito com os cotovelos apontando para fora e para trás.",
      "Toque a barra no banco, aperte as escápulas e desça controladamente."
    ],
    tips: [
      "Elimina qualquer tipo de roubo ou impulso com pernas e tronco.",
      "Padrão ouro para desenvolvimento da espessura do meio das costas."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_smith_machine_row",
    name: "Remada Curvada no Smith Machine",
    bodyPart: "back",
    target: "Dorsais, Romboides & Trapézio",
    equipment: "smith machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Curvada_no_Smith_Machine/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Curvada_no_Smith_Machine/1.jpg",
    ],
    instructions: [
      "Fique em pé em frente à barra do Smith, destrave com pegada pronada ou supinada e incline o tronco a 45°.",
      "Puxe a barra em direção ao umbigo mantendo os cotovelos próximos às costelas.",
      "Aperte as costas no topo e desça sentindo o alongamento da musculatura."
    ],
    tips: [
      "O trilho fixo do Smith permite uma trajetória perfeitamente estável e foco absoluto na contração das costas.",
      "Mantenha a coluna neutra e joelhos levemente destravados."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_rope_straight_arm_pulldown",
    name: "Pulldown na Polia com Corda",
    bodyPart: "back",
    target: "Grande Dorsal (Isolamento) & Redondo Maior",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pulldown_na_Polia_com_Corda/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pulldown_na_Polia_com_Corda/1.jpg",
    ],
    instructions: [
      "Prenda a corda na polia alta, dê dois passos para trás e incline o tronco a 30° com braços estendidos.",
      "Puxe a corda em arco descendente até as coxas, abrindo as pontas da corda ao lado do quadril no final.",
      "Aperte as dorsais com máxima intensidade e retorne controladamente acima da cabeça."
    ],
    tips: [
      "A corda permite maior liberdade de movimento e extensão no final que a barra reta.",
      "Mantenha os cotovelos firmes com microflexão sem dobrá-los durante a puxada."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_neutral_grip_pullup",
    name: "Barra Fixa com Pegada Neutra (Palmas Frente a Frente)",
    bodyPart: "back",
    target: "Grande Dorsal, Braquial & Bíceps",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barra_Fixa_com_Pegada_Neutra/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barra_Fixa_com_Pegada_Neutra/1.jpg",
    ],
    instructions: [
      "Segure as manoplas paralelas da barra fixa com as palmas voltadas uma para a outra.",
      "Puxe o corpo para cima levando o peito em direção à barra até o queixo ultrapassar a altura das mãos.",
      "Desça lentamente até a extensão quase completa dos braços."
    ],
    tips: [
      "A pegada neutra é a mais segura e confortável para os ombros e punhos.",
      "Excelente transferência de força para puxadas pesadas."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_inverted_row",
    name: "Remada Invertida na Barra / TRX (Inverted Row)",
    bodyPart: "back",
    target: "Romboides, Trapézio Médio, Dorsais & Core",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Invertida_na_Barra___TRX/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Invertida_na_Barra___TRX/1.jpg",
    ],
    instructions: [
      "Posicione uma barra no Smith ou rack na altura da cintura e deite-se por baixo.",
      "Segure a barra com pegada pronada na largura dos ombros com corpo em linha reta e calcanhares no chão.",
      "Puxe o peito em direção à barra mantendo o abdômen e glúteos travados.",
      "Desça até os braços estenderem totalmente."
    ],
    tips: [
      "Para facilitar, dobre os joelhos e apoie a sola dos pés no chão.",
      "Para dificultar, apoie os pés sobre um banco reto."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_back_hyperextension",
    name: "Hiperextensão Lombar no Banco Romano (45°)",
    bodyPart: "back",
    target: "Eretores da Espinha, Glúteos & Isquiotibiais",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hiperextens_o_Lombar_no_Banco_Romano/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hiperextens_o_Lombar_no_Banco_Romano/1.jpg",
    ],
    instructions: [
      "Posicione-se no banco de hiperextensão com o apoio frontal logo abaixo dos ossos do quadril e tornozelos travados.",
      "Cruze os braços no peito e flexione o tronco para a frente descendo controladamente.",
      "Suba usando a força dos eretores da espinha e glúteos até alinhar o corpo com as pernas.",
      "Não faça hiperextensão excessiva além da linha neutra."
    ],
    tips: [
      "Pode ser feito segurando uma anilha no peito para sobrecarga progressiva.",
      "Fundamental para a saúde da coluna e estabilidade no agachamento e terra."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_shrug",
    name: "Encolhimento de Trapézio na Polia Baixa",
    bodyPart: "back",
    target: "Trapézio Superior",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Encolhimento_de_Trap_zio_na_Polia_Baixa/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Encolhimento_de_Trap_zio_na_Polia_Baixa/1.jpg",
    ],
    instructions: [
      "Segure uma barra reta conectada à polia baixa com pegada na largura dos ombros.",
      "Fique em pé ereto e eleve os ombros diretamente em direção às orelhas.",
      "Segure a contração no topo por 2 segundos e desça sentindo o alongamento do trapézio."
    ],
    tips: [
      "A linha de tração do cabo oferece resistência diagonal contínua que ativa o trapézio melhor que halteres livres.",
      "Nunca rode os ombros em círculos; o movimento deve ser estritamente vertical."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_behind_back_smith_shrug",
    name: "Encolhimento no Smith Machine por Trás (Haney Shrug)",
    bodyPart: "back",
    target: "Trapézio Superior & Médio",
    equipment: "smith machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Encolhimento_no_Smith_Machine_por_Tr_s/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Encolhimento_no_Smith_Machine_por_Tr_s/1.jpg",
    ],
    instructions: [
      "Fique em pé de costas para a barra do Smith Machine e segure-a por trás com pegada pronada.",
      "Destrave a barra e eleve os ombros para cima e levemente para trás.",
      "Aperte o topo do trapézio por 1 a 2 segundos e desça suavemente."
    ],
    tips: [
      "Popularizado pelo 8x Mr. Olympia Lee Haney para criar volume espesso no trapézio superior.",
      "Evita que os halteres batam nas coxas durante a execução."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_seated_cable_row_wide",
    name: "Remada Baixa na Polia com Barra Reta Aberta",
    bodyPart: "back",
    target: "Trapézio Médio, Romboides e Deltoide Posterior",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Baixa_na_Polia_com_Barra_Reta_Aberta/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Baixa_na_Polia_com_Barra_Reta_Aberta/1.jpg",
    ],
    instructions: [
      "Conecte uma barra reta longa na polia baixa da remada sentada.",
      "Segure a barra com pegada pronada aberta e sente-se com coluna ereta.",
      "Puxe a barra em direção ao abdômen superior/esterno com os cotovelos altos e abertos.",
      "Aperte as escápulas juntas e retorne controladamente."
    ],
    tips: [
      "Enfatiza a espessura da parte superior e média das costas ao invés do latíssimo inferior.",
      "Mantenha o peito aberto e não curve a coluna."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_incline_lateral_raise",
    name: "Elevação Lateral no Banco Inclinado (45°)",
    bodyPart: "shoulders",
    target: "Deltoide Lateral (Pico de Tensão Inicial)",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Eleva__o_Lateral_no_Banco_Inclinado/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Eleva__o_Lateral_no_Banco_Inclinado/1.jpg",
    ],
    instructions: [
      "Deite de lado em um banco inclinado a 45°-60° segurando um halter com o braço de cima.",
      "Eleve o halter lateralmente até a linha do ombro mantendo o cotovelo levemente destravado.",
      "Desça devagar controlando a descida até quase encostar no quadril."
    ],
    tips: [
      "Altera o perfil de resistência colocando maior tensão no início do movimento onde o músculo está alongado.",
      "Execute de forma unilateral alternando os lados com precisão."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_cable_y_raise",
    name: "Elevação Y-Raise na Polia Dupla",
    bodyPart: "shoulders",
    target: "Deltoide Lateral, Deltoide Posterior e Trapézio Inferior",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Eleva__o_Y_Raise_na_Polia_Dupla/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Eleva__o_Y_Raise_na_Polia_Dupla/1.jpg",
    ],
    instructions: [
      "Ajuste as polias na altura do joelho ou quadril sem nenhum acessório (segurando a ponta do cabo).",
      "Cruze os cabos segurando o cabo esquerdo com a mão direita e vice-versa.",
      "Eleve os braços em diagonal para cima formando a letra 'Y' com o corpo.",
      "Segure 1 segundo no topo e retorne devagar."
    ],
    tips: [
      "Segue o plano anatômico da escápula (scaption) com risco articular mínimo.",
      "Gera uma ativação 3D formidável nos deltoides sem impactar o manguito rotador."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_egyptian_cable_lateral_raise",
    name: "Elevação Lateral Egípcia na Polia",
    bodyPart: "shoulders",
    target: "Deltoide Lateral (Tensão Contínua)",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Eleva__o_Lateral_Eg_pcia_na_Polia/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Eleva__o_Lateral_Eg_pcia_na_Polia/1.jpg",
    ],
    instructions: [
      "Posicione a polia baixa, segure a coluna do equipamento com a mão de apoio e incline o corpo a 30° para fora.",
      "Com o braço livre segurando a manilha, eleve o cabo lateralmente até a altura do ombro.",
      "Desça lentamente resistindo à tração constante do cabo."
    ],
    tips: [
      "A inclinação do corpo aumenta a amplitude útil de movimento sob sobrecarga.",
      "Mantenha o punho neutro sem girar o halter para trás."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_seated_z_press",
    name: "Desenvolvimento Z-Press no Solo com Halteres",
    bodyPart: "shoulders",
    target: "Deltoide Anterior, Lateral & Core Profundo",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Desenvolvimento_Z_Press_no_Solo_com_Halteres/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Desenvolvimento_Z_Press_no_Solo_com_Halteres/1.jpg",
    ],
    instructions: [
      "Sente-se no solo com as pernas estendidas à frente em formato de 'V' e tronco totalmente ereto sem encosto.",
      "Posicione os halteres na altura dos ombros.",
      "Empurre os halteres para cima acima da cabeça travando o core e a coluna ereta.",
      "Desça controladamente até a linha do queixo."
    ],
    tips: [
      "Exige flexibilidade dos isquiotibiais e estabilidade brutal do core.",
      "Não permite nenhum tipo de impulso com pernas ou inclinação lombar."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_single_arm_machine_press",
    name: "Desenvolvimento Unilateral na Máquina Articulada",
    bodyPart: "shoulders",
    target: "Deltoide Anterior & Médio",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Desenvolvimento_Unilateral_na_M_quina_Articulada/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Desenvolvimento_Unilateral_na_M_quina_Articulada/1.jpg",
    ],
    instructions: [
      "Sente-se na máquina de desenvolvimento e segure apenas uma das manoplas com uma mão.",
      "Empurre a carga para cima até a extensão controlada do braço.",
      "Desça sentindo a desaceleração muscular até a linha da orelha antes de empurrar novamente."
    ],
    tips: [
      "Permite foco absoluto em cada ombro individualmente corrigindo desbalanços de força.",
      "Apoie a mão livre no joelho ou assento para estabilizar o tronco."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_kneeling_face_pull",
    name: "Face Pull Ajoelhado na Polia com Corda",
    bodyPart: "shoulders",
    target: "Deltoide Posterior, Manguito Rotador & Romboides",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull_Ajoelhado_na_Polia_com_Corda/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull_Ajoelhado_na_Polia_com_Corda/1.jpg",
    ],
    instructions: [
      "Prenda a corda na polia alta e ajoelhe-se no solo com um ou ambos os joelhos apoiados.",
      "Segure as pontas da corda com pegada neutra e puxe em direção ao rosto, abrindo as mãos e rodando os ombros para fora.",
      "Os cotovelos devem terminar altos e alinhados com as orelhas.",
      "Segure 2 segundos no pico e retorne devagar."
    ],
    tips: [
      "Ajoelhar elimina o embalo do quadril e estabiliza o tronco.",
      "Exercício indispensável para a saúde e longevidade da articulação do ombro."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cross_body_rear_delt_fly",
    name: "Crucifixo Inverso em X na Polia Dupla (Cross-Body)",
    bodyPart: "shoulders",
    target: "Deltoide Posterior (Isolamento Máximo)",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crucifixo_Inverso_em_X_na_Polia_Dupla/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crucifixo_Inverso_em_X_na_Polia_Dupla/1.jpg",
    ],
    instructions: [
      "Ajuste as duas roldanas na altura dos olhos sem pegadores.",
      "Segure o cabo esquerdo com a mão direita e o direito com a mão esquerda com os braços cruzados na frente do rosto.",
      "Puxe os braços para fora e para trás abrindo em movimento de cruz até ultrapassarem a linha do tronco.",
      "Retorne controlando a fase excêntrica."
    ],
    tips: [
      "Alinha perfeitamente a linha de tração do cabo com as fibras do deltoide posterior.",
      "Mantenha os cotovelos travados em leve flexão."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_prone_incline_rear_delt_fly",
    name: "Crucifixo Inverso no Banco Inclinado com Halteres",
    bodyPart: "shoulders",
    target: "Deltoide Posterior & Trapézio Médio",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crucifixo_Inverso_no_Banco_Inclinado_com_Halteres/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crucifixo_Inverso_no_Banco_Inclinado_com_Halteres/1.jpg",
    ],
    instructions: [
      "Deite de bruços com o peito apoiado em um banco inclinado a 30° segurando dois halteres leves.",
      "Eleve os halteres lateralmente e para trás liderando pelos cotovelos e mindinhos.",
      "Aperte o deltoide posterior no topo sem forçar os romboides em excesso.",
      "Desça lentamente até os braços ficarem pendurados."
    ],
    tips: [
      "O apoio no banco impede impulsos e balanços de corpo.",
      "Use halteres moderados para manter a pureza técnica."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_external_rotator_cuff",
    name: "Manguito Rotador Externo na Polia (Rotação Externa)",
    bodyPart: "shoulders",
    target: "Infraespinhal, Redondo Menor & Manguito",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Manguito_Rotador_Externo_na_Polia/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Manguito_Rotador_Externo_na_Polia/1.jpg",
    ],
    instructions: [
      "Ajuste a polia na altura do cotovelo e fique de lado para a torre.",
      "Mantenha o cotovelo flexionado a 90° colado na cintura (pode usar uma toalha enrolada sob o braço).",
      "Gire o antebraço para fora afastando a mão da barriga em arco.",
      "Segure 1 segundo e retorne com calma."
    ],
    tips: [
      "Use cargas bem leves; o objetivo é fortalecimento e prevenção de lesões articulares.",
      "Não afaste o cotovelo do tronco durante o movimento."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_internal_rotator_cuff",
    name: "Manguito Rotador Interno na Polia (Rotação Interna)",
    bodyPart: "shoulders",
    target: "Subescapular & Estabilizadores do Ombro",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Manguito_Rotador_Interno_na_Polia/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Manguito_Rotador_Interno_na_Polia/1.jpg",
    ],
    instructions: [
      "Ajuste a polia na altura do cotovelo e fique posicionado com o braço de trabalho próximo à torre.",
      "Com o cotovelo a 90° colado ao tronco, puxe a manilha para dentro em direção ao abdômen.",
      "Retorne controlando a rotação externa."
    ],
    tips: [
      "Execução lenta e contínua com carga leve.",
      "Complementa a rotação externa para equilíbrio do complexo articular do ombro."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_rope_upright_row",
    name: "Remada Alta na Polia com Corda",
    bodyPart: "shoulders",
    target: "Deltoide Lateral & Trapézio Superior",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Alta_na_Polia_com_Corda/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Remada_Alta_na_Polia_com_Corda/1.jpg",
    ],
    instructions: [
      "Prenda a corda na polia baixa e segure as extremidades com pegada pronada.",
      "Fique em pé ereto e puxe a corda para cima até a altura do peito, abrindo as pontas da corda para fora.",
      "Os cotovelos devem liderar o movimento ficando sempre acima das mãos.",
      "Desça devagar controlando a descida."
    ],
    tips: [
      "A corda permite que os punhos se afastem naturalmente, eliminando o impacto no punho e ombro comum com barras retas.",
      "Não puxe acima da linha dos ombros para preservar a articulação acromioclavicular."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_bayesian_cable_curl",
    name: "Rosca Bayesiana na Polia por Trás do Corpo",
    bodyPart: "upper arms",
    target: "Bíceps Braquial (Cabeça Longa & Pico de Alongamento)",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Bayesiana_na_Polia_por_Tr_s_do_Corpo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Bayesiana_na_Polia_por_Tr_s_do_Corpo/1.jpg",
    ],
    instructions: [
      "Ajuste a polia baixa, segure a manilha e dê dois passos para a frente de costas para a torre.",
      "O braço deve começar estendido para trás do tronco em alongamento pronunciado.",
      "Flexione o cotovelo trazendo a mão para a frente sem mover o ombro excessivamente.",
      "Aperte o bíceps no pico de contração e retorne devagar ao alongamento profundo."
    ],
    tips: [
      "Maximiza a hipertrofia mediada pelo alongamento sob tensão contínua.",
      "Incline o tronco levemente para a frente para estabilidade."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_incline_hammer_curl",
    name: "Rosca Martelo no Banco Inclinado 45°",
    bodyPart: "upper arms",
    target: "Braquial, Braquiorradial & Bíceps Cabeça Longa",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Martelo_no_Banco_Inclinado_45_/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Martelo_no_Banco_Inclinado_45_/1.jpg",
    ],
    instructions: [
      "Sente-se em um banco inclinado a 45°-60° com as costas apoiadas e braços pendurados com halteres.",
      "Mantenha a pegada neutra (palmas voltadas uma para a outra).",
      "Flexione os cotovelos elevando os halteres em padrão martelo sem girar os punhos.",
      "Aperte os braquiais no topo e desça controladamente."
    ],
    tips: [
      "O banco inclinado alonga a cabeça longa enquanto a pegada neutra recruta o músculo braquial com potência.",
      "Dá volume e espessura ao braço visto de frente."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cross_body_hammer_curl",
    name: "Rosca Martelo Cruzada no Peito (Pinwheel Curl)",
    bodyPart: "upper arms",
    target: "Braquial & Braquiorradial (Antebraço)",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Martelo_Cruzada_no_Peito/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Martelo_Cruzada_no_Peito/1.jpg",
    ],
    instructions: [
      "Fique em pé ereto segurando dois halteres ao lado do corpo.",
      "Flexione um dos braços trazendo o halter em diagonal cruzando o peito em direção ao ombro oposto.",
      "Segure a contração por 1 segundo no pico e desça devagar antes de alternar o braço."
    ],
    tips: [
      "O trajeto em diagonal recruta maciçamente o braquial (músculo que empurra o bíceps para cima).",
      "Excelente para construir braços densos e antebraços fortes."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_single_arm_preacher_db_curl",
    name: "Rosca Scott Unilateral com Halter",
    bodyPart: "upper arms",
    target: "Bíceps Braquial (Cabeça Curva / Encurtamento)",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Scott_Unilateral_com_Halter/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Scott_Unilateral_com_Halter/1.jpg",
    ],
    instructions: [
      "Apoie a axila e a parte posterior do braço no banco Scott segurando um halter com a palma para cima.",
      "Flexione o antebraço subindo o halter até a contração máxima do bíceps.",
      "Desça controladamente até estender quase completamente o braço (sem hiperestender a articulação)."
    ],
    tips: [
      "Apoio rígido elimina qualquer tipo de compensação do tronco ou deltoide anterior.",
      "Trabalha cada braço individualmente com isolamento clínico."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_rope_curl",
    name: "Rosca na Polia Baixa com Corda",
    bodyPart: "upper arms",
    target: "Braquial, Braquiorradial & Bíceps",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_na_Polia_Baixa_com_Corda/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_na_Polia_Baixa_com_Corda/1.jpg",
    ],
    instructions: [
      "Prenda a corda na polia baixa e fique em pé ereto.",
      "Segure as extremidades da corda com pegada neutra e cotovelos colados ao corpo.",
      "Puxe flexionando os cotovelos e abra as pontas da corda para fora no final do movimento.",
      "Desça resistindo à tração do cabo."
    ],
    tips: [
      "A abertura da corda no topo adiciona um componente de supinação para recrutar tanto o bíceps quanto o braquial.",
      "Mantenha os cotovelos apontando fixamente para o chão."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_zottman_curl",
    name: "Rosca Zottman com Halteres",
    bodyPart: "upper arms",
    target: "Bíceps Braquial (Subida) & Braquiorradial/Antebraço (Descida)",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Zottman_com_Halteres/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Zottman_com_Halteres/1.jpg",
    ],
    instructions: [
      "Fique em pé segurando halteres ao lado do corpo.",
      "Suba os halteres supinando as mãos (palmas para cima) como uma rosca clássica.",
      "No topo da contração, gire os punhos 180° deixando as palmas voltadas para baixo (pegada pronada).",
      "Desça lentamente na pegada pronada resistindo à gravidade até estender os braços, girando novamente para cima para a próxima repetição."
    ],
    tips: [
      "Combina a força concêntrica do bíceps com a sobrecarga excêntrica no antebraço.",
      "Exercício 2 em 1 altamente eficiente para hipertrofia completa de braço."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_high_cable_overhead_curl",
    name: "Rosca Duplo Bíceps no Crossover Alto",
    bodyPart: "upper arms",
    target: "Bíceps Braquial (Pico de Contração Máxima)",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Duplo_B_ceps_no_Crossover_Alto/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Duplo_B_ceps_no_Crossover_Alto/1.jpg",
    ],
    instructions: [
      "Fique em pé no centro do crossover com as duas polias altas com manoplas individuais.",
      "Com braços abertos na altura dos ombros, flexione os cotovelos trazendo as mãos em direção à cabeça como na pose de duplo bíceps.",
      "Aperte o bíceps no ponto de pico por 2 segundos e retorne devagar sem baixar os braços."
    ],
    tips: [
      "Isolamento espetacular da cabeça curta do bíceps com zero estresse lombar.",
      "Mantenha a linha dos braços paralela ao chão do início ao fim."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_reverse_cable_curl",
    name: "Rosca Inversa na Polia com Barra Reta",
    bodyPart: "lower arms",
    target: "Braquiorradial & Extensores do Antebraço",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Inversa_na_Polia_com_Barra_Reta/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rosca_Inversa_na_Polia_com_Barra_Reta/1.jpg",
    ],
    instructions: [
      "Conecte a barra reta na polia baixa e segure com pegada pronada (dorso das mãos para cima).",
      "Fique em pé e flexione os cotovelos trazendo a barra até a altura do peito.",
      "Aperte a musculatura do antebraço e desça devagar."
    ],
    tips: [
      "A tensão contínua do cabo mantém o braquiorradial ativado durante todo o curso.",
      "Mantenha os punhos firmes e retos sem deixá-los dobrar para baixo."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_wrist_extension_barbell",
    name: "Extensão de Punho com Barra (Rosca Punho Inversa)",
    bodyPart: "lower arms",
    target: "Extensores do Antebraço & Punho",
    equipment: "barbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Extens_o_de_Punho_com_Barra/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Extens_o_de_Punho_com_Barra/1.jpg",
    ],
    instructions: [
      "Apoie os antebraços sobre as coxas ou em um banco com as palmas voltadas para baixo e mãos penduradas na borda.",
      "Segure uma barra leve e eleve as mãos para cima estendendo os punhos.",
      "Segure 1 segundo no topo e desça controladamente."
    ],
    tips: [
      "Use cargas leves e foque na amplitude articular do punho.",
      "Essencial para prevenir dores e epicondilite lateral (cotovelo de tenista)."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_wrist_curl_dumbbell",
    name: "Flexão de Punho com Halteres (Rosca Punho)",
    bodyPart: "lower arms",
    target: "Flexores do Antebraço & Força de Preensão",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flex_o_de_Punho_com_Halteres/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flex_o_de_Punho_com_Halteres/1.jpg",
    ],
    instructions: [
      "Apoie os antebraços sobre as coxas com as palmas das mãos voltadas para cima.",
      "Deixe os halteres rolarem suavemente até a ponta dos dedos e depois feche a mão flexionando os punhos para cima.",
      "Aperte o antebraço no topo e repita com calma."
    ],
    tips: [
      "Gera densidade muscular notável na parte interna do antebraço.",
      "Controle a descida para proteger a articulação dos punhos."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_farmers_walk_db",
    name: "Caminhada do Fazendeiro com Halteres (Farmer's Walk)",
    bodyPart: "lower arms",
    target: "Antebraço, Pegada, Trapézio & Core",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Caminhada_do_Fazendeiro_com_Halteres/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Caminhada_do_Fazendeiro_com_Halteres/1.jpg",
    ],
    instructions: [
      "Segure dois halteres pesados ao lado do corpo com postura ereta e peito estufado.",
      "Caminhe em linha reta com passos curtos e controlados por 30 a 60 segundos.",
      "Mantenha os ombros travados para trás e o abdômen contraído."
    ],
    tips: [
      "Um dos melhores exercícios do mundo para força de pegada, trapézio e resistência corporal geral.",
      "Não deixe os halteres balançarem nas pernas."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_katana_triceps_extension",
    name: "Tríceps Katana na Polia Cruzada",
    bodyPart: "upper arms",
    target: "Tríceps Braquial (Cabeça Longa & Lateral)",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_Katana_na_Polia_Cruzada/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_Katana_na_Polia_Cruzada/1.jpg",
    ],
    instructions: [
      "Ajuste as duas roldanas na altura dos ombros sem pegadores (segure a borracha do cabo).",
      "Fique de costas para a torre e cruze as mãos atrás da cabeça segurando os cabos opostos.",
      "Estenda os dois braços simultaneamente para cima e para fora em diagonal (como sacar duas espadas katana).",
      "Segure 1 segundo no topo e retorne devagar atrás da nuca."
    ],
    tips: [
      "O ângulo dos cabos se alinha perfeitamente com a mecânica muscular do tríceps.",
      "Tensão contínua do início ao fim sem nenhum ponto morto."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_cross_body_cable_triceps",
    name: "Tríceps Unilateral Cruzado na Polia (Cross-Body Extension)",
    bodyPart: "upper arms",
    target: "Tríceps Braquial (Cabeça Lateral & Medial)",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_Unilateral_Cruzado_na_Polia/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_Unilateral_Cruzado_na_Polia/1.jpg",
    ],
    instructions: [
      "Fique de lado para a polia alta segurando o cabo sem acessório com a mão oposta.",
      "Mantenha o braço cruzado na frente do corpo e estenda o cotovelo para baixo e para fora em diagonal.",
      "Aperte o tríceps no final da extensão e retorne controlando."
    ],
    tips: [
      "Elimina a compensação do ombro e permite amplitude articular livre e anatômica.",
      "Excelente para quem sente estalos no cotovelo na extensão tradicional."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_tate_press_dumbbell",
    name: "Tríceps Tate Press com Halteres no Banco",
    bodyPart: "upper arms",
    target: "Tríceps Braquial (Cabeça Medial & Força de Bloqueio)",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_Tate_Press_com_Halteres_no_Banco/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_Tate_Press_com_Halteres_no_Banco/1.jpg",
    ],
    instructions: [
      "Deite em um banco reto segurando dois halteres com os braços estendidos acima do peito (palmas para os pés).",
      "Flexione os cotovelos para fora apontando os halteres para dentro até tocarem suavemente o esterno.",
      "Empurre os halteres para cima e para fora usando exclusivamente a força dos tríceps."
    ],
    tips: [
      "Criado pelo powerlifter Dave Tate para construir tríceps densos e fortes no supino.",
      "Mantenha os cotovelos apontando lateralmente."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_assisted_dip_machine",
    name: "Tríceps nas Paralelas com Assistência (Graviton)",
    bodyPart: "upper arms",
    target: "Tríceps Braquial & Peitoral Inferior",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_nas_Paralelas_com_Assist_ncia/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_nas_Paralelas_com_Assist_ncia/1.jpg",
    ],
    instructions: [
      "Selecione a carga de contrapeso no Graviton e apoie os joelhos na plataforma móvel.",
      "Segure as barras paralelas com pegada neutra e tronco ereto.",
      "Desça o corpo até os cotovelos dobrarem a 90° mantendo-os colados ao tronco.",
      "Empurre com força estendendo os braços até o topo."
    ],
    tips: [
      "Quanto mais peso colocar na máquina, mais fácil fica o exercício (ideal para iniciantes e intermediários progredirem até as paralelas livres).",
      "Mantenha o tronco reto para focar 100% no tríceps."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_single_arm_cable_pushdown",
    name: "Tríceps Pulley Unilateral com Pegada Supinada (Reverse Pushdown)",
    bodyPart: "upper arms",
    target: "Tríceps Braquial (Cabeça Medial)",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_Pulley_Unilateral_com_Pegada_Supinada/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_Pulley_Unilateral_com_Pegada_Supinada/1.jpg",
    ],
    instructions: [
      "Prenda uma manilha individual na polia alta e segure com a palma da mão voltada para cima (pegada supinada).",
      "Com o cotovelo travado ao lado do corpo, empurre a manilha para baixo até a extensão completa do braço.",
      "Aperte o tríceps no fundo e retorne controlando a subida até 90°."
    ],
    tips: [
      "A pegada supinada ativa a cabeça medial do tríceps com grande precisão.",
      "Trabalhe com cargas moderadas focando na pureza do movimento."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_jm_press_smith",
    name: "Tríceps JM Press no Smith Machine",
    bodyPart: "upper arms",
    target: "Tríceps Braquial (Massa & Força Extrema)",
    equipment: "smith machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_JM_Press_no_Smith_Machine/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_JM_Press_no_Smith_Machine/1.jpg",
    ],
    instructions: [
      "Deite no banco reto sob a barra do Smith com pegada na largura dos ombros.",
      "Desça a barra trazendo-a em direção à garganta/queixo enquanto dobra os cotovelos a 45°.",
      "Pare a 2 cm do queixo e empurre com força explosiva estendendo os tríceps."
    ],
    tips: [
      "Combinação híbrida entre supino fechado e tríceps testa.",
      "Permite aplicar altas sobrecargas com segurança mecânica guiada."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_french_press_standing_db",
    name: "Tríceps Francês Unilateral em Pé com Halter",
    bodyPart: "upper arms",
    target: "Tríceps Braquial (Cabeça Longa)",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_Franc_s_Unilateral_em_P__com_Halter/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tr_ceps_Franc_s_Unilateral_em_P__com_Halter/1.jpg",
    ],
    instructions: [
      "Fique em pé ereto segurando um halter com uma mão acima da cabeça.",
      "Flexione o cotovelo descendo o halter atrás da nuca mantendo o braço na vertical.",
      "Estenda o braço de volta para cima contraindo o tríceps no topo."
    ],
    tips: [
      "Pode apoiar a mão oposta no cotovelo ativo para estabilizar a articulação.",
      "Excelente para corrigir assimetrias de tríceps."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_smith_bulgarian_split_squat",
    name: "Agachamento Búlgaro no Smith Machine",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteo Máximo & Estabilidade Unilateral",
    equipment: "smith machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Agachamento_B_lgaro_no_Smith_Machine/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Agachamento_B_lgaro_no_Smith_Machine/1.jpg",
    ],
    instructions: [
      "Posicione um banco atrás da barra do Smith e apoie o peito do pé de trás no banco.",
      "Posicione a perna da frente um passo largo à frente e destrave a barra sobre os trapézios.",
      "Desça em linha vertical até que a coxa da frente fique paralela ao chão.",
      "Empurre pelo calcanhar dianteiro retornando ao topo."
    ],
    tips: [
      "O trilho do Smith elimina o balanço de equilíbrio permitindo aplicar alta sobrecarga unilateral.",
      "Mantenha o joelho dianteiro alinhado com a ponta do pé."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_zercher_squat",
    name: "Agachamento Zercher com Barra",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteos, Core & Trapézio",
    equipment: "barbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Agachamento_Zercher_com_Barra/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Agachamento_Zercher_com_Barra/1.jpg",
    ],
    instructions: [
      "Apoie a barra na dobra dos cotovelos (com braços cruzados ou mãos unidas contra o peito).",
      "Mantenha os pés na largura dos ombros e peito aberto.",
      "Agache profundamente até os cotovelos entrarem entre os joelhos.",
      "Empurre pelo chão com tronco totalmente ereto."
    ],
    tips: [
      "O centro de gravidade frontal força o tronco a permanecer ereto diminuindo a alavanca de cisalhamento na lombar.",
      "Use uma almofada ou toalha na barra para proteger os cotovelos."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_pistol_squat",
    name: "Agachamento Pistol Unilateral no Solo",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteos, Equilíbrio & Força Pura",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Agachamento_Pistol_Unilateral_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Agachamento_Pistol_Unilateral_no_Solo/1.jpg",
    ],
    instructions: [
      "Fique em pé sobre uma perna e estenda a outra perna totalmente para a frente.",
      "Agache com a perna de apoio até a flexão máxima enquanto a perna livre permanece suspensa sem tocar o chão.",
      "Empurre pelo calcanhar e volte à posição ereta."
    ],
    tips: [
      "Um dos testes máximos de força funcional, mobilidade de tornozelo e controle corporal.",
      "Pode ser treinado segurando em um suporte ou fita TRX para progressão."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_cossack_squat",
    name: "Agachamento Cossaco / Lateral no Solo",
    bodyPart: "upper legs",
    target: "Quadríceps, Adutores & Mobilidade do Quadril",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Agachamento_Cossaco___Lateral_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Agachamento_Cossaco___Lateral_no_Solo/1.jpg",
    ],
    instructions: [
      "Afaste as pernas bem além da largura dos ombros com pontas dos pés para fora.",
      "Transfira o peso para um lado agachando profundamente sobre essa perna enquanto a perna oposta fica estendida com os dedos apontando para cima.",
      "Empurre de volta ao centro e repita para o outro lado."
    ],
    tips: [
      "Desenvolve incrível flexibilidade nos adutores e mobilidade de quadril.",
      "Pode ser feito segurando um kettlebell no peito."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_adductor_machine",
    name: "Cadeira Adutora na Máquina",
    bodyPart: "upper legs",
    target: "Adutores da Coxa (Grácil, Pectíneo e Adutores)",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cadeira_Adutora_na_M_quina/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cadeira_Adutora_na_M_quina/1.jpg",
    ],
    instructions: [
      "Sente-se na máquina com as costas apoiadas e joelhos posicionados na parte interna das almofadas.",
      "Feche as pernas aproximando os joelhos contra a resistência da máquina.",
      "Segure a contração por 2 segundos no ponto de contato e abra lentamente sentindo o alongamento da virilha."
    ],
    tips: [
      "Essencial para estabilização da pelve e espessura da parte interna das coxas.",
      "Evite soltar o peso com impacto na abertura."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_narrow_leg_press_45",
    name: "Leg Press 45° com Pés Fechados",
    bodyPart: "upper legs",
    target: "Quadríceps (Foco Vasto Lateral & Varredura Externa)",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press_45__com_P_s_Fechados/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press_45__com_P_s_Fechados/1.jpg",
    ],
    instructions: [
      "Posicione os pés no centro da plataforma com espaçamento fechado (4 a 6 dedos de distância) e pontas retas.",
      "Destrave e desça a plataforma até 90° nos joelhos sem arredondar a lombar do assento.",
      "Empurre a plataforma pelos pés até a extensão quase completa."
    ],
    tips: [
      "A base estreita e baixa na plataforma aumenta o braço de momento no joelho focando nos vastos do quadríceps.",
      "Não deixe a lombar descolar do encosto."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_single_leg_press_45",
    name: "Leg Press 45° Unilateral",
    bodyPart: "upper legs",
    target: "Quadríceps & Glúteo (Correção de Assimetrias)",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press_45__Unilateral/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press_45__Unilateral/1.jpg",
    ],
    instructions: [
      "Posicione um pé no centro da plataforma do Leg Press e mantenha a outra perna fora do apoio.",
      "Desça a plataforma controlando o peso com a perna ativa até 90°.",
      "Empurre de volta com força focando no quadríceps e glúteo."
    ],
    tips: [
      "Garante trabalho simétrico em ambas as pernas prevenindo compensações comuns no leg press bilateral.",
      "Comece com a perna mais fraca para calibrar a carga."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_single_leg_extension",
    name: "Cadeira Extensora Unilateral",
    bodyPart: "upper legs",
    target: "Quadríceps (Isolamento Fino & Reto Femoral)",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cadeira_Extensora_Unilateral/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cadeira_Extensora_Unilateral/1.jpg",
    ],
    instructions: [
      "Sente-se na cadeira extensora e posicione o rolo acima do tornozelo de uma das pernas.",
      "Estenda o joelho elevando a carga até a extensão completa da perna.",
      "Segure 2 segundos no topo contraindo o quadríceps ao máximo e desça devagar."
    ],
    tips: [
      "Perfeito para reabilitação do joelho e hipertrofia cirúrgica do quadríceps.",
      "Mantenha o quadril firme no assento segurando as manoplas laterais."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_landmine_squat",
    name: "Agachamento no Landmine com Barra",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteos & Core",
    equipment: "barbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Agachamento_no_Landmine_com_Barra/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Agachamento_no_Landmine_com_Barra/1.jpg",
    ],
    instructions: [
      "Segure a ponta da barra Landmine com as duas mãos contra o peito.",
      "Fique em pé com pés na largura dos ombros e incline o tronco ligeiramente contra a barra.",
      "Agache profundamente mantendo o peito apoiado na barra.",
      "Empurre pelo solo retornando à posição inicial."
    ],
    tips: [
      "A trajetória em arco da barra Landmine guia o corpo em um padrão de agachamento extremamente natural e ergonômico.",
      "Excelente para quem tem dores na lombar com agachamento livre convencional."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_smith_reverse_lunge",
    name: "Afundo Reverso no Smith Machine",
    bodyPart: "upper legs",
    target: "Quadríceps, Glúteo Máximo & Isquiotibiais",
    equipment: "smith machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Afundo_Reverso_no_Smith_Machine/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Afundo_Reverso_no_Smith_Machine/1.jpg",
    ],
    instructions: [
      "Apoie a barra do Smith sobre os ombros e fique em pé com pés alinhados.",
      "Dê um passo para trás com uma das pernas e desça o joelho traseiro até 2 cm do chão.",
      "Empurre pela perna dianteira trazendo o pé traseiro de volta à posição inicial.",
      "Alterne as pernas ou complete todas as repetições de um lado."
    ],
    tips: [
      "O passo para trás reduz a pressão patelar no joelho em comparação com o avanço frontal.",
      "O Smith garante estabilidade lateral perfeita."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_dumbbell_step_ups",
    name: "Step-up no Banco / Caixa com Halteres",
    bodyPart: "upper legs",
    target: "Glúteos, Quadríceps & Isquiotibiais",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Step_up_no_Banco___Caixa_com_Halteres/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Step_up_no_Banco___Caixa_com_Halteres/1.jpg",
    ],
    instructions: [
      "Fique em frente a um banco ou caixa resistente segurando dois halteres ao lado do corpo.",
      "Apoie toda a sola de um pé sobre o banco.",
      "Suba empurrando exclusivamente pela perna de cima sem dar impulso com a perna de baixo.",
      "Desça lentamente controlando a fase excêntrica."
    ],
    tips: [
      "A altura ideal da caixa/banco é na linha do joelho ou ligeiramente acima.",
      "Não use o pé de baixo para saltar; force a coxa e glúteo da perna de cima."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_side_lunge_dumbbell",
    name: "Afundo Lateral com Halter",
    bodyPart: "upper legs",
    target: "Quadríceps, Adutores & Glúteo Médio",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Afundo_Lateral_com_Halter/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Afundo_Lateral_com_Halter/1.jpg",
    ],
    instructions: [
      "Fique em pé com pés juntos segurando um halter no peito em estilo taça.",
      "Dê um passo largo para o lado e agache flexionando o joelho dessa perna enquanto a outra permanece estendida.",
      "Empurre com força pela perna flexionada voltando à posição inicial."
    ],
    tips: [
      "Trabalha o plano frontal que é frequentemente negligenciado na musculação.",
      "Excelente para atletas e prevenção de lesões esportivas."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_nordic_hamstring_curl",
    name: "Flexão Nórdica no Solo / Suporte (Nordic Curl)",
    bodyPart: "upper legs",
    target: "Isquiotibiais (Força Excêntrica Pura & Bíceps Femoral)",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flex_o_N_rdica_no_Solo___Suporte/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flex_o_N_rdica_no_Solo___Suporte/1.jpg",
    ],
    instructions: [
      "Ajoelhe-se em um acolchoado com os tornozelos travados por um parceiro ou sob um suporte pesado.",
      "Mantenha o corpo reto do joelho à cabeça com glúteos e abdômen contraídos.",
      "Incline o corpo para a frente o mais lentamente possível resistindo à gravidade com os isquiotibiais.",
      "Apoie as mãos no chão no final e empurre suavemente para voltar à posição vertical."
    ],
    tips: [
      "Padrão ouro científico para prevenção de estiramentos e lesões de posterior de coxa.",
      "Foque na descida ultra controlada de 3 a 5 segundos."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_single_leg_rdl",
    name: "Stiff Unilateral com Halter / Apoio (Single-Leg RDL)",
    bodyPart: "upper legs",
    target: "Isquiotibiais, Glúteo Máximo & Médio",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Stiff_Unilateral_com_Halter___Apoio/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Stiff_Unilateral_com_Halter___Apoio/1.jpg",
    ],
    instructions: [
      "Fique sobre uma perna segurando um halter na mão oposta (pode apoiar a mão livre na parede para equilíbrio).",
      "Empurre o quadril para trás enquanto desce o tronco e eleva a perna de trás em linha reta com o corpo.",
      "Desça até sentir forte alongamento no posterior da perna de apoio.",
      "Volte acionando o glúteo e posterior."
    ],
    tips: [
      "O apoio leve da mão livre remove o fator equilíbrio e permite aplicar carga real no músculo alvo.",
      "Mantenha a coluna perfeitamente neutra."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_single_leg_hip_thrust",
    name: "Elevação Pélvica Unilateral no Banco",
    bodyPart: "upper legs",
    target: "Glúteo Máximo & Isquiotibiais",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Eleva__o_P_lvica_Unilateral_no_Banco/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Eleva__o_P_lvica_Unilateral_no_Banco/1.jpg",
    ],
    instructions: [
      "Apoie as escápulas na borda de um banco com uma perna flexionada e pé no chão e a outra perna suspensa a 90°.",
      "Desça o quadril em direção ao chão e empurre com força pelo calcanhar de apoio até o alinhamento da pelve com o tronco.",
      "Aperte o glúteo no topo por 2 segundos antes de descer."
    ],
    tips: [
      "Elimina desequilíbrios de ativação entre os glúteos direito e esquerdo.",
      "Pode ser feito com um halter ou anilha apoiada sobre a pelve para maior intensidade."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_straight_leg_cable_kickback",
    name: "Glúteo Coice na Polia com Perna Estendida",
    bodyPart: "upper legs",
    target: "Glúteo Máximo (Fibras Superiores)",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Gl_teo_Coice_na_Polia_com_Perna_Estendida/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Gl_teo_Coice_na_Polia_com_Perna_Estendida/1.jpg",
    ],
    instructions: [
      "Prenda a tornozeleira na polia baixa e incline o tronco a 45° segurando o suporte da máquina.",
      "Com a perna ativa quase totalmente estendida, chute para trás e ligeiramente para fora em 30°.",
      "Segure o aperto máximo no glúteo por 2 segundos no topo e retorne controladamente."
    ],
    tips: [
      "A perna estendida minimiza a ajuda dos isquiotibiais isolando o glúteo máximo.",
      "Não hiperestenda a coluna lombar; o movimento deve acontecer estritamente na articulação do quadril."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_forward_leaning_abductor",
    name: "Cadeira Abdutora com Tronco Inclinado à Frente",
    bodyPart: "upper legs",
    target: "Glúteo Médio & Porção Superior do Glúteo Máximo",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cadeira_Abdutora_com_Tronco_Inclinado___Frente/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cadeira_Abdutora_com_Tronco_Inclinado___Frente/1.jpg",
    ],
    instructions: [
      "Sente-se na ponta do assento da cadeira abdutora e incline o tronco para a frente a 45° segurando a estrutura da máquina.",
      "Abra as pernas com força contra as almofadas até a amplitude máxima.",
      "Segure 2 segundos no pico e retorne devagar sem bater os pesos."
    ],
    tips: [
      "A flexão de quadril alinha o glúteo médio e fibras superiores do glúteo máximo na linha direta de tração da máquina.",
      "Sentir queimação intensa nas laterais do glúteo."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_standing_hip_abduction_machine",
    name: "Cadeira / Máquina Abdutora em Pé",
    bodyPart: "upper legs",
    target: "Glúteo Médio, Mínimo & Tensor da Fáscia Lata",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cadeira___M_quina_Abdutora_em_P_/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cadeira___M_quina_Abdutora_em_P_/1.jpg",
    ],
    instructions: [
      "Fique em pé na máquina com a almofada posicionada na parte externa da coxa/joelho.",
      "Segure as manoplas para estabilização do tronco e empurre a perna lateralmente para fora.",
      "Segure a contração isométrica por 2 segundos e retorne devagar."
    ],
    tips: [
      "Excelente modelador do contorno lateral dos quadris.",
      "Mantenha a perna de apoio com joelho levemente destravado."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_frog_pumps",
    name: "Glúteo Frog Pump no Solo",
    bodyPart: "upper legs",
    target: "Glúteo Máximo (Pico Metabólico)",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Gl_teo_Frog_Pump_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Gl_teo_Frog_Pump_no_Solo/1.jpg",
    ],
    instructions: [
      "Deite de costas no solo e una as solas dos pés juntas abrindo os joelhos para os lados em formato de borboleta/sapo.",
      "Pressione os pés um contra o outro e eleve a pelve contraindo os glúteos com força.",
      "Desça e repita em ritmo contínuo para altas repetições (20 a 30 reps)."
    ],
    tips: [
      "A rotação externa das pernas ativa as fibras profundas do glúteo.",
      "Perfeito como ativador antes do agachamento ou como finalizador de treino."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_lateral_band_walk",
    name: "Caminhada Lateral com Mini Band (Monster Walk)",
    bodyPart: "upper legs",
    target: "Glúteo Médio, Mínimo & Estabilizadores Pélvicos",
    equipment: "band",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Caminhada_Lateral_com_Mini_Band/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Caminhada_Lateral_com_Mini_Band/1.jpg",
    ],
    instructions: [
      "Coloque uma mini band elástica acima dos joelhos ou ao redor dos tornozelos.",
      "Fique em meia posição de agachamento com peito ereto e abdômen firme.",
      "Dê passos laterais mantendo a tensão elástica constante sem deixar os pés se juntarem completamente.",
      "Percorra 10 a 15 passos para um lado e depois retorne para o outro."
    ],
    tips: [
      "Não deixe os joelhos colapsarem para dentro.",
      "Ativação fundamental antes de treinos pesados de pernas e agachamento."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_b_stance_rdl",
    name: "RDL com Halteres em B-Stance (Stiff com Pé de Apoio)",
    bodyPart: "upper legs",
    target: "Isquiotibiais & Glúteo Máximo",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/RDL_com_Halteres_em_B_Stance/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/RDL_com_Halteres_em_B_Stance/1.jpg",
    ],
    instructions: [
      "Fique em pé com um pé totalmente apoiado à frente e o outro pé posicionado ligeiramente atrás apoiado apenas na ponta dos dedos (como um tripé de suporte).",
      "Segure dois halteres e empurre o quadril para trás descendo os halteres rentes à perna dianteira.",
      "Sinta o alongamento no posterior da perna da frente e retorne apertando o glúteo."
    ],
    tips: [
      "Oferece todos os benefícios do trabalho unilateral sem o risco de desequilíbrio do single-leg RDL livre.",
      "80% a 90% do peso deve ficar sobre o calcanhar da perna da frente."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_single_lying_leg_curl",
    name: "Mesa Flexora Unilateral",
    bodyPart: "upper legs",
    target: "Isquiotibiais (Bíceps Femoral & Semitendíneo)",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Mesa_Flexora_Unilateral/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Mesa_Flexora_Unilateral/1.jpg",
    ],
    instructions: [
      "Deite de bruços na mesa flexora com o rolo posicionado acima do calcanhar de uma das pernas.",
      "Segure as manoplas e flexione o joelho puxando o calcanhar em direção ao glúteo.",
      "Segure 1 segundo no pico de flexão e desça resistindo à descida."
    ],
    tips: [
      "Identifica e corrige assimetrias de força entre os posteriores das pernas.",
      "Mantenha o osso da bacia colado no acolchoado sem arquear a lombar."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_standing_cable_leg_curl",
    name: "Flexora em Pé na Polia com Tornozeleira",
    bodyPart: "upper legs",
    target: "Isquiotibiais (Pico de Contração)",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flexora_em_P__na_Polia_com_Tornozeleira/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flexora_em_P__na_Polia_com_Tornozeleira/1.jpg",
    ],
    instructions: [
      "Prenda a tornozeleira na polia baixa e fique em pé de frente para a torre com joelho de apoio levemente destravado.",
      "Flexione o joelho da perna ativa elevando o calcanhar em direção ao glúteo.",
      "Aperte o posterior no topo e desça controladamente."
    ],
    tips: [
      "Trabalha a flexão do joelho com quadril estendido, atingindo uma ativação neuromuscular única dos isquiotibiais.",
      "Não balance o tronco durante o movimento."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_horizontal_leg_press_calf",
    name: "Panturrilha no Leg Press Horizontal",
    bodyPart: "lower legs",
    target: "Gastrocnêmio & Sóleo",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Panturrilha_no_Leg_Press_Horizontal/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Panturrilha_no_Leg_Press_Horizontal/1.jpg",
    ],
    instructions: [
      "Sente-se no Leg Press Horizontal e apoie apenas as pontas dos pés na borda inferior da plataforma com calcanhares livres.",
      "Com as pernas quase estendidas, empurre a plataforma para a frente com as pontas dos pés (flexão plantar).",
      "Segure 2 segundos de contração máxima e retorne sentindo o alongamento completo dos calcanhares."
    ],
    tips: [
      "Faça pausas de 2 segundos no ponto mais fundo para dissipar a energia elástica do tendão de Aquiles.",
      "Foco na contração pura da musculatura da panturrilha."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_smith_calf_raise_block",
    name: "Panturrilha no Smith Machine sobre Bloco / Degrau",
    bodyPart: "lower legs",
    target: "Gastrocnêmio (Cabeça Medial & Lateral)",
    equipment: "smith machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Panturrilha_no_Smith_Machine_sobre_Bloco___Degrau/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Panturrilha_no_Smith_Machine_sobre_Bloco___Degrau/1.jpg",
    ],
    instructions: [
      "Coloque um bloco ou step de madeira sob a barra do Smith e apoie a ponta dos pés na borda.",
      "Destrave a barra sobre os trapézios com corpo ereto.",
      "Desça os calcanhares abaixo da linha do degrau em alongamento profundo.",
      "Suba o mais alto possível nas pontas dos pés apertando as panturrilhas."
    ],
    tips: [
      "O apoio no degrau dobra a amplitude útil de movimento em relação ao chão plano.",
      "Mantenha os joelhos estendidos (sem hiperestensão) para focar no gastrocnêmio."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_single_leg_bodyweight_calf",
    name: "Panturrilha Unilateral no Solo / Degrau",
    bodyPart: "lower legs",
    target: "Gastrocnêmio, Sóleo & Equilíbrio",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Panturrilha_Unilateral_no_Solo___Degrau/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Panturrilha_Unilateral_no_Solo___Degrau/1.jpg",
    ],
    instructions: [
      "Fique sobre um pé na borda de um degrau com uma mão apoiada na parede para equilíbrio.",
      "Desça o calcanhar ao máximo e eleve o corpo subindo na ponta do pé.",
      "Segure 2 segundos no topo e desça lentamente."
    ],
    tips: [
      "Excelente para treinar em casa com o peso corporal.",
      "Pode segurar um halter na mão livre para sobrecarga progressiva."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_donkey_calf_raise",
    name: "Panturrilha Tipo Burrinho na Máquina (Donkey Calf Raise)",
    bodyPart: "lower legs",
    target: "Gastrocnêmio & Sóleo (Alongamento Pronunciado)",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Panturrilha_Tipo_Burrinho_na_M_quina/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Panturrilha_Tipo_Burrinho_na_M_quina/1.jpg",
    ],
    instructions: [
      "Posicione-se na máquina com o tronco flexionado a 90° e almofada apoiada sobre a região sacral/lombar baixa.",
      "Apoie as pontas dos pés no degrau com calcanhares livres.",
      "Eleve os calcanhares ao máximo contraindo as panturrilhas e desça em alongamento completo."
    ],
    tips: [
      "A flexão do quadril coloca o gastrocnêmio em pré-alongamento ideal para pico de torque.",
      "Um dos exercícios favoritos da Era de Ouro do fisiculturismo."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_tibialis_anterior_raise",
    name: "Elevação Tibial Anterior no Solo / Parede",
    bodyPart: "lower legs",
    target: "Tibial Anterior & Estabilidade do Tornozelo",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Eleva__o_Tibial_Anterior_no_Solo___Parede/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Eleva__o_Tibial_Anterior_no_Solo___Parede/1.jpg",
    ],
    instructions: [
      "Encoste as costas e quadril em uma parede com calcanhares apoiados a 30 cm de distância da parede.",
      "Com as pernas estendidas, puxe as pontas dos pés para cima em direção às canelas (dorsiflexão).",
      "Segure 1 segundo no topo e desça sem encostar totalmente as pontas dos pés no chão."
    ],
    tips: [
      "Fortalece a frente da canela, prevenindo canelite e melhorando a absorção de impacto na corrida e saltos.",
      "Faça séries de 20 a 25 repetições até sentir queimação no músculo tibial."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_bicycle_crunches",
    name: "Abdominal Bicicleta no Solo (Bicycle Crunches)",
    bodyPart: "waist",
    target: "Oblíquos, Reto Abdominal & Core",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Bicicleta_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Bicicleta_no_Solo/1.jpg",
    ],
    instructions: [
      "Deite de costas com mãos atrás das orelhas e pernas elevadas com joelhos a 90°.",
      "Traga o cotovelo direito em direção ao joelho esquerdo enquanto estende a perna direita para a frente.",
      "Alterne os lados em movimento fluido e ritmado como pedalar uma bicicleta."
    ],
    tips: [
      "Estudos eletromiográficos comprovam que é um dos exercícios mais eficazes para os oblíquos e reto abdominal.",
      "Gire os ombros e não apenas puxe o cotovelo."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_v_ups_jackknife",
    name: "Abdominal Canivete / V-Up no Solo",
    bodyPart: "waist",
    target: "Reto Abdominal (Supra e Infra) & Core",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Canivete___V_Up_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Canivete___V_Up_no_Solo/1.jpg",
    ],
    instructions: [
      "Deite totalmente estendido no solo com braços esticados acima da cabeça e pernas juntas.",
      "Em um movimento explosivo e controlado, eleve simultaneamente o tronco e as pernas estendidas formando um 'V' no ar.",
      "Toque as mãos nas canelas ou pontas dos pés no topo e retorne devagar sem relaxar no chão."
    ],
    tips: [
      "Exige coordenação e força integrada de todo o abdômen.",
      "Mantenha a descida controlada para proteger a lombar."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_scissor_kicks",
    name: "Abdominal Tesoura no Solo (Scissor Kicks)",
    bodyPart: "waist",
    target: "Abdômen Inferior (Infra) & Flexores do Quadril",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Tesoura_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Tesoura_no_Solo/1.jpg",
    ],
    instructions: [
      "Deite de costas com mãos sob os glúteos para suporte lombar e pernas estendidas elevadas a 15 cm do chão.",
      "Cruze uma perna sobre a outra em movimento alternado de tesoura horizontal.",
      "Mantenha a respiração estável e o abdômen colado na coluna."
    ],
    tips: [
      "Mantenha a lombar sempre em contato com o solo.",
      "Quanto mais baixas as pernas (sem arquear a coluna), maior o desafio."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_lying_leg_raise",
    name: "Abdominal Infra no Solo com Elevação de Pernas",
    bodyPart: "waist",
    target: "Reto Abdominal Inferior & Transverso",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Infra_no_Solo_com_Eleva__o_de_Pernas/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Infra_no_Solo_com_Eleva__o_de_Pernas/1.jpg",
    ],
    instructions: [
      "Deite de costas no solo com braços ao lado do corpo ou mãos sob o quadril.",
      "Com pernas juntas e estendidas, eleve-as até 90° em relação ao solo elevando ligeiramente o quadril no topo.",
      "Desça lentamente as pernas até quase encostar os calcanhares no solo e suba novamente."
    ],
    tips: [
      "Não deixe a coluna lombar descolar do chão durante a descida das pernas.",
      "Concentre a força na puxada da pelve em direção ao tórax."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_situps_rowing",
    name: "Abdominal Remador Completo",
    bodyPart: "waist",
    target: "Reto Abdominal & Condicionamento",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Remador_Completo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Remador_Completo/1.jpg",
    ],
    instructions: [
      "Deite com corpo estendido e braços acima da cabeça.",
      "Flexione o tronco e dobre os joelhos simultaneamente abraçando as pernas no topo sentado sobre os ísquios.",
      "Estenda o corpo novamente de volta ao solo de forma controlada."
    ],
    tips: [
      "Clássico de testes de aptidão física militar e funcional.",
      "Mantenha ritmo constante e fluido."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cross_crunches",
    name: "Abdominal Oblíquo Cruzado no Solo",
    bodyPart: "waist",
    target: "Oblíquos Internos e Externos",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Obl_quo_Cruzado_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Obl_quo_Cruzado_no_Solo/1.jpg",
    ],
    instructions: [
      "Deite de costas e cruze o tornozelo de uma perna sobre o joelho oposto.",
      "Com a mão oposta atrás da cabeça, flexione a coluna levando o cotovelo em direção ao joelho cruzado.",
      "Aperte o oblíquo no topo por 1 segundo e desça devagar."
    ],
    tips: [
      "Realize todas as repetições de um lado antes de trocar a perna cruzada.",
      "Foque na rotação torácica."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_cable_woodchopper",
    name: "Abdominal Lenhador na Polia com Rotação (Woodchopper)",
    bodyPart: "waist",
    target: "Oblíquos, Transverso do Abdômen & Potência Rotacional",
    equipment: "cable",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Lenhador_na_Polia_com_Rota__o/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Lenhador_na_Polia_com_Rota__o/1.jpg",
    ],
    instructions: [
      "Ajuste a polia na altura do ombro ou alta, fique de lado com base firme e segure a manilha com ambas as mãos.",
      "Gire o tronco em diagonal puxando o cabo para baixo e para o lado oposto em movimento de corte de machado.",
      "Gire sobre a ponta do pé de trás transferindo a força pelo core.",
      "Retorne controlando a rotação."
    ],
    tips: [
      "Fundamental para potência esportiva (lutas, tênis, golfe, futebol).",
      "Mantenha os braços estendidos para usar o core como motor principal."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_plank_shoulder_taps",
    name: "Prancha com Toque nos Ombros (Shoulder Taps)",
    bodyPart: "waist",
    target: "Core Anti-Rotacional & Estabilidade dos Ombros",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Prancha_com_Toque_nos_Ombros/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Prancha_com_Toque_nos_Ombros/1.jpg",
    ],
    instructions: [
      "Fique em posição de prancha alta com as mãos alinhadas aos ombros e pés na largura do quadril.",
      "Mantendo o quadril totalmente imóvel, tire a mão direita do solo e toque o ombro esquerdo.",
      "Volte a mão ao solo e toque o ombro direito com a mão esquerda.",
      "Alterne os toques com controle absoluto."
    ],
    tips: [
      "O objetivo não é a velocidade, mas sim impedir que o quadril balance de um lado para o outro.",
      "Afaste mais os pés para facilitar a estabilidade."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_hollow_body_hold",
    name: "Prancha Canoa / Hollow Body Isométrica",
    bodyPart: "waist",
    target: "Transverso do Abdômen & Reto Abdominal Profundo",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Prancha_Canoa___Hollow_Body_Isom_trica/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Prancha_Canoa___Hollow_Body_Isom_trica/1.jpg",
    ],
    instructions: [
      "Deite de costas no solo com braços estendidos acima da cabeça e pernas estendidas.",
      "Pressione a lombar com força contra o chão e eleve simultaneamente os ombros e as pernas a 15 cm do solo.",
      "Mantenha a posição de canoa rígida sustentando a respiração estável por 30 a 45 segundos."
    ],
    tips: [
      "Se a lombar descolar do chão, flexione os joelhos temporariamente.",
      "Base de força da ginástica olímpica e calistenia avançada."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_dragon_flag",
    name: "Abdominal Dragão no Banco (Dragon Flag)",
    bodyPart: "waist",
    target: "Reto Abdominal, Oblíquos & Core Inteiro",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Drag_o_no_Banco/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Abdominal_Drag_o_no_Banco/1.jpg",
    ],
    instructions: [
      "Deite em um banco reto e segure a borda do banco atrás da cabeça com firmeza.",
      "Eleve todo o corpo em linha reta apoiado apenas na parte superior dos ombros e escápulas.",
      "Desça o corpo reto lentamente como uma prancha sólida sem dobrar o quadril até quase tocar o banco.",
      "Suba novamente usando a força brutal do abdômen."
    ],
    tips: [
      "Imortalizado por Bruce Lee e Sylvester Stallone.",
      "Nível de exigência extremo; inicie com pernas flexionadas (tuck) antes da versão completa."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_hanging_windshield_wipers",
    name: "Limpador de Pára-brisa na Barra Fixa",
    bodyPart: "waist",
    target: "Oblíquos, Reto Abdominal & Pegada",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Limpador_de_P_ra_brisa_na_Barra_Fixa/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Limpador_de_P_ra_brisa_na_Barra_Fixa/1.jpg",
    ],
    instructions: [
      "Pendure-se na barra fixa e eleve as pernas retas até a barra (posição invertida).",
      "Gire as pernas unidas de um lado para o outro em arco controlado como palhetas de limpador de pára-brisa.",
      "Controle a desaceleração lateral e reverta o movimento."
    ],
    tips: [
      "Requer força fantástica de tração dorsal, pegada e oblíquos.",
      "Pode ser executado no solo deitado de costas como versão preliminar."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_spiderman_plank",
    name: "Prancha Spiderman no Solo",
    bodyPart: "waist",
    target: "Oblíquos, Reto Abdominal & Flexores",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Prancha_Spiderman_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Prancha_Spiderman_no_Solo/1.jpg",
    ],
    instructions: [
      "Fique em posição de prancha baixa apoiado nos antebraços.",
      "Traga o joelho direito lateralmente por fora em direção ao cotovelo direito.",
      "Aperte o oblíquo, retorne o pé atrás e repita com o joelho esquerdo no cotovelo esquerdo."
    ],
    tips: [
      "Mantenha o quadril nivelado durante todo o percurso.",
      "Movimento lento e focado na contração lateral."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_full_burpee",
    name: "Burpee Completo com Flexão e Salto",
    bodyPart: "cardio",
    target: "Condicionamento Geral, Queima Calórica & Potência",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Burpee_Completo_com_Flex_o_e_Salto/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Burpee_Completo_com_Flex_o_e_Salto/1.jpg",
    ],
    instructions: [
      "Em pé, agache e apoie as mãos no solo jogando os pés para trás em prancha.",
      "Execute uma flexão de braço completa encostando o peito no chão.",
      "Empurre o solo, recolha os pés para perto das mãos em agachamento e salte verticalmente estendendo os braços com palma acima da cabeça."
    ],
    tips: [
      "Mantenha ritmo respiratório constante para aguentar séries longas.",
      "Amorteça a queda com os pés inteiros no solo."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_kettlebell_swing",
    name: "Balanço com Kettlebell Russo (Kettlebell Swing)",
    bodyPart: "cardio",
    target: "Cadeia Posterior, Glúteos, Core & Cardio",
    equipment: "dumbbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Balan_o_com_Kettlebell_Russo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Balan_o_com_Kettlebell_Russo/1.jpg",
    ],
    instructions: [
      "Fique em pé com pés mais largos que os ombros segurando o kettlebell com as duas mãos.",
      "Flexione o quadril para trás passando o kettlebell entre as pernas com coluna neutra.",
      "Exploda os glúteos e quadris para a frente lançando o kettlebell até a altura do peito/olhos.",
      "Deixe a gravidade trazer o peso de volta flexionando o quadril em dobradiça contínua."
    ],
    tips: [
      "O movimento é uma dobradiça de quadril (hip hinge) e NÃO um agachamento.",
      "Os braços servem apenas como cordas; a força propulsora vem 100% dos glúteos e quadris."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_battle_ropes",
    name: "Corda Naval Ondulada (Battle Ropes)",
    bodyPart: "cardio",
    target: "Ombros, Braços, Core & Capacidade Cardiorrespiratória",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Corda_Naval_Ondulada/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Corda_Naval_Ondulada/1.jpg",
    ],
    instructions: [
      "Fique em posição de meio agachamento com postura atlética segurando uma ponta da corda em cada mão.",
      "Bata as cordas no solo alternadamente criando ondas rápidas e contínuas até a âncora.",
      "Mantenha o core rígido e os braços em alta cadência."
    ],
    tips: [
      "Gera pico de frequência cardíaca com impacto zero nas articulações inferiores.",
      "Varie entre ondas alternadas, ondas simultâneas e batidas duplas com salto."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_med_ball_slams",
    name: "Arremesso de Medicine Ball no Solo (Slam Ball)",
    bodyPart: "cardio",
    target: "Dorsais, Abdômen, Ombros & Liberação de Potência",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arremesso_de_Medicine_Ball_no_Solo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arremesso_de_Medicine_Ball_no_Solo/1.jpg",
    ],
    instructions: [
      "Fique em pé segurando uma slam ball pesada com ambas as mãos.",
      "Estenda o corpo e leve a bola acima e atrás da cabeça com extensão completa.",
      "Arremesse a bola com máxima fúria e força contra o solo flexionando o tronco e agachando.",
      "Recolha a bola na subida e repita sem interrupção."
    ],
    tips: [
      "Use uma bola sem quique (slam ball de borracha com areia).",
      "Excelente para alívio de estresse e potência do core anterior."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_jumping_jacks",
    name: "Polichinelo Clássico com Ritmo",
    bodyPart: "cardio",
    target: "Aquecimento Sistêmico, Panturrilhas & Cardio",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Polichinelo_Cl_ssico_com_Ritmo/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Polichinelo_Cl_ssico_com_Ritmo/1.jpg",
    ],
    instructions: [
      "Comece em pé com pés juntos e braços ao lado do corpo.",
      "Dê um salto afastando as pernas lateralmente enquanto bate as palmas das mãos acima da cabeça.",
      "Salte novamente retornando pés e mãos à posição inicial em cadência rítmica constante."
    ],
    tips: [
      "Aterrisse suavemente nas pontas dos pés para amortecer o impacto.",
      "Excelente para aquecimento articular e sessões aeróbicas leves."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_shadow_boxing",
    name: "Boxe Sombra com Esquivas (Shadow Boxing)",
    bodyPart: "cardio",
    target: "Agilidade, Ombros, Core & Coordenação",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Boxe_Sombra_com_Esquivas/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Boxe_Sombra_com_Esquivas/1.jpg",
    ],
    instructions: [
      "Fique em guarda de luta com joelhos soltos e queixo protegido.",
      "Desfira combinações de golpes diretos (jab, direto), ganchos (cross) e cruzados (uppercuts).",
      "Incorpore pêndulos de esquiva, passadas e giros de quadril mantendo o ritmo acelerado."
    ],
    tips: [
      "Gire o tronco e o calcanhar em cada soco para engajar o abdômen oblíquo.",
      "Mantenha os ombros relaxados para economizar energia."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_high_knees",
    name: "Corrida Estacionária com Joelhos Altos (High Knees)",
    bodyPart: "cardio",
    target: "Flexores do Quadril, Panturrilhas & VO2 Max",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Corrida_Estacion_ria_com_Joelhos_Altos/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Corrida_Estacion_ria_com_Joelhos_Altos/1.jpg",
    ],
    instructions: [
      "Fique em pé e corra no mesmo lugar elevando os joelhos alternadamente até a altura do quadril (90°).",
      "Bombeie os braços coordenadamente em ritmo vigoroso.",
      "Mantenha a postura ereta e pontas dos pés ativas."
    ],
    tips: [
      "Mantenha contato breve com o solo.",
      "Exercício dinâmico potente para queima de calorias em espaços compactos."
    ],
    difficulty: "Iniciante",
  },
  {
    id: "ex_sled_push",
    name: "Empurrar Trenó com Carga no Gramado (Prowler Sled Push)",
    bodyPart: "cardio",
    target: "Quadríceps, Glúteos, Panturrilhas & Potência Metabólica",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Empurrar_Tren__com_Carga_no_Gramado/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Empurrar_Tren__com_Carga_no_Gramado/1.jpg",
    ],
    instructions: [
      "Apoie as mãos nas hastes verticais do trenó com braços estendidos e tronco inclinado a 45°.",
      "Empurre o chão com passos potentes e firmes conduzindo o trenó pela pista.",
      "Mantenha o core contraído e respiração profunda."
    ],
    tips: [
      "Sem impacto articular e sem fase excêntrica dolorosa, permitindo alto volume de trabalho anaeróbico.",
      "Pressione pelas pontas dos pés com tração contínua."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_sled_pull",
    name: "Puxar Trenó com Corda / Fita (Sled Drag / Pull)",
    bodyPart: "cardio",
    target: "Isquiotibiais, Glúteos, Costas & Força Funcional",
    equipment: "body weight",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Puxar_Tren__com_Corda___Fita/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Puxar_Tren__com_Corda___Fita/1.jpg",
    ],
    instructions: [
      "Conecte a fita ou corda ao trenó com carga.",
      "Caminhe de costas puxando o trenó em passos firmes, ou puxe a corda mão sobre mão em pé com base estável.",
      "Mantenha postura firme e tensão ininterrupta."
    ],
    tips: [
      "Caminhar de costas puxando o trenó é excelente para saúde e fortalecimento do tendão patelar dos joelhos.",
      "Cadência controlada e contínua."
    ],
    difficulty: "Intermediário",
  },
  {
    id: "ex_treadmill_sprints",
    name: "Tiro de Sprint na Esteira (Sprint Intervals)",
    bodyPart: "cardio",
    target: "Potência Anaeróbica, Fibras Rápidas & Queima Lipídica",
    equipment: "machine",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tiro_de_Sprint_na_Esteira/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tiro_de_Sprint_na_Esteira/1.jpg",
    ],
    instructions: [
      "Ajuste a esteira para velocidade elevada (ex: 15 a 18 km/h).",
      "Segure nas laterais, salte para o centro da lona e corra em velocidade máxima com passadas vigorosas por 15 a 30 segundos.",
      "Apoie os pés nas laterais da esteira para recuperar por 30 a 45 segundos e repita o ciclo HIIT."
    ],
    tips: [
      "Aumente a inclinação para 1% a 2% para simular a resistência do vento.",
      "Apenas realize após aquecimento cardiovascular prévio."
    ],
    difficulty: "Avançado",
  },
  {
    id: "ex_trap_bar_carry",
    name: "Caminhada com Barra Hexagonal (Trap Bar Carry)",
    bodyPart: "cardio",
    target: "Trapézio, Antebraços, Pernas & Core Inteiro",
    equipment: "barbell",
    mediaFrames: [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Caminhada_com_Barra_Hexagonal/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Caminhada_com_Barra_Hexagonal/1.jpg",
    ],
    instructions: [
      "Posicione-se dentro da barra hexagonal carregada com anilhas e faça o levantamento até ficar em pé ereto.",
      "Caminhe para a frente com passos calmos, postura nobre e ombros travados para trás.",
      "Percorra a distância desejada e pouse a barra no solo com técnica de terra."
    ],
    tips: [
      "Permite carregar cargas substancialmente maiores que halteres sem colidir nas pernas.",
      "Excelente para desenvolver carcaça atlética e força bruta."
    ],
    difficulty: "Intermediário",
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
  invalidateExerciseIndex();
  return newEx;
}

export function deleteCustomExercise(id: string): void {
  if (typeof window === "undefined") return;
  const customList = getCustomExercises();
  const updated = customList.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY_CUSTOM_EXERCISES, JSON.stringify(updated));
  window.dispatchEvent(new Event("gymflow:custom-exercises-updated"));
  invalidateExerciseIndex();
}

export function getAllExercises(): ExerciseDBItem[] {
  const custom = getCustomExercises();
  return [...custom, ...LOCAL_EXERCISE_DB];
}

export function matchBodyPartCategory(bodyPart: string, filter: string): boolean {
  if (!filter || filter === "todos") return true;
  const bp = (bodyPart || "").toLowerCase();
  const f = filter.toLowerCase();
  if (f === "legs" || f === "pernas" || f === "upper legs" || f === "lower legs") {
    return bp === "upper legs" || bp === "lower legs" || bp === "legs" || bp.includes("leg") || bp.includes("perna");
  }
  if (f === "arms" || f === "braços" || f === "bracos" || f === "upper arms" || f === "lower arms") {
    return bp === "upper arms" || bp === "lower arms" || bp === "arms" || bp.includes("arm") || bp.includes("braç");
  }
  if (f === "chest" || f === "peito" || f === "peitoral") {
    return bp === "chest" || bp.includes("chest") || bp.includes("peito");
  }
  if (f === "back" || f === "costas" || f === "dorsal") {
    return bp === "back" || bp.includes("back") || bp.includes("costa");
  }
  if (f === "shoulders" || f === "ombros" || f === "ombro") {
    return bp === "shoulders" || bp.includes("shoulder") || bp.includes("ombro");
  }
  if (f === "waist" || f === "core" || f === "abdômen" || f === "abdomen") {
    return bp === "waist" || bp === "core" || bp.includes("waist") || bp.includes("abdo");
  }
  if (f === "cardio" || f === "aeróbico" || f === "aerobico") {
    return bp === "cardio" || bp.includes("cardio");
  }
  return bp === f;
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

  // Busca ultra-otimizada no catálogo completo com cache LRU e normalização de acentos
  const cacheKey = `${query.trim().toLowerCase()}_${filters?.bodyPart || "all"}_${filters?.equipment || "all"}`;
  const cachedResult = getCachedSearchResults(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  let filtered = getAllExercises();

  if (filters?.bodyPart && filters.bodyPart !== "todos") {
    filtered = filtered.filter((ex) => matchBodyPartCategory(ex.bodyPart, filters.bodyPart!));
  }

  if (filters?.equipment && filters.equipment !== "todos") {
    const targetEq = normalizeSearchString(filters.equipment);
    filtered = filtered.filter((ex) => normalizeSearchString(ex.equipment) === targetEq);
  }

  if (query.trim()) {
    const rawTokens = normalizeSearchString(query).split(/\s+/).filter(Boolean);
    if (rawTokens.length > 0) {
      filtered = filtered
        .map((ex) => {
          const normName = normalizeSearchString(ex.name);
          const normTarget = normalizeSearchString(ex.target);
          const normBody = normalizeSearchString(ex.bodyPart);
          const normEq = normalizeSearchString(ex.equipment);

          let score = 0;
          let allMatch = true;

          for (const token of rawTokens) {
            if (normName.includes(token)) {
              score += normName.startsWith(token) ? 10 : 5;
            } else if (normTarget.includes(token)) {
              score += 3;
            } else if (normBody.includes(token)) {
              score += 2;
            } else if (normEq.includes(token)) {
              score += 1;
            } else {
              allMatch = false;
              break;
            }
          }

          return { ex, score, allMatch };
        })
        .filter((item) => item.allMatch)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.ex);
    }
  }

  setCachedSearchResults(cacheKey, filtered);
  return filtered;
}

// ============================================================================
// ÍNDICES EM MEMÓRIA & BUSCA O(1) POR ID / NOME
// ============================================================================

export function normalizeSearchString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

let cachedIdMap: Map<string, ExerciseDBItem> | null = null;
let cachedNameMap: Map<string, ExerciseDBItem> | null = null;
let cachedNormNameMap: Map<string, ExerciseDBItem> | null = null;
const searchLRUCache = new Map<string, ExerciseDBItem[]>();

function getCachedSearchResults(key: string): ExerciseDBItem[] | null {
  return searchLRUCache.get(key) || null;
}

function setCachedSearchResults(key: string, results: ExerciseDBItem[]): void {
  if (searchLRUCache.size >= 150) {
    const oldest = searchLRUCache.keys().next().value;
    if (oldest) searchLRUCache.delete(oldest);
  }
  searchLRUCache.set(key, results);
}

export function invalidateExerciseIndex(): void {
  cachedIdMap = null;
  cachedNameMap = null;
  cachedNormNameMap = null;
  searchLRUCache.clear();
}

function getExerciseIndex(): {
  idMap: Map<string, ExerciseDBItem>;
  nameMap: Map<string, ExerciseDBItem>;
  normNameMap: Map<string, ExerciseDBItem>;
} {
  if (cachedIdMap && cachedNameMap && cachedNormNameMap) {
    return { idMap: cachedIdMap, nameMap: cachedNameMap, normNameMap: cachedNormNameMap };
  }

  const all = getAllExercises();
  const idMap = new Map<string, ExerciseDBItem>();
  const nameMap = new Map<string, ExerciseDBItem>();
  const normNameMap = new Map<string, ExerciseDBItem>();

  for (let i = 0; i < all.length; i++) {
    const ex = all[i];
    if (ex.id) idMap.set(ex.id, ex);
    if (ex.name) {
      nameMap.set(ex.name.toLowerCase().trim(), ex);
      normNameMap.set(normalizeSearchString(ex.name), ex);
    }
  }

  cachedIdMap = idMap;
  cachedNameMap = nameMap;
  cachedNormNameMap = normNameMap;

  return { idMap, nameMap, normNameMap };
}

/**
 * Retorna os dados de mídia e instruções de um exercício por ID ou nome com complexidade O(1)
 */
export function getExerciseDetails(exerciseIdOrName: string): ExerciseDBItem | undefined {
  if (!exerciseIdOrName) return undefined;
  const { idMap, nameMap, normNameMap } = getExerciseIndex();

  const directId = idMap.get(exerciseIdOrName);
  if (directId) return directId;

  const directName = nameMap.get(exerciseIdOrName.toLowerCase().trim());
  if (directName) return directName;

  const normName = normNameMap.get(normalizeSearchString(exerciseIdOrName));
  if (normName) return normName;

  return undefined;
}


