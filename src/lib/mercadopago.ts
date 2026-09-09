/**
 * Módulo de Integração com Mercado Pago (Modo Sandbox Seguro)
 * Em conformidade com PCI-DSS: Zero manipulação de dados sensíveis de cartão no servidor.
 */

import { generateIdempotencyKey } from "./security";

export interface CreatePaymentParams {
  amount: number;
  description: string;
  payerEmail: string;
  paymentMethod: "pix" | "credit_card";
  orderId: string;
}

export interface PaymentResult {
  id: string;
  status: "pending" | "approved" | "rejected";
  paymentMethod: "pix" | "credit_card";
  amount: number;
  qrCodeText?: string;
  qrCodeBase64?: string;
  idempotencyKey: string;
}

/**
 * Criação de pagamento simulado no ambiente de Sandbox do Mercado Pago
 */
export async function createSandboxPayment(
  params: CreatePaymentParams
): Promise<PaymentResult> {
  const idempotencyKey = generateIdempotencyKey();

  // Em produção, isso chama a API do Mercado Pago via SDK usando MP_ACCESS_TOKEN_PRODUCTION
  // No Sandbox, simulamos a resposta oficial instantânea sem risco financeiro
  const paymentId = `MP-${Date.now()}`;

  if (params.paymentMethod === "pix") {
    return {
      id: paymentId,
      status: "pending",
      paymentMethod: "pix",
      amount: params.amount,
      qrCodeText: `00020126580014br.gov.bcb.pix0136gymflow-sandbox-${paymentId}520400005303986540${params.amount.toFixed(
        2
      )}5802BR5915GymFlow Alimentos6009Sao Paulo62070503***6304E1F2`,
      idempotencyKey,
    };
  }

  return {
    id: paymentId,
    status: "approved",
    paymentMethod: "credit_card",
    amount: params.amount,
    idempotencyKey,
  };
}
