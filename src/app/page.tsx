"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { BottomTabBar, TabType } from "@/components/layout/BottomTabBar";
import { DishHero } from "@/components/hero/DishHero";
import { HighlightsTicker } from "@/components/marquee/HighlightsTicker";
import { MealCustomizer, CustomMealItem } from "@/components/customizer/MealCustomizer";
import { SocialProof } from "@/components/reviews/SocialProof";
import { DeliveryMap } from "@/components/map/DeliveryMap";
import { ShoppingBagDrawer, CartItem } from "@/components/bag/ShoppingBagDrawer";
import { AuthModal } from "@/components/auth/AuthModal";
import { MercadoPagoModal } from "@/components/payment/MercadoPagoModal";
import { AIAdvisorModal } from "@/components/ai/AIAdvisorModal";
import { PWAInstaller } from "@/components/pwa/PWAInstaller";
import { OrderTrackingModal } from "@/components/orders/OrderTrackingModal";
import { UserProfileDrawer } from "@/components/profile/UserProfileDrawer";
import { PRESET_MEALS, PresetMeal } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Plus, Cookie, Dumbbell, Sparkles } from "lucide-react";

export default function GymFlowApp() {
  const [currentTab, setCurrentTab] = useState<TabType>("menu");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [cookieConsent, setCookieConsent] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // Adicionar refeição pronta (Preset)
  const handleAddPresetMeal = (meal: PresetMeal) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === meal.id);
      if (existing) {
        return prev.map((item) =>
          item.id === meal.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: meal.id,
          name: meal.name,
          unitPrice: meal.price,
          quantity: 1,
          calories: meal.calories,
          protein: meal.protein,
          details: `${meal.category} • ${meal.badge}`,
        },
      ];
    });
  };

  // Adicionar bowl personalizado
  const handleAddCustomMeal = (customMeal: CustomMealItem) => {
    setCartItems((prev) => [
      ...prev,
      {
        id: customMeal.id,
        name: customMeal.name,
        unitPrice: customMeal.totalPrice,
        quantity: 1,
        calories: customMeal.macros.calories * customMeal.multiplier,
        protein: customMeal.macros.protein * customMeal.multiplier,
        details: `${customMeal.base.name} + ${customMeal.protein.name}${
          customMeal.greens ? ` + ${customMeal.greens.name}` : ""
        }`,
      },
    ]);
    setIsCartOpen(true);
  };

  // Ajuste de quantidade na sacola
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProceedToCheckout = (finalAmount: number) => {
    setCheckoutAmount(finalAmount);
    setIsCartOpen(false);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
    setCartItems([]);
    setIsPaymentOpen(false);
    // Abre automaticamente o rastreador de entrega ao vivo
    setTimeout(() => {
      setIsTrackingOpen(true);
    }, 400);
  };

  const handleReorder = (mealName: string, price: number) => {
    setCartItems((prev) => [
      ...prev,
      {
        id: `reorder-${Date.now()}`,
        name: mealName,
        unitPrice: price,
        quantity: 1,
        calories: 520,
        protein: 45,
        details: "Repetição rápida de pedido anterior",
      },
    ]);
    setIsProfileOpen(false);
    setIsCartOpen(true);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCaloriesInCart = cartItems.reduce(
    (acc, item) => acc + item.calories * item.quantity,
    0
  );

  const filteredMeals =
    selectedCategory === "Todos"
      ? PRESET_MEALS
      : PRESET_MEALS.filter((m) => m.category === selectedCategory);

  return (
    <div className="w-full flex-1 flex flex-col justify-between relative pb-16">
      {/* Banner de Instalação PWA */}
      <PWAInstaller />

      {/* Header Fixo */}
      <Header
        cartCount={totalCartCount}
        activeCalories={totalCaloriesInCart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => (user ? setIsProfileOpen(true) : setIsAuthOpen(true))}
      />

      {/* Conteúdo Dinâmico por Aba */}
      <div className="w-full flex-1 flex flex-col">
        {currentTab === "menu" && (
          <div className="flex flex-col gap-2">
            {/* Hero Rotativo */}
            <DishHero
              onSelectMeal={handleAddPresetMeal}
              onCustomizeMeal={() => setCurrentTab("customizer")}
            />

            {/* Marquee Ticker */}
            <HighlightsTicker
              onQuickFilter={() => setCurrentTab("customizer")}
            />

            {/* Cardápio Seleção de Categorias */}
            <section className="w-full px-4 pt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <span>Pratos Prontos de Alta Performance</span>
                  </h3>
                  <p className="text-xs text-zinc-400">Desenvolvidos para bater seus macros</p>
                </div>
              </div>

              {/* Filtros em Pílula */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {["Todos", "Hipertrofia", "Definição", "Longevidade"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-emerald-500 text-black shadow-sm"
                        : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid de Bowls do Cardápio */}
              <div className="grid grid-cols-2 gap-2.5">
                {filteredMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-sm hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 bg-black/40 border border-white/5">
                        <Image
                          src={meal.image}
                          alt={meal.name}
                          fill
                          className="object-cover"
                          sizes="180px"
                        />
                        <div className="absolute top-1.5 left-1.5">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-emerald-400 border border-white/10">
                            {meal.protein}g Prot
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white truncate">{meal.name}</h4>
                      <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                        {meal.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-white">
                          {formatCurrency(meal.price)}
                        </span>
                        <span className="text-[9px] text-zinc-400">{meal.calories} kcal</span>
                      </div>

                      <button
                        onClick={() => handleAddPresetMeal(meal)}
                        className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Prova Social */}
            <SocialProof />

            {/* Mapa de Entrega */}
            <DeliveryMap />
          </div>
        )}

        {currentTab === "customizer" && (
          <MealCustomizer onAddToCart={handleAddCustomMeal} />
        )}

        {currentTab === "map" && <DeliveryMap />}

        {currentTab === "ai" && (
          <div className="p-4 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-400">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white">GymBot AI Prescritor</h3>
            <p className="text-xs text-zinc-400 max-w-[260px] mt-1 mb-4">
              Calcule seu metabolismo basal e descubra o plano exato para bater seus objetivos sem passar fome.
            </p>
            <Button
              size="md"
              variant="primary"
              onClick={() => setIsAIOpen(true)}
            >
              Abrir Consultor de Nutrição
            </Button>
          </div>
        )}

        {currentTab === "bag" && (
          <div className="p-4">
            <ShoppingBagDrawer
              isOpen={true}
              onClose={() => setCurrentTab("menu")}
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onProceedToCheckout={handleProceedToCheckout}
            />
          </div>
        )}
      </div>

      {/* LGPD: Banner de Consentimento de Cookies e Privacidade */}
      {!cookieConsent && (
        <div className="sticky bottom-16 z-50 mx-4 p-3 rounded-2xl bg-[#0F0F14]/95 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cookie className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[10px] text-zinc-300 leading-tight">
              Usamos cookies e geolocalização estritamente para otimizar sua entrega.
            </p>
          </div>
          <button
            onClick={() => setCookieConsent(true)}
            className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-bold shrink-0"
          >
            Aceitar
          </button>
        </div>
      )}

      {/* Bottom Tab Bar Fixa */}
      <BottomTabBar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === "bag") {
            setIsCartOpen(true);
          } else if (tab === "ai") {
            setIsAIOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        cartCount={totalCartCount}
      />

      {/* Modais e Drawers */}
      <ShoppingBagDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccessLogin={(userData) => setUser(userData)}
      />

      <UserProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onLogout={() => setUser(null)}
        onReorder={handleReorder}
      />

      <MercadoPagoModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        amount={checkoutAmount}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />

      <AIAdvisorModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onSelectMeal={(meal) => {
          handleAddPresetMeal(meal);
          setIsCartOpen(true);
        }}
      />
    </div>
  );
}
