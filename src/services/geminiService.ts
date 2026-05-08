/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { BuildingStats, FinancialRecord, MaintenanceTask } from "../types";

let ai: GoogleGenAI | null = null;

function getAI() {
  const key = (process.env as any).GEMINI_API_KEY;
  if (!key || key === '""' || key === 'undefined') {
    return null;
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

export async function getBuildingInsights(
  stats: BuildingStats,
  history: FinancialRecord[],
  tasks: MaintenanceTask[]
) {
  const aiInstance = getAI();
  if (!aiInstance) {
    return ["Mantenha o fundo de reserva acima de 10% das despesas.", "Reveja os contratos de manutenção preventiva.", "Envie avisos automáticos para moradores com mais de 30 dias de atraso."];
  }

  const prompt = `
    Analise os seguintes dados de um condomínio em Luanda, Angola (Moeda: Kwanza - AOA).
    Português de Portugal.
    
    ESTATÍSTICAS:
    - Valor em Caixa: ${stats.cashInHand} AOA
    - Despesas Mensais: ${stats.monthlyExpenses} AOA
    - Despesas com Staff: ${stats.staffExpenses} AOA
    - Funcionários Ativos: ${stats.activeEmployees}
    - Taxa de Inadimplência: ${stats.delinquencyRate}%

    TAREFAS DE MANUTENÇÃO:
    ${tasks.map(t => `- ${t.title} (${t.status}, Prioridade: ${t.priority})`).join('\n')}

    Forneça 3 insights rápidos e acionáveis para o administrador.
    Formate como um array JSON de strings, curto e direto.
  `;

  try {
    const response = await aiInstance.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    return ["Mantenha o fundo de reserva acima de 10% das despesas.", "Reveja os contratos de manutenção preventiva.", "Envie avisos automáticos para moradores com mais de 30 dias de atraso."];
  }
}
