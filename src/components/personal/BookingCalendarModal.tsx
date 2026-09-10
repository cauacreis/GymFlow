"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Check, Clock } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

interface BookingCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  planType: "basico" | "pro" | "vip" | "diario" | "semanal" | "mensal";
  coachName: string;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function BookingCalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  planType,
  coachName,
}: BookingCalendarModalProps) {
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth());
  const [tempDate, setTempDate] = useState<Date>(selectedDate);

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isContract = planType === "semanal" || planType === "mensal" || planType === "pro" || planType === "vip" || planType === "basico";

  // Dias no mês atual em visualização
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Navegar meses
  const handlePrevMonth = () => {
    triggerHaptic("light");
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    triggerHaptic("light");
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Selecionar dia
  const handleDayClick = (dayNumber: number) => {
    const chosen = new Date(viewYear, viewMonth, dayNumber);
    if (chosen < today) return; // Não permite datas passadas
    triggerHaptic("selection");
    setTempDate(chosen);
  };

  // Confirmar escolha
  const handleConfirm = () => {
    triggerHaptic("success");
    onSelectDate(tempDate);
    onClose();
  };

  // Cálculo da data final para planos recorrentes
  const getPlanDurationText = (start: Date) => {
    const end = new Date(start);
    if (planType === "semanal") {
      end.setDate(end.getDate() + 7);
      return `Válido de ${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} até ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
    }
    if (planType === "mensal" || planType === "pro" || planType === "vip" || planType === "basico") {
      end.setDate(end.getDate() + 30);
      return `Válido de ${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} até ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
    }
    return `Sessão presencial avulsa`;
  };

  const dayOfWeekName = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"][tempDate.getDay()];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-left">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {isContract ? "Data de Início do Plano" : "Data da Sessão Avulsa"}
            </span>
            <h3 className="text-base font-black text-white mt-0.5">
              {isContract ? "Quando você deseja começar?" : "Escolha o Dia do Treino"}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Treinador: <span className="text-zinc-200 font-semibold">{coachName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Mês e Ano */}
        <div className="flex items-center justify-between px-1 py-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-black text-white uppercase tracking-wider">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEK_DAYS.map((wd, i) => (
            <span
              key={i}
              className={`text-[10px] font-bold uppercase py-1 ${
                i === 0 ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Grid de Dias do Mês */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Espaços em branco antes do 1º dia */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty_${idx}`} className="aspect-square" />
          ))}

          {/* Dias numéricos */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const currentDayDate = new Date(viewYear, viewMonth, dayNum);
            currentDayDate.setHours(0, 0, 0, 0);

            const isPast = currentDayDate < today;
            const isToday = currentDayDate.getTime() === today.getTime();
            const isSelected =
              tempDate.getDate() === dayNum &&
              tempDate.getMonth() === viewMonth &&
              tempDate.getFullYear() === viewYear;
            const isSunday = currentDayDate.getDay() === 0;

            return (
              <button
                key={`day_${dayNum}`}
                type="button"
                disabled={isPast}
                onClick={() => handleDayClick(dayNum)}
                className={`relative aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? "bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/40 scale-105 z-10"
                    : isToday
                    ? "border border-emerald-500/60 text-emerald-400 bg-emerald-500/10 font-black"
                    : isPast
                    ? "text-zinc-700 cursor-not-allowed opacity-35"
                    : isSunday
                    ? "text-zinc-500 hover:bg-white/[0.04]"
                    : "text-zinc-200 hover:bg-white/[0.08]"
                }`}
              >
                <span>{dayNum}</span>
                {isToday && !isSelected && (
                  <span className="text-[7px] font-mono uppercase tracking-tighter text-emerald-400 -mt-0.5">
                    Hoje
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Resumo da Data Selecionada */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">
              {isContract ? "Data de Início Selecionada:" : "Data do Treino Selecionada:"}
            </span>
            <p className="text-xs font-black text-white truncate">
              {dayOfWeekName}, {tempDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
            <p className="text-[10px] text-emerald-400/90 font-medium truncate mt-0.5">
              {getPlanDurationText(tempDate)}
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-zinc-300 transition-all border border-white/[0.06]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-black text-zinc-950 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirmar Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
