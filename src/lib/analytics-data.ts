/**
 * Analytics Datasets for Coach and Student Dashboards
 * Dados estruturados para Recharts (Area, Bar, Line e Heatmap)
 */

export interface ChartDataPoint {
  name: string;
  value: number;
  secondary?: number;
  tertiary?: number;
  [key: string]: any;
}

// -------------------------------------------------------------
// DADOS DO PROFESSOR / PERSONAL TRAINER
// -------------------------------------------------------------
export const coachAnalyticsData = {
  kpis: {
    monthlyRevenue: "R$ 8.450",
    revenueChange: "+14.2%",
    activeStudents: 14,
    studentsChange: "+2 novos",
    presenceRate: "89.4%",
    presenceChange: "+3.8%",
    hoursCoached: "58h",
    hoursChange: "+6h",
  },

  // Receita Mês a Mês (R$)
  monthlyRevenueHistory: [
    { name: "Jan", value: 4800, secondary: 400 },
    { name: "Fev", value: 5200, secondary: 600 },
    { name: "Mar", value: 5900, secondary: 500 },
    { name: "Abr", value: 6400, secondary: 700 },
    { name: "Mai", value: 7100, secondary: 850 },
    { name: "Jun", value: 7400, secondary: 900 },
    { name: "Jul", value: 7800, secondary: 1100 },
    { name: "Ago", value: 8100, secondary: 1200 },
    { name: "Set", value: 8450, secondary: 1450 },
  ],

  // Presenças vs Faltas na Semana
  weeklyAttendance: [
    { name: "Seg", value: 16, secondary: 2 },
    { name: "Ter", value: 14, secondary: 1 },
    { name: "Qua", value: 18, secondary: 2 },
    { name: "Qui", value: 15, secondary: 3 },
    { name: "Sex", value: 19, secondary: 1 },
    { name: "Sáb", value: 10, secondary: 1 },
  ],

  // Horários Mais Disputados no Salão
  busiestHours: [
    { name: "06:00", value: 8 },
    { name: "07:00", value: 12 },
    { name: "08:00", value: 15 },
    { name: "09:00", value: 9 },
    { name: "17:00", value: 14 },
    { name: "18:00", value: 18 },
    { name: "19:00", value: 16 },
    { name: "20:00", value: 10 },
  ],

  // Heatmap de Ocupação da Agenda (Seg a Sáb x Horários)
  agendaHeatmap: [
    { day: "Seg", hour: "06:00", value: 4 },
    { day: "Seg", hour: "07:00", value: 6 },
    { day: "Seg", hour: "08:00", value: 8 },
    { day: "Seg", hour: "17:00", value: 7 },
    { day: "Seg", hour: "18:00", value: 9 },
    { day: "Seg", hour: "19:00", value: 8 },

    { day: "Ter", hour: "06:00", value: 3 },
    { day: "Ter", hour: "07:00", value: 5 },
    { day: "Ter", hour: "08:00", value: 6 },
    { day: "Ter", hour: "17:00", value: 6 },
    { day: "Ter", hour: "18:00", value: 8 },
    { day: "Ter", hour: "19:00", value: 7 },

    { day: "Qua", hour: "06:00", value: 5 },
    { day: "Qua", hour: "07:00", value: 7 },
    { day: "Qua", hour: "08:00", value: 9 },
    { day: "Qua", hour: "17:00", value: 8 },
    { day: "Qua", hour: "18:00", value: 10 },
    { day: "Qua", hour: "19:00", value: 9 },

    { day: "Qui", hour: "06:00", value: 4 },
    { day: "Qui", hour: "07:00", value: 6 },
    { day: "Qui", hour: "08:00", value: 7 },
    { day: "Qui", hour: "17:00", value: 7 },
    { day: "Qui", hour: "18:00", value: 8 },
    { day: "Qui", hour: "19:00", value: 7 },

    { day: "Sex", hour: "06:00", value: 6 },
    { day: "Sex", hour: "07:00", value: 8 },
    { day: "Sex", hour: "08:00", value: 9 },
    { day: "Sex", hour: "17:00", value: 9 },
    { day: "Sex", hour: "18:00", value: 10 },
    { day: "Sex", hour: "19:00", value: 8 },

    { day: "Sáb", hour: "08:00", value: 8 },
    { day: "Sáb", hour: "09:00", value: 9 },
    { day: "Sáb", hour: "10:00", value: 6 },
  ],

  // Ranking de Frequência dos Alunos
  topStudents: [
    { id: "1", name: "Carlos Silva", plan: "Mensal VIP", totalSessions: 24, presenceRate: 96, avatar: "CS" },
    { id: "2", name: "Beatriz Lima", plan: "Mensal VIP", totalSessions: 22, presenceRate: 92, avatar: "BL" },
    { id: "3", name: "Lucas Mendes", plan: "Semanal 3x", totalSessions: 18, presenceRate: 88, avatar: "LM" },
    { id: "4", name: "Amanda Albuquerque", plan: "Mensal VIP", totalSessions: 16, presenceRate: 86, avatar: "AA" },
    { id: "5", name: "Gabriel Siqueira", plan: "Diária Avulsa", totalSessions: 12, presenceRate: 82, avatar: "GS" },
  ],

  // Atividades Recentes
  recentCoachActivity: [
    { id: "1", type: "checkin", title: "Treino Concluído", desc: "Carlos Silva completou o Treino A", time: "Há 12 min", color: "emerald" },
    { id: "2", type: "payment", title: "Pagamento Recebido", desc: "Beatriz Lima pagou Mensalidade VIP (R$ 580)", time: "Há 45 min", color: "amber" },
    { id: "3", type: "booking", title: "Nova Reserva", desc: "Lucas Mendes solicitou Horário Quarta 19:00", time: "Há 2 horas", color: "sky" },
    { id: "4", type: "workout", title: "Ficha Atualizada", desc: "Prescrição Foco Glúteos para Amanda", time: "Ontem às 18:30", color: "teal" },
  ],
};

// -------------------------------------------------------------
// DADOS DO ALUNO
// -------------------------------------------------------------
export const studentAnalyticsData = {
  kpis: {
    totalVolumeKg: "28.450 kg",
    volumeChange: "+18.4%",
    streakDays: 16,
    streakLabel: "dias seguidos 🔥",
    prsCount: 6,
    prsChange: "+2 este mês",
    bodyFatCurrent: "13.8%",
    bodyFatChange: "-3.4% total",
  },

  // Evolução de Cargas nos Compostos (1RM Estimada em kg)
  strengthProgression: [
    { name: "Mai", supino: 80, agachamento: 90, terra: 110 },
    { name: "Jun", supino: 85, agachamento: 100, terra: 125 },
    { name: "Jul", supino: 92, agachamento: 115, terra: 135 },
    { name: "Ago", supino: 98, agachamento: 125, terra: 150 },
    { name: "Set", supino: 105, agachamento: 135, terra: 160 },
  ],

  // Evolução da Composição Corporal (InBody)
  bodyComposition: [
    { name: "Mai", peso: 82.5, gordura: 17.2, massaMagra: 36.8 },
    { name: "Jun", peso: 81.2, gordura: 16.0, massaMagra: 37.2 },
    { name: "Jul", peso: 80.0, gordura: 15.1, massaMagra: 37.8 },
    { name: "Ago", peso: 79.1, gordura: 14.4, massaMagra: 38.2 },
    { name: "Set", peso: 78.4, gordura: 13.8, massaMagra: 38.6 },
  ],

  // Volume de Séries Semanais por Grupo Muscular
  muscleVolumeDistribution: [
    { name: "Peitoral", series: 16, alvo: 18 },
    { name: "Dorsal", series: 18, alvo: 18 },
    { name: "Quadríceps", series: 20, alvo: 20 },
    { name: "Glúteos", series: 14, alvo: 16 },
    { name: "Deltoides", series: 14, alvo: 14 },
    { name: "Braços", series: 12, alvo: 12 },
    { name: "Core", series: 10, alvo: 12 },
  ],

  // Frequência Mensal de Treinos (Treinos realizados vs Meta)
  monthlyAttendance: [
    { name: "Jan", treinos: 16, meta: 18 },
    { name: "Fev", treinos: 15, meta: 16 },
    { name: "Mar", treinos: 18, meta: 18 },
    { name: "Abr", treinos: 19, meta: 18 },
    { name: "Mai", treinos: 20, meta: 20 },
    { name: "Jun", treinos: 21, meta: 20 },
    { name: "Jul", treinos: 22, meta: 20 },
    { name: "Ago", treinos: 21, meta: 20 },
    { name: "Set", treinos: 22, meta: 20 },
  ],

  // Recordes Pessoais Atuais
  personalRecords: [
    { exercise: "Supino Reto com Barra", weight: 105, date: "07/Set/2026", reps: "1 rep (PR)", increase: "+5 kg" },
    { exercise: "Agachamento Livre", weight: 135, date: "04/Set/2026", reps: "2 reps (PR)", increase: "+10 kg" },
    { exercise: "Levantamento Terra", weight: 160, date: "28/Ago/2026", reps: "1 rep (PR)", increase: "+10 kg" },
    { exercise: "Desenvolvimento com Halteres", weight: 32, date: "02/Set/2026", reps: "6 reps (PR)", increase: "+2 kg" },
  ],
};
