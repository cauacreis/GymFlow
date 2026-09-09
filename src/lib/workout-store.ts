/**
 * Workout Store & Teacher/Student State Synchronization
 * Permite que o professor cadastre alunos, prescreva fichas e reflita em tempo real no app do aluno
 */

import { WorkoutSplitTemplate, PREFORMED_ROUTINES } from "./exercisedb";

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  matricula: string;
  goal: "Hipertrofia" | "Emagrecimento" | "Força & Performance" | "Condicionamento Geral";
  currentRoutineTitle: string;
  prescribedBy: string;
  prescribedAt: string;
  notesFromCoach?: string;
  avatarUrl?: string;
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
    matricula: "GF-84920",
    goal: "Hipertrofia",
    currentRoutineTitle: "Hipertrofia Clássica ABC (Push / Pull / Legs)",
    prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
    prescribedAt: "Hoje às 10:30",
    notesFromCoach: "Foco especial na fase excêntrica do supino e amplitude no agachamento.",
  },
  {
    id: "student_beatriz",
    name: "Beatriz Lima",
    email: "beatriz.lima@gymflow.app",
    matricula: "GF-91402",
    goal: "Hipertrofia",
    currentRoutineTitle: "Foco Glúteos & Coxas (Especial Feminino)",
    prescribedBy: "Profª. Camila Martins (CREF 09332-SP)",
    prescribedAt: "08/Set/2026",
    notesFromCoach: "Manter 2 segundos de pico na elevação pélvica.",
  },
  {
    id: "student_lucas",
    name: "Lucas Mendes",
    email: "lucas.mendes@gymflow.app",
    matricula: "GF-77211",
    goal: "Força & Performance",
    currentRoutineTitle: "Força Bruta 5×5 (Compostos Básicos)",
    prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
    prescribedAt: "05/Set/2026",
    notesFromCoach: "Respeitar rigorosamente os 2m30s de descanso nos compostos.",
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
  email: string;
  goal: StudentProfile["goal"];
}): StudentProfile {
  const students = getStoredStudents();
  const newStudent: StudentProfile = {
    id: `student_${Date.now()}`,
    name: studentData.name,
    email: studentData.email,
    matricula: `GF-${Math.floor(10000 + Math.random() * 90000)}`,
    goal: studentData.goal,
    currentRoutineTitle: "Aguardando Prescrição",
    prescribedBy: "Prof. Rodrigo Costa (CREF 08412-SP)",
    prescribedAt: "Pendente",
  };

  const updated = [newStudent, ...students];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return newStudent;
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
