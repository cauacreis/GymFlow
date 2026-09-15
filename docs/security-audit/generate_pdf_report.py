# -*- coding: utf-8 -*-
"""
Gerador do Relatório de Auditoria de Segurança — GymFlow
Gera o relatório executivo completo em PDF (A4, ~2cm margens, pt-BR)
com gráficos matplotlib de rosca e barras, tabelas de achados e issues GitHub.
"""

import os
import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

# Paleta Oficial Exigida
COLOR_CRITICA = "#B91C1C"
COLOR_ALTA = "#EA580C"
COLOR_MEDIA = "#D97706"
COLOR_BAIXA = "#2563EB"
COLOR_FORTE = "#059669"
COLOR_BG_DARK = "#0F172A"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PDF = os.path.join(BASE_DIR, "relatorio-auditoria-seguranca.pdf")
CHART_DOUGHNUT = os.path.join(BASE_DIR, "chart_severity_doughnut.png")
CHART_BARS = os.path.join(BASE_DIR, "chart_category_bars.png")

def generate_charts():
    # 1. Gráfico de Rosca por Severidade
    fig, ax = plt.subplots(figsize=(4.2, 3.2), subplot_kw=dict(aspect="equal"))
    labels = ["Crítica (2)", "Alta (3)", "Média (3)", "Baixa (1)"]
    sizes = [2, 3, 3, 1]
    chart_colors = [COLOR_CRITICA, COLOR_ALTA, COLOR_MEDIA, COLOR_BAIXA]

    wedges, texts, autotexts = ax.pie(
        sizes,
        labels=labels,
        autopct="%1.0f%%",
        startangle=140,
        colors=chart_colors,
        pctdistance=0.75,
        textprops=dict(color="#1E293B", fontsize=8, weight="bold"),
        wedgeprops=dict(width=0.45, edgecolor="white", linewidth=2)
    )
    for at in autotexts:
        at.set_color("white")
        at.set_fontsize(9)
        at.set_weight("bold")

    ax.set_title("Achados por Severidade", fontsize=11, fontweight="bold", pad=12, color="#0F172A")
    plt.tight_layout()
    plt.savefig(CHART_DOUGHNUT, dpi=220, bbox_inches="tight")
    plt.close()

    # 2. Gráfico de Barras por Categoria
    fig, ax = plt.subplots(figsize=(5.0, 3.2))
    categories = [
        "1. Banco sem Tranca",
        "2. Permissão Navegador",
        "3. IDOR / Inquilino",
        "4. Chaves Expostas",
        "5. Inputs / XSS",
        "6. Pontos Fortes"
    ]
    counts = [3, 2, 1, 2, 0, 7]
    bar_colors = [
        COLOR_CRITICA,
        COLOR_ALTA,
        COLOR_ALTA,
        COLOR_MEDIA,
        COLOR_BAIXA,
        COLOR_FORTE
    ]

    bars = ax.barh(categories, counts, color=bar_colors, height=0.6, edgecolor="none")
    ax.invert_yaxis()
    ax.set_xlim(0, 8.5)
    ax.set_xlabel("Quantidade de Itens Auditados", fontsize=8, color="#475569", fontweight="bold")
    ax.set_title("Distribuição por Categoria & Pontos Fortes", fontsize=11, fontweight="bold", pad=12, color="#0F172A")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#CBD5E1")
    ax.spines["bottom"].set_color("#CBD5E1")
    ax.tick_params(axis="both", which="major", labelsize=8)

    for bar in bars:
        w = bar.get_width()
        ax.text(w + 0.15, bar.get_y() + bar.get_height()/2, f"{int(w)}",
                va="center", ha="left", fontsize=8, fontweight="bold", color="#1E293B")

    plt.tight_layout()
    plt.savefig(CHART_BARS, dpi=220, bbox_inches="tight")
    plt.close()

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        if self._pageNumber == 1:
            return  # Capa não tem header/footer

        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))

        # Cabeçalho
        self.drawString(54, 842 - 36, "GYMFLOW — RELATÓRIO OFICIAL DE AUDITORIA DE SEGURANÇA")
        self.drawRightString(595 - 54, 842 - 36, "DEFENSIVE REPORT • 2026")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.6)
        self.line(54, 842 - 40, 595 - 54, 842 - 40)

        # Rodapé
        self.line(54, 45, 595 - 54, 45)
        self.setFont("Helvetica", 7.5)
        self.drawString(54, 32, "GymFlow • Next.js 14 App Router, Supabase PostgreSQL & Mercado Pago")
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(595 - 54, 32, page_str)
        self.restoreState()

def create_report():
    generate_charts()

    margin = 54  # ~1.9cm (A4 = 595 x 842 pt)
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=10,
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#475569"),
        spaceAfter=18,
    )

    h1_style = ParagraphStyle(
        "Header1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "Header2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=9,
        spaceAfter=5,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.2,
        leading=11.5,
        textColor=colors.HexColor("#334155"),
        spaceAfter=5,
    )

    body_bold = ParagraphStyle(
        "ReportBodyBold",
        parent=body_style,
        fontName="Helvetica-Bold",
    )

    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.2,
        leading=9.5,
        textColor=colors.HexColor("#1E293B"),
    )

    table_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=9.5,
        textColor=colors.white,
    )

    issue_block = ParagraphStyle(
        "IssueBlock",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=6.8,
        leading=9.0,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F8FAFC"),
        borderColor=colors.HexColor("#CBD5E1"),
        borderWidth=0.6,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=8,
    )

    story = []

    # =========================================================================
    # 1. CAPA
    # =========================================================================
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        '<font color="#059669"><b>● AUDITORIA DE SEGURANÇA E CONFORMIDADE TÉCNICA — GYMFLOW</b></font>',
        ParagraphStyle("Badge", parent=body_style, fontSize=8.5, leading=11, spaceAfter=8)
    ))
    story.append(Paragraph("Relatório de Auditoria de Segurança — GymFlow", title_style))
    story.append(Paragraph(
        "Investigação Exaustiva de Vulnerabilidades de Código-Fonte, Arquitetura Multi-Tenant, "
        "Permissões Client-Side, IDOR, Segredos Hardcoded e Resistência a Injeções.",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor(COLOR_CRITICA), spaceAfter=16))

    meta_data = [
        [Paragraph("<b>Projeto Avaliado:</b>", body_bold), Paragraph("GymFlow (Sistema de Gestão de Academias & Personal Trainers)", body_style)],
        [Paragraph("<b>Data da Auditoria:</b>", body_bold), Paragraph("14 de Setembro de 2026", body_style)],
        [Paragraph("<b>Classificação:</b>", body_bold), Paragraph("Repositório Público GitHub (cauacreis/GymFlow)", body_style)],
        [Paragraph("<b>Stack Tecnológica:</b>", body_bold), Paragraph("Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase (Auth, Postgres RLS, Storage), Mercado Pago API, Capacitor Mobile, Vercel Edge.", body_style)],
        [Paragraph("<b>Escopo Auditado:</b>", body_bold), Paragraph("100% dos Handlers de Rotas API (src/app/api), Schemas e Migrações SQL (supabase/), Bibliotecas de Serviços (src/lib/), Stores Locais e Componentes de Interface (src/components/).", body_style)],
    ]
    t_meta = Table(meta_data, colWidths=[115, 372])
    t_meta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    story.append(Paragraph("<b>Nota Metodológica & Mapeamento para a Stack GymFlow:</b>", h2_style))
    story.append(Paragraph(
        "A auditoria investigou 5 categorias fundamentais, mapeadas especificamente para a arquitetura detectada:<br/>"
        "<b>1. Banco sem Tranca:</b> Investigou políticas de Row Level Security (RLS) no Supabase e queries de listagem sem filtro pelo UUID autenticado.<br/>"
        "<b>2. Permissão Definida no Navegador:</b> Confrontou gates de permissão (activeRole, isAdmin, planTier) no frontend com a ausência de validação correspondente nas mutações do backend.<br/>"
        "<b>3. IDOR (Insecure Direct Object Reference):</b> Mapeou endpoints e chamadas que consultam ou alteram entidades (students, bookings, payments) sem checar posse.<br/>"
        "<b>4. Chaves Expostas (Hardcode):</b> Varreu segredos, salts criptográficos, defaults perigosos e fallbacks silenciosos no código e no histórico git.<br/>"
        "<b>5. Inputs sem Tratamento (XSS):</b> Auditou renderizações React (dangerouslySetInnerHTML, URLs javascript:, eval) e sanitização de dados no cliente e no servidor.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # 2. RESUMO EXECUTIVO & GRÁFICOS
    # =========================================================================
    story.append(Paragraph("1. Resumo Executivo", h1_style))
    story.append(Paragraph(
        "A auditoria no GymFlow identificou <b>9 achados verificados</b> no código-fonte real: "
        "<b>2 Críticas</b>, <b>3 Altas</b>, <b>3 Médias</b> e <b>1 Baixa</b>. "
        "Também foram verificados e comprovados <b>7 pontos fortes arquiteturais</b>, demonstrando que proteções avançadas "
        "(como FSM monotônica em webhooks e bloqueio de adulteração de preços) já estão ativas, coexistindo com políticas permissivas no banco.",
        body_style
    ))
    story.append(Spacer(1, 6))

    summary_boxes = [
        [
            Paragraph('<font color="#B91C1C"><b>CRÍTICA</b></font><br/><font size="15"><b>2</b></font>', ParagraphStyle("sb1", parent=body_style, alignment=1)),
            Paragraph('<font color="#EA580C"><b>ALTA</b></font><br/><font size="15"><b>3</b></font>', ParagraphStyle("sb2", parent=body_style, alignment=1)),
            Paragraph('<font color="#D97706"><b>MÉDIA</b></font><br/><font size="15"><b>3</b></font>', ParagraphStyle("sb3", parent=body_style, alignment=1)),
            Paragraph('<font color="#2563EB"><b>BAIXA</b></font><br/><font size="15"><b>1</b></font>', ParagraphStyle("sb4", parent=body_style, alignment=1)),
            Paragraph('<font color="#059669"><b>PONTOS FORTES</b></font><br/><font size="15"><b>7</b></font>', ParagraphStyle("sb5", parent=body_style, alignment=1)),
        ]
    ]
    t_sum = Table(summary_boxes, colWidths=[97, 97, 97, 97, 99])
    t_sum.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#FEF2F2")),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FFF7ED")),
        ("BACKGROUND", (2, 0), (2, 0), colors.HexColor("#FFFBEB")),
        ("BACKGROUND", (3, 0), (3, 0), colors.HexColor("#EFF6FF")),
        ("BACKGROUND", (4, 0), (4, 0), colors.HexColor("#ECFDF5")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t_sum)
    story.append(Spacer(1, 10))

    charts_table = Table(
        [[
            Image(CHART_DOUGHNUT, width=210, height=155),
            Image(CHART_BARS, width=265, height=155)
        ]],
        colWidths=[225, 262]
    )
    charts_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(charts_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("2. Pontos Fortes & Riscos Centrais", h1_style))
    story.append(Paragraph("<b>✅ Pontos Fortes Auditados e Comprovados:</b>", h2_style))
    strengths_text = (
        "• <b>Prevenção de Adulteração de Preços (pix/preference/subscription routes):</b> Preços validados estritamente no servidor via <code>OFFICIAL_PLANS</code>.<br/>"
        "• <b>FSM Monotônica em Webhooks (webhook/route.ts & payment/check/route.ts):</b> <code>resolvePaymentStateTransition</code> impede regressão de approved.<br/>"
        "• <b>Trigger PostgreSQL Anti-Tampering (schema.sql & 20260911000100):</b> <code>protect_profile_subscription_fields()</code> bloqueia updates anon em planos.<br/>"
        "• <b>Proteção contra Open Redirect (auth/callback/route.ts):</b> Validação de caminho estrito em <code>next</code> impede links maliciosos.<br/>"
        "• <b>Resistência Nativa a XSS:</b> React 18 JSX default escaping, zero <code>dangerouslySetInnerHTML</code>, sem eval ou markdown não sanitizado.<br/>"
        "• <b>Rate Limiting no Edge / Middleware:</b> Janelas deslizantes em <code>/api/auth</code>, <code>/api/payment</code> e <code>/api/vault</code>.<br/>"
        "• <b>Pre-Commit Script & Gitignore:</b> <code>scripts/check-secrets.js</code> bloqueia staging de credenciais <code>APP_USR-</code> e <code>TEST-</code>."
    )
    story.append(Paragraph(strengths_text, body_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>⚠️ Riscos Centrais Identificados:</b>", h2_style))
    weaknesses_text = (
        "• <b>RLS Aberto FOR ALL USING (true):</b> Anon key pública tem permissão irrestrita de leitura, escrita e deleção em quase todas as tabelas.<br/>"
        "• <b>Salt do Cofre Hardcoded no GitHub Público:</b> <code>VAULT_SALT = 'gymflow_vault_salt_2026'</code> permite forjar sessões super admin HMAC.<br/>"
        "• <b>Vazamento Massivo no Carregamento:</b> Stores sincronizam todas as tabelas sem filtro de coach/aluno salvando no localStorage de visitantes."
    )
    story.append(Paragraph(weaknesses_text, body_style))

    story.append(PageBreak())

    # =========================================================================
    # 3. TABELA DE ACHADOS DETALHADOS
    # =========================================================================
    story.append(Paragraph("3. Tabela Detalhada de Achados por Categoria", h1_style))
    story.append(Paragraph(
        "Todos os 9 achados verificados no código real, mapeados por severidade, arquivo e linha:",
        body_style
    ))
    story.append(Spacer(1, 5))

    def make_chip(text, bg_color):
        return Paragraph(
            f'<font color="#FFFFFF"><b>{text}</b></font>',
            ParagraphStyle("Chip", parent=table_header, alignment=1, backColor=colors.HexColor(bg_color), borderPadding=2.5)
        )

    findings_table_data = [
        [
            Paragraph("<b>Sev.</b>", table_header),
            Paragraph("<b>Categoria</b>", table_header),
            Paragraph("<b>Arquivo : Linhas</b>", table_header),
            Paragraph("<b>Descrição do Risco & Explorabilidade</b>", table_header),
        ],
        [
            make_chip("CRÍTICA", COLOR_CRITICA),
            Paragraph("1. Banco sem Tranca", table_cell),
            Paragraph("<code>supabase/schema.sql:223-242</code><br/><code>migrations/init.sql:146-165</code>", table_cell),
            Paragraph("Políticas RLS com <code>FOR ALL USING (true)</code> em <code>profiles</code>, <code>students</code>, <code>bookings</code> e <code>workouts</code>. Qualquer cliente anônimo pode ler, sobrescrever ou deletar qualquer registro.", table_cell),
        ],
        [
            make_chip("CRÍTICA", COLOR_CRITICA),
            Paragraph("4. Chaves Expostas", table_cell),
            Paragraph("<code>api/vault/verify/route.ts:8</code><br/><code>api/vault/session/route.ts:7</code>", table_cell),
            Paragraph("Salt <code>VAULT_SALT = 'gymflow_vault_salt_2026'</code> hardcoded no GitHub público. Atacantes podem forjar tokens de sessão HMAC para a cookie <code>gymflow_vault_auth</code> e desbloquear o cofre.", table_cell),
        ],
        [
            make_chip("ALTA", COLOR_ALTA),
            Paragraph("1. Banco sem Tranca", table_cell),
            Paragraph("<code>lib/workout-store.ts:396</code><br/><code>lib/booking-store.ts:928</code>", table_cell),
            Paragraph("Sincronização assíncrona automática chama <code>fetchStudentsFromSupabase()</code> sem filtrar tenant/coach, despejando a lista completa de alunos e contatos no <code>localStorage</code> do navegador.", table_cell),
        ],
        [
            make_chip("ALTA", COLOR_ALTA),
            Paragraph("2. Permissão Navegador", table_cell),
            Paragraph("<code>lib/auth-store.ts:128,251</code><br/><code>components/coach/*</code>", table_cell),
            Paragraph("Contas têm <code>enabledRoles: ['student', 'coach']</code> por padrão. Qualquer aluno pode alternar para 'coach' no cliente e acessar o painel de treinador sem validação no servidor.", table_cell),
        ],
        [
            make_chip("ALTA", COLOR_ALTA),
            Paragraph("3. IDOR / Inquilino", table_cell),
            Paragraph("<code>api/payment/check/route.ts:73,125</code>", table_cell),
            Paragraph("O parâmetro query <code>userId</code> sobrepõe o <code>parsedRef.userId</code> do pagamento aprovado. Permite que um atacante atribua um pagamento alheio ao seu próprio UUID.", table_cell),
        ],
        [
            make_chip("MÉDIA", COLOR_MEDIA),
            Paragraph("4. Chaves Expostas", table_cell),
            Paragraph("<code>lib/supabase.ts:113</code><br/><code>auth/callback/route.ts:39</code>", table_cell),
            Paragraph("Fallback silencioso <code>SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey</code>. Em caso de ausência da chave, rotas administrativas executam como cliente anon sem lançar erro.", table_cell),
        ],
        [
            make_chip("MÉDIA", COLOR_MEDIA),
            Paragraph("4. Chaves Expostas", table_cell),
            Paragraph("<code>api/payment/webhook/route.ts:45</code>", table_cell),
            Paragraph("Validação HMAC encapsulada em <code>if (webhookSecret && signatureHeader)</code>. Requisições sem o header <code>x-signature</code> pulam a checagem sem retornar 401.", table_cell),
        ],
        [
            make_chip("MÉDIA", COLOR_MEDIA),
            Paragraph("2. Permissão Navegador", table_cell),
            Paragraph("<code>api/delete-account/route.ts:12</code><br/><code>api/export-data/route.ts:7</code>", table_cell),
            Paragraph("Rotas de conformidade LGPD não extraem nem verificam o token de sessão do chamador. <code>delete-account</code> apenas apaga um cookie estático sem tocar no banco.", table_cell),
        ],
        [
            make_chip("BAIXA", COLOR_BAIXA),
            Paragraph("1. Banco sem Tranca", table_cell),
            Paragraph("<code>api/auth/check-device/route.ts:40</code>", table_cell),
            Paragraph("Endpoint público informa explicitamente se um e-mail já existe na tabela de perfis ('Este e-mail já está em uso'), permitindo enumeração de clientes.", table_cell),
        ],
    ]

    t_findings = Table(findings_table_data, colWidths=[50, 90, 137, 210])
    t_findings.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(COLOR_BG_DARK)),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4.5),
    ]))
    story.append(t_findings)

    story.append(PageBreak())

    # =========================================================================
    # 4. RECOMENDAÇÕES PRIORIZADAS
    # =========================================================================
    story.append(Paragraph("4. Recomendações Priorizadas de Correção", h1_style))
    story.append(Paragraph(
        "A matriz de remediação deve ser executada na seguinte ordem de prioridade técnica:",
        body_style
    ))
    story.append(Spacer(1, 5))

    recs = [
        ("P1 — Urgente (Imediato)", COLOR_CRITICA, [
            "<b>Corrigir Políticas RLS no Supabase:</b> Substituir as políticas <code>USING (true)</code> por verificações baseadas em <code>auth.uid() = user_id</code> ou <code>auth.uid()::text = coach_id</code>. Desabilitar mutações diretas anônimas.",
            "<b>Eliminar Chaves e Salts Hardcoded no Vault:</b> Mover <code>VAULT_SALT</code> e a chave mestra para variáveis de ambiente seguras (<code>ADMIN_VAULT_SECRET</code> e <code>ADMIN_MASTER_KEY</code>). Rejeitar inicialização se não configuradas.",
        ]),
        ("P2 — Alta Prioridade", COLOR_ALTA, [
            "<b>Sanitizar Métodos de Sincronização Local:</b> Exigir <code>coachId</code> ou <code>userId</code> em <code>fetchStudentsFromSupabase</code> e <code>fetchBookingsFromSupabase</code>. Nunca disparar queries sem filtro.",
            "<b>Blindar o Atribuidor de Pagamento em /api/payment/check:</b> Remover a precedência de <code>userId</code> via query param. O usuário deve ser extraído estritamente do <code>external_reference</code> ou sessão autenticada.",
            "<b>Isolar Papéis de Treinador e Aluno no Servidor:</b> Mudar cadastro para <code>enabled_roles: [role]</code> e criar endpoints dedicados para ações de professor com verificação de papel no backend.",
        ]),
        ("P3 — Média Prioridade", COLOR_MEDIA, [
            "<b>Exigir Assinatura Obrigatória no Webhook:</b> Rejeitar com 401 qualquer requisição sem o header <code>x-signature</code> ou com assinatura inválida.",
            "<b>Falha Explícita em Variáveis de Ambiente:</b> Remover fallback silencioso <code>SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey</code>, lançando exceção no boot.",
            "<b>Autenticar Endpoints LGPD:</b> Validar a sessão do chamador antes de processar pedidos de exportação e exclusão de dados.",
        ]),
    ]

    for title, color_code, items in recs:
        story.append(Paragraph(f'<font color="{color_code}"><b>{title}</b></font>', h2_style))
        for item in items:
            story.append(Paragraph(f"• {item}", body_style))
        story.append(Spacer(1, 3))

    story.append(PageBreak())

    # =========================================================================
    # 5. ISSUES PARA O GITHUB
    # =========================================================================
    story.append(Paragraph("5. Issues Prontas para o GitHub", h1_style))
    story.append(Paragraph(
        "Copie e cole os blocos abaixo diretamente na aba <b>Issues</b> do repositório GitHub para criar as tarefas com checklist verificável:",
        body_style
    ))
    story.append(Spacer(1, 6))

    issues_data = [
        {
            "num": 1,
            "title": "[Segurança] Corrigir RLS com políticas abertas USING (true) nas tabelas operacionais",
            "labels": "security, severidade:crítica",
            "desc": "As políticas RLS de profiles, students, coach_plans, student_workouts, bookings e device_registrations estão configuradas com FOR ALL USING (true). Qualquer cliente com a chave anônima (pública no frontend) pode ler, alterar e excluir dados de qualquer usuário ou treinador da academia.",
            "evidence": "supabase/schema.sql linhas 223-242; supabase/migrations/20260911000000_init.sql linhas 146-165.",
            "impact": "Vazamento em massa de dados confidenciais (LGPD), adulteração de treinos e exclusão maliciosa de agendamentos e cadastros.",
            "fix": "Reescrever as políticas RLS para checar `auth.uid() = user_id` em dados de alunos e vincular os acessos de treinadores estritamente ao seu perfil correspondente. Negar mutações diretas anônimas.",
            "criteria": [
                "[ ] SELECT na tabela 'students' retorna apenas os alunos vinculados ao coach_id do usuário autenticado",
                "[ ] SELECT na tabela 'bookings' restringe registros onde auth.uid() coincide com student_id ou coach_id",
                "[ ] Teste de mutação (UPDATE/DELETE) com cliente anon em registro alheio é rejeitado pelo PostgreSQL",
            ]
        },
        {
            "num": 2,
            "title": "[Segurança] Eliminar segredo criptográfico hardcoded VAULT_SALT e blindar autenticação do cofre",
            "labels": "security, severidade:crítica",
            "desc": "A constante VAULT_SALT = 'gymflow_vault_salt_2026' está hardcoded no repositório público GitHub. Qualquer atacante pode gerar tokens de sessão válidos no formato payload.signature usando HMAC-SHA256 e obter acesso irrestrito ao painel de administração em /admin-vault.",
            "evidence": "src/app/api/vault/verify/route.ts linhas 8-11; src/app/api/vault/session/route.ts linhas 7-8; src/lib/admin-vault.ts linhas 162-164.",
            "impact": "Bypass completo do cofre administrativo, permitindo exportar backup integral do banco, manipular alunos e alterar configurações globais.",
            "fix": "Mover VAULT_SALT para a variável de ambiente segura ADMIN_VAULT_SECRET. Armazenar a chave mestra exclusivamente em variável de ambiente (ADMIN_MASTER_KEY). Eliminar a validação ingênua baseada em presença de cookie sem validação de assinatura no cliente.",
            "criteria": [
                "[ ] Ausência de strings de segredo ou hash estático no código-fonte",
                "[ ] Cookie gymflow_vault_auth assinado com segredo oriundo de process.env",
                "[ ] Falsificação manual de cookie sem assinatura válida resulta em 401 imediato",
            ]
        },
        {
            "num": 3,
            "title": "[Segurança] Eliminar queries globais sem filtro de tenant no sincronizador de cache",
            "labels": "security, severidade:alta",
            "desc": "O carregamento de stores locais chama fetchStudentsFromSupabase() e fetchBookingsFromSupabase() sem passar parâmetros de identificação, solicitando todos os registros do banco e salvando-os no localStorage do visitante.",
            "evidence": "src/lib/workout-store.ts linha 396; src/lib/booking-store.ts linha 928; src/lib/supabase-service.ts linhas 20-24, 186-190.",
            "impact": "Exposição de dados cadastrais, telefones e rotinas de todos os alunos para qualquer usuário conectado ao aplicativo.",
            "fix": "Condicionar a sincronização de cache à presença de um currentUser autenticado e repassar obrigatoriamente o coach_id ou student_id.",
            "criteria": [
                "[ ] fetchStudentsFromSupabase só executa se coachId for uma string válida e não vazia",
                "[ ] Inspecionar localStorage no DevTools de um aluno e confirmar que nenhum dado de outros alunos é armazenado",
            ]
        },
        {
            "num": 4,
            "title": "[Segurança] Proteger endpoint /api/payment/check contra IDOR e usurpação de crédito",
            "labels": "security, severidade:alta",
            "desc": "A rota aceita o parâmetro userId via query string e aplica o crédito de 30 dias com base nele com prioridade sobre o external_reference. Um atacante pode informar o ID de pagamento de outra pessoa e passar seu próprio userId.",
            "evidence": "src/app/api/payment/check/route.ts linhas 32, 73-74, 125-151.",
            "impact": "Fraude financeira e roubo de tempo de assinatura entre contas.",
            "fix": "Extrair o usuário beneficiário estritamente de parsedRef.userId e exigir que o usuário chamador esteja autenticado na sessão Supabase correspondente.",
            "criteria": [
                "[ ] userId passado como query param não pode sobrescrever o dono do pagamento gravado no external_reference",
                "[ ] Chamadas sem sessão correspondente ou divergentes são rejeitadas com 403 Forbidden",
            ]
        },
        {
            "num": 5,
            "title": "[Segurança] Tornar validação de assinatura HMAC obrigatória no webhook do Mercado Pago",
            "labels": "security, severidade:média",
            "desc": "O webhook avalia a assinatura HMAC apenas se o cabeçalho x-signature for enviado. Caso omitido, o código segue fluxo sem validar autenticidade da notificação.",
            "evidence": "src/app/api/payment/webhook/route.ts linhas 45-60.",
            "impact": "Risco de spoofing de eventos e esgotamento do ledger de eventos de webhook.",
            "fix": "Rejeitar imediatamente com 401 Unauthorized qualquer requisição sem o header x-signature e sem chave de segredo configurada.",
            "criteria": [
                "[ ] POST em /api/payment/webhook sem header x-signature retorna HTTP 401",
                "[ ] POST com assinatura forjada retorna HTTP 401",
                "[ ] Notificações oficiais do Mercado Pago continuam sendo processadas com sucesso",
            ]
        }
    ]

    for issue in issues_data:
        if issue["num"] == 3:
            story.append(PageBreak())
        checklist_str = "<br/>".join(issue["criteria"])
        issue_text = (
            f"--- ISSUE {issue['num']} ---<br/>"
            f"<b>Título:</b> {issue['title']}<br/>"
            f"<b>Labels:</b> {issue['labels']}<br/><br/>"
            f"<b>Descrição do Problema & Explorabilidade:</b><br/>{issue['desc']}<br/><br/>"
            f"<b>Evidência Técnica:</b><br/>{issue['evidence']}<br/><br/>"
            f"<b>Impacto:</b><br/>{issue['impact']}<br/><br/>"
            f"<b>Sugestão de Correção:</b><br/>{issue['fix']}<br/><br/>"
            f"<b>Critérios de Aceite:</b><br/>{checklist_str}<br/>"
            f"--- FIM ISSUE {issue['num']} ---"
        )
        story.append(Paragraph(issue_text, issue_block))
        story.append(Spacer(1, 3))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[OK] Relatorio PDF gerado com sucesso em: {OUTPUT_PDF}")

if __name__ == "__main__":
    create_report()
