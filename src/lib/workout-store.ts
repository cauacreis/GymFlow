/**
 * Workout Store & Teacher/Student State Synchronization
 * Permite que o professor cadastre alunos, prescreva fichas e reflita em tempo real no app do aluno
 */

import { WorkoutSplitTemplate, PREFORMED_ROUTINES } from "./exercisedb";

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  matricula: string;
  goal: "Hipertrofia" | "Emagrecimento" | "Força & Performance" | "Condicionamento Geral";
  currentRoutineTitle: string;
  prescribedBy: string;
  prescribedAt: string;
  notesFromCoach?: string;
  avatarUrl?: string;
  plan?: string;
  status?: "ativo" | "inativo" | "pendente";
  monthlyPresence?: number;
  monthlyAbsences?: number;
  totalClasses?: number;
  hasWorkoutSheet?: boolean;
  isOfflineStudent?: boolean;
  emergencyContact?: string;
  age?: number;
  lastPresence?: string;
}

export interface StudentWorkoutPackage {
  studentId: string;
  routineTitle: string;
  prescribedBy: string;
  prescribedAt: string;
  coachNotes?: string;
  splits: WorkoutSplitTemplate[];
}

const STORAGE_KEY_STUDENTS = "gymflow_students_v1";
const STORAGE_KEY_WORKOUTS = "gymflow_student_workouts_v1";
const EVENT_NAME = "gymflow:workout-updated";

const INITIAL_STUDENTS: StudentProfile[] = [
  {
    id: "student_carlos",
    name: "Carlos Silva",
    email: "carlos.silva@gymflow.app",
    phone: "(11) 99123-4567",
    matricula: "GF-84920",
    goal: "Hipertrofia",
    plan: "Mensal VIP Presencial",
    status: "ativo",
    monthlyPresence: 16,
    monthlyAbsences: 1,
    totalClasses: 48,
    lastPresence: "Hoje às 07:00",
    age: 29,
    hasWorkoutSheet: true,
    isOfflineStudent: false,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    currentRoutineTitle: "Hipertrofia Clássica ABC (Push / Pull / Legs)",
    prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
    prescribedAt: "Hoje às 10:30",
    notesFromCoach: "Foco especial na fase excêntrica do supino e amplitude no agachamento.",
    emergencyContact: "(11) 98888-7777",
  },
  {
    id: "student_beatriz",
    name: "Beatriz Lima",
    email: "beatriz.lima@gymflow.app",
    phone: "(11) 97777-6666",
    matricula: "GF-91402",
    goal: "Hipertrofia",
    plan: "Semanal 3x",
    status: "ativo",
    monthlyPresence: 12,
    monthlyAbsences: 0,
    totalClasses: 36,
    lastPresence: "Ontem às 18:00",
    age: 26,
    hasWorkoutSheet: true,
    isOfflineStudent: false,
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    currentRoutineTitle: "Foco Glúteos & Coxas (Especial Feminino)",
    prescribedBy: "Profª. Camila Martins (CREF 09332-SP)",
    prescribedAt: "08/Set/2026",
    notesFromCoach: "Manter 2 segundos de pico na elevação pélvica.",
    emergencyContact: "(11) 96666-5555",
  },
  {
    id: "student_lucas",
    name: "Lucas Mendes",
    email: "lucas.mendes@gymflow.app",
    phone: "(11) 96543-2109",
    matricula: "GF-77211",
    goal: "Força & Performance",
    plan: "Mensal VIP Presencial",
    status: "ativo",
    monthlyPresence: 18,
    monthlyAbsences: 2,
    totalClasses: 52,
    lastPresence: "Hoje às 07:00",
    age: 31,
    hasWorkoutSheet: true,
    isOfflineStudent: false,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    currentRoutineTitle: "Força Bruta 5×5 (Compostos Básicos)",
    prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
    prescribedAt: "05/Set/2026",
    notesFromCoach: "Respeitar rigorosamente os 2m30s de descanso nos compostos.",
    emergencyContact: "(11) 95555-4444",
  },
  {
    id: "student_fernanda",
    name: "Fernanda Ribeiro",
    email: "fernanda.ribeiro@gymflow.app",
    phone: "(11) 94444-3333",
    matricula: "GF-62198",
    goal: "Emagrecimento",
    plan: "Diária Avulsa",
    status: "ativo",
    monthlyPresence: 8,
    monthlyAbsences: 1,
    totalClasses: 18,
    lastPresence: "07/Set/2026",
    age: 34,
    hasWorkoutSheet: false, // Aluna presencial sem ficha obrigatória!
    isOfflineStudent: true,  // Aluna presencial cadastrada diretamente pelo professor
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    currentRoutineTitle: "Acompanhamento Presencial Livre",
    prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
    prescribedAt: "Presencial Livre",
    notesFromCoach: "Acompanhamento presencial direto no salão. Treino funcional e circuito metabólico sem ficha fixa.",
    emergencyContact: "(11) 93333-2222",
  },
];

export function getStoredStudents(): StudentProfile[] {
  if (typeof window === "undefined") return INITIAL_STUDENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_STUDENTS;
  }
}

export function saveNewStudent(studentData: {
  name: string;
  email?: string;
  goal: StudentProfile["goal"];
  phone?: string;
  plan?: string;
  age?: number;
  emergencyContact?: string;
  avatarUrl?: string;
  isOfflineStudent?: boolean;
}): StudentProfile {
  const students = getStoredStudents();
  const newStudent: StudentProfile = {
    id: `student_${Date.now()}`,
    name: studentData.name,
    email: studentData.email || `offline_${Date.now()}@gymflow.app`,
    phone: studentData.phone || "",
    matricula: `GF-${Math.floor(10000 + Math.random() * 90000)}`,
    goal: studentData.goal,
    plan: studentData.plan || "Mensal VIP Presencial",
    status: "ativo",
    monthlyPresence: 0,
    monthlyAbsences: 0,
    totalClasses: 0,
    hasWorkoutSheet: false, // Ficha não é obrigatória!
    isOfflineStudent: studentData.isOfflineStudent ?? true,
    age: studentData.age || 25,
    emergencyContact: studentData.emergencyContact || "",
    avatarUrl:
      studentData.avatarUrl ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    currentRoutineTitle: "Acompanhamento Presencial Livre",
    prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
    prescribedAt: "Sem Ficha Fixa",
  };

  const updated = [newStudent, ...students];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return newStudent;
}

export function updateStudentProfile(
  studentId: string,
  updates: Partial<StudentProfile>
): void {
  if (typeof window === "undefined") return;
  const students = getStoredStudents();
  const updated = students.map((s) => (s.id === studentId ? { ...s, ...updates } : s));
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function deleteStudent(studentId: string): void {
  if (typeof window === "undefined") return;
  const students = getStoredStudents();
  const updated = students.filter((s) => s.id !== studentId);
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function recordStudentAttendance(
  studentId: string,
  type: "presence" | "absence"
): void {
  if (typeof window === "undefined") return;
  const students = getStoredStudents();
  const updated = students.map((s) => {
    if (s.id === studentId) {
      if (type === "presence") {
        return {
          ...s,
          monthlyPresence: (s.monthlyPresence || 0) + 1,
          totalClasses: (s.totalClasses || 0) + 1,
          lastPresence: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        };
      } else {
        return {
          ...s,
          monthlyAbsences: (s.monthlyAbsences || 0) + 1,
        };
      }
    }
    return s;
  });
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function getStudentWorkout(studentId: string): StudentWorkoutPackage {
  const defaultRoutine = PREFORMED_ROUTINES[0];

  if (typeof window === "undefined") {
    return {
      studentId,
      routineTitle: defaultRoutine.name,
      prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
      prescribedAt: "09/Set/2026",
      coachNotes: "Cadência 3-0-1 em todos os compostos.",
      splits: defaultRoutine.splits,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    const workoutsMap: Record<string, StudentWorkoutPackage> = raw ? JSON.parse(raw) : {};

    if (workoutsMap[studentId]) {
      return workoutsMap[studentId];
    }

    // Se ainda não tiver ficha salva para esse aluno, associa a inicial
    const student = getStoredStudents().find((s) => s.id === studentId);
    let matchedRoutine = PREFORMED_ROUTINES[0];
    if (student?.currentRoutineTitle.includes("Glúteos")) {
      matchedRoutine = PREFORMED_ROUTINES[1] || PREFORMED_ROUTINES[0];
    } else if (student?.currentRoutineTitle.includes("Força")) {
      matchedRoutine = PREFORMED_ROUTINES[2] || PREFORMED_ROUTINES[0];
    }

    const initialPackage: StudentWorkoutPackage = {
      studentId,
      routineTitle: matchedRoutine.name,
      prescribedBy: student?.prescribedBy || "Prof. Rodrigo Costa (CREF 08412-SP)",
      prescribedAt: student?.prescribedAt || "09/Set/2026",
      coachNotes: student?.notesFromCoach || "Foco na amplitude completa e controle excêntrico.",
      splits: matchedRoutine.splits,
    };

    workoutsMap[studentId] = initialPackage;
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));
    return initialPackage;
  } catch (e) {
    return {
      studentId,
      routineTitle: defaultRoutine.name,
      prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
      prescribedAt: "09/Set/2026",
      splits: defaultRoutine.splits,
    };
  }
}

export function assignWorkoutToStudent(
  studentId: string,
  data: {
    routineTitle: string;
    coachNotes?: string;
    splits: WorkoutSplitTemplate[];
    prescribedBy?: string;
  }
): void {
  if (typeof window === "undefined") return;

  try {
    const rawWorkouts = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    const workoutsMap: Record<string, StudentWorkoutPackage> = rawWorkouts ? JSON.parse(rawWorkouts) : {};

    const workoutPackage: StudentWorkoutPackage = {
      studentId,
      routineTitle: data.routineTitle,
      prescribedBy: data.prescribedBy || "Prof. Rodrigo Costa (CREF 08412-SP)",
      prescribedAt: `Hoje às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      coachNotes: data.coachNotes || "Prescrição individualizada com foco em resultados progressivos.",
      splits: data.splits,
    };

    workoutsMap[studentId] = workoutPackage;
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));

    // Atualiza também o status na lista de alunos
    const students = getStoredStudents();
    const updatedStudents = students.map((st) => {
      if (st.id === studentId) {
        return {
          ...st,
          hasWorkoutSheet: true,
          currentRoutineTitle: data.routineTitle,
          prescribedBy: workoutPackage.prescribedBy,
          prescribedAt: workoutPackage.prescribedAt,
          notesFromCoach: workoutPackage.coachNotes,
        };
      }
      return st;
    });
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));

    // Dispara evento para reatividade instantânea
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { studentId } }));
  } catch (e) {
    console.error("Erro ao salvar ficha do aluno:", e);
  }
}

export function detachWorkoutFromStudent(studentId: string): void {
  if (typeof window === "undefined") return;
  try {
    const rawWorkouts = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    const workoutsMap: Record<string, StudentWorkoutPackage> = rawWorkouts ? JSON.parse(rawWorkouts) : {};
    delete workoutsMap[studentId];
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workoutsMap));

    const students = getStoredStudents();
    const updatedStudents = students.map((st) => {
      if (st.id === studentId) {
        return {
          ...st,
          hasWorkoutSheet: false,
          currentRoutineTitle: "Acompanhamento Presencial Livre",
          prescribedAt: "Sem Ficha Fixa",
          notesFromCoach: undefined,
        };
      }
      return st;
    });
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { studentId } }));
  } catch (e) {
    console.error("Erro ao desvincular ficha:", e);
  }
}

export function subscribeToWorkoutChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
