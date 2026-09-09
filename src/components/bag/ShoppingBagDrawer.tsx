"use client";

import React, { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, Minus, Tag, ShieldCheck, ArrowRight, ShoppingBag } from "lucide-react";

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  calories: number;
  protein: number;
  details?: string;
}

interface ShoppingBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToCheckout: (finalAmount: number, items: CartItem[]) => void;
}

export function ShoppingBagDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: ShoppingBagDrawerProps) {
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number>(5);

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const deliveryFee = 0; // Grátis para hubs parceiros
  const total = Math.max(0, subtotal - discount + deliveryFee + selectedTip);

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "GYMFLOW10") {
      setCouponApplied(true);
    } else {
      alert("Cupom inválido. Tente 'GYMFLOW10' para 10% OFF!");
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Sua Sacola Fit">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <ShoppingBag className="w-8 h-8 text-zinc-500" />
          </div>
          <h4 className="text-base font-bold text-white">Sua sacola está vazia</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-[220px]">
            Monte seu bowl com macros calculados ou escolha nossos pratos mais pedidos.
          </p>
          <Button
            size="sm"
            variant="primary"
            className="mt-4"
            onClick={onClose}
          >
            Explorar Cardápio
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Lista de Itens */}
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between"
              >
                <div className="flex flex-col flex-1 mr-2">
                  <span className="text-xs font-bold text-white truncate max-w-[170px]">
                    {item.name}
                  </span>
                  {item.details && (
                    <span className="text-[10px] text-zinc-400 truncate max-w-[170px] mt-0.5">
                      {item.details}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-emerald-400">
                    <span>{item.calories} kcal</span>
                    <span>•</span>
                    <span>{item.protein}g prot</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white whitespace-nowrap">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>

                  {/* Controles de Quantidade */}
                  <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-full border border-white/5">
                    {item.quantity === 1 ? (
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="w-5 h-5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    )}
                    <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Campo de Cupom */}
          <div className="p-2 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Cupom: GYMFLOW10"
              disabled={couponApplied}
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none uppercase font-semibold"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponApplied || !couponCode}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                couponApplied
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              {couponApplied ? "Aplicado (-10%)" : "Aplicar"}
            </button>
          </div>

          {/* Gorjeta do Entregador Parceiro */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-zinc-400 font-medium">Apoiar Entregador Parceiro:</span>
            <div className="flex items-center gap-2">
              {[0, 2, 5, 10].map((tip) => (
                <button
                  key={tip}
                  onClick={() => setSelectedTip(tip)}
                  className={`flex-1 py-1 rounded-xl text-xs font-semibold transition-all border ${
                    selectedTip === tip
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                      : "bg-white/[0.03] text-zinc-400 border-white/5 hover:bg-white/[0.06]"
                  }`}
                >
                  {tip === 0 ? "R$ 0" : `+R$ ${tip}`}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Desconto (10%)</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Entrega na Academia</span>
              <span className="text-emerald-400 font-semibold">GRÁTIS</span>
            </div>
            {selectedTip > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Gorjeta</span>
                <span>{formatCurrency(selectedTip)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-white/5 flex justify-between text-sm font-bold text-white">
              <span>Total Final</span>
              <span className="text-emerald-400 font-black text-base">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Botão de Finalização com Segurança */}
          <Button
            size="lg"
            variant="primary"
            icon={<ArrowRight className="w-4 h-4 text-black" />}
            onClick={() => onProceedToCheckout(total, items)}
            className="w-full"
          >
            Pagar com Mercado Pago
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ambiente Seguro Sandbox • Tokenização Criptografada</span>
          </div>
        </div>
      )}
    </Drawer>
  );
}
