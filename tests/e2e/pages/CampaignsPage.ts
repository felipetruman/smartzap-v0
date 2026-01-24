import { Page, Locator, expect } from '@playwright/test'
import type { TestCampaign } from '../fixtures'

/**
 * Page Object para a página de Campanhas
 * Encapsula listagem, criação e ações de campanhas
 */
export class CampaignsPage {
  readonly page: Page

  // Header e ações principais
  readonly pageTitle: Locator
  readonly createCampaignButton: Locator

  // Busca e filtros
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly folderFilter: Locator
  readonly tagFilter: Locator

  // Lista de campanhas
  readonly campaignList: Locator
  readonly campaignCards: Locator

  // Paginação
  readonly nextPageButton: Locator
  readonly previousPageButton: Locator

  // Ações por campanha
  readonly startButton: Locator
  readonly pauseButton: Locator
  readonly resumeButton: Locator
  readonly duplicateButton: Locator
  readonly deleteButton: Locator

  // Modal de confirmação
  readonly confirmModal: Locator
  readonly confirmButton: Locator
  readonly cancelButton: Locator

  // Loading states
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page

    // Header
    this.pageTitle = page.getByRole('heading', { name: /campanhas/i })
    this.createCampaignButton = page.getByRole('button', { name: /criar campanha|nova campanha|\+/i })
      .or(page.getByRole('link', { name: /criar campanha|nova campanha/i }))

    // Busca e filtros
    this.searchInput = page.getByPlaceholder(/buscar/i)
    this.statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status|todos/i })
    this.folderFilter = page.locator('select, [role="combobox"]').filter({ hasText: /pasta|folder/i })
    this.tagFilter = page.locator('select, [role="combobox"]').filter({ hasText: /tags/i })

    // Lista
    this.campaignList = page.locator('[role="list"], table, .grid')
    this.campaignCards = page.locator('[role="listitem"], tr, .campaign-card')

    // Paginação
    this.nextPageButton = page.getByRole('button', { name: /próxim|next|>/i })
    this.previousPageButton = page.getByRole('button', { name: /anterior|prev|</i })

    // Ações (ícones na linha da campanha)
    this.startButton = page.locator('button[title*="Iniciar"], button:has(svg)')
    this.pauseButton = page.locator('button[title*="Pausar"]')
    this.resumeButton = page.locator('button[title*="Retomar"]')
    this.duplicateButton = page.locator('button[title*="Clonar"], button[title*="Duplicar"]')
    this.deleteButton = page.locator('button[title*="Excluir"]')

    // Modal
    this.confirmModal = page.locator('[role="dialog"]')
    this.confirmButton = page.getByRole('button', { name: /confirmar|sim|ok/i })
    this.cancelButton = page.getByRole('button', { name: /cancelar|não/i })

    // Loading
    this.loadingSpinner = page.locator('.animate-spin, [role="status"]')
  }

  /**
   * Navega para a página de campanhas
   */
  async goto(): Promise<void> {
    await this.page.goto('/campaigns')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Clica para criar nova campanha
   */
  async clickCreateCampaign(): Promise<void> {
    await this.createCampaignButton.click()
    await expect(this.page).toHaveURL(/\/campaigns\/new/, { timeout: 5000 })
  }

  /**
   * Busca campanhas por nome
   */
  async searchCampaign(query: string): Promise<void> {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(500) // Debounce
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Filtra por status
   */
  async filterByStatus(status: 'Todos' | 'Rascunho' | 'Agendado' | 'Enviando' | 'Concluído' | 'Pausado' | 'Falhou'): Promise<void> {
    await this.statusFilter.click()
    await this.page.getByRole('option', { name: status }).click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Verifica se uma campanha existe na lista
   */
  async campaignExists(name: string): Promise<boolean> {
    const campaign = this.page.locator('text=' + name)
    return await campaign.count() > 0
  }

  /**
   * Obtém contagem de campanhas na lista
   */
  async getCampaignCount(): Promise<number> {
    await this.page.waitForLoadState('networkidle')
    return await this.campaignCards.count()
  }

  /**
   * Clica em uma campanha para ver detalhes
   */
  async openCampaign(name: string): Promise<void> {
    const campaignRow = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    await campaignRow.click()
    await expect(this.page).toHaveURL(/\/campaigns\/[a-z0-9-]+/, { timeout: 5000 })
  }

  /**
   * Inicia uma campanha (muda de DRAFT para SENDING)
   */
  async startCampaign(name: string): Promise<void> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const startBtn = row.locator('button[title*="Iniciar"]')
    await startBtn.click()

    // Pode ter confirmação
    if (await this.confirmModal.isVisible()) {
      await this.confirmButton.click()
    }
  }

  /**
   * Pausa uma campanha em envio
   */
  async pauseCampaign(name: string): Promise<void> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const pauseBtn = row.locator('button[title*="Pausar"]')
    await pauseBtn.click()

    if (await this.confirmModal.isVisible()) {
      await this.confirmButton.click()
    }
  }

  /**
   * Retoma uma campanha pausada
   */
  async resumeCampaign(name: string): Promise<void> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const resumeBtn = row.locator('button[title*="Retomar"]')
    await resumeBtn.click()

    if (await this.confirmModal.isVisible()) {
      await this.confirmButton.click()
    }
  }

  /**
   * Duplica uma campanha
   */
  async duplicateCampaign(name: string): Promise<void> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const duplicateBtn = row.locator('button[title*="Clonar"], button[title*="Duplicar"]')
    await duplicateBtn.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Exclui uma campanha
   */
  async deleteCampaign(name: string): Promise<void> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const deleteBtn = row.locator('button[title*="Excluir"]')
    await deleteBtn.click()

    await this.confirmModal.waitFor({ state: 'visible' })
    await this.confirmButton.click()
    await this.confirmModal.waitFor({ state: 'hidden' })
  }

  /**
   * Obtém o status de uma campanha
   */
  async getCampaignStatus(name: string): Promise<string | null> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const statusBadge = row.locator('.badge, [class*="badge"]')
    return await statusBadge.textContent()
  }

  /**
   * Aguarda lista carregar
   */
  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible' })
    await this.page.waitForLoadState('networkidle')
  }
}

/**
 * Page Object para o wizard de criação de campanha
 * Atualizado baseado na UI real do SmartZap
 *
 * O wizard tem 4 steps:
 * 1. Configuração - Nome, objetivo e template
 * 2. Público - Seleção de contatos
 * 3. Validação - Revisão de avisos
 * 4. Agendamento - Data/hora de envio
 */
export class CampaignWizardPage {
  readonly page: Page

  // Título
  readonly pageTitle: Locator

  // Stepper (navegação por steps)
  readonly step1Button: Locator
  readonly step2Button: Locator
  readonly step3Button: Locator
  readonly step4Button: Locator

  // Navegação (rodapé)
  readonly backButton: Locator
  readonly continueButton: Locator
  readonly stepMessage: Locator

  // Step 1: Configuração
  readonly campaignNameInput: Locator
  readonly objectiveSelect: Locator
  readonly templateSearchInput: Locator
  readonly templateButtons: Locator
  readonly viewAllTemplatesButton: Locator

  // Sidebar
  readonly summarySection: Locator
  readonly previewSection: Locator
  readonly quickCampaignButton: Locator

  constructor(page: Page) {
    this.page = page

    // Título
    this.pageTitle = page.getByRole('heading', { name: 'Criar Campanha', level: 1 })

    // Stepper - os botões dos steps
    this.step1Button = page.getByRole('button', { name: /1.*Configuração/i })
    this.step2Button = page.getByRole('button', { name: /2.*Público/i })
    this.step3Button = page.getByRole('button', { name: /3.*Validação/i })
    this.step4Button = page.getByRole('button', { name: /4.*Agendamento/i })

    // Navegação no rodapé
    this.backButton = page.getByRole('button', { name: 'Voltar', exact: true })
    this.continueButton = page.getByRole('button', { name: 'Continuar', exact: true })
    this.stepMessage = page.locator('text=Selecione um template para continuar')

    // Step 1: Configuração
    this.campaignNameInput = page.getByRole('textbox', { name: 'Nome da campanha' })
    this.objectiveSelect = page.getByRole('combobox', { name: 'Objetivo da campanha' })
    this.templateSearchInput = page.getByRole('textbox', { name: /Digite o nome do template/i })
    this.templateButtons = page.locator('button').filter({ hasText: /UTILIDADE|MARKETING|AUTENTICACAO/i })
    this.viewAllTemplatesButton = page.getByRole('button', { name: 'Ver todos os templates' })

    // Sidebar
    this.summarySection = page.locator('text=Resumo').locator('xpath=../..')
    this.previewSection = page.locator('text=Preview').locator('xpath=../..')
    this.quickCampaignButton = page.getByRole('button', { name: 'Campanha Rapida' })
  }

  /**
   * Navega para criação de nova campanha
   */
  async goto(): Promise<void> {
    await this.page.goto('/campaigns/new')
    await this.waitForLoad()
  }

  /**
   * Aguarda o wizard carregar
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 })
  }

  /**
   * Verifica se o wizard está visível
   */
  async isVisible(): Promise<boolean> {
    return this.page.url().includes('/campaigns/new')
  }

  /**
   * Preenche o nome da campanha (Step 1)
   */
  async fillCampaignName(name: string): Promise<void> {
    await this.campaignNameInput.clear()
    await this.campaignNameInput.fill(name)
  }

  /**
   * Seleciona um template por nome (Step 1)
   */
  async selectTemplate(templateName: string): Promise<void> {
    const templateButton = this.templateButtons.filter({ hasText: templateName }).first()
    await templateButton.click()
    // Aguarda o botão Continuar ficar habilitado
    await expect(this.continueButton).toBeEnabled({ timeout: 3000 })
  }

  /**
   * Seleciona o primeiro template disponível
   */
  async selectFirstTemplate(): Promise<void> {
    await this.templateButtons.first().click()
    await expect(this.continueButton).toBeEnabled({ timeout: 3000 })
  }

  /**
   * Avança para o próximo step
   */
  async nextStep(): Promise<void> {
    await expect(this.continueButton).toBeEnabled({ timeout: 5000 })
    await this.continueButton.click()
    await this.page.waitForTimeout(500) // Aguarda animação
  }

  /**
   * Volta para o step anterior
   */
  async previousStep(): Promise<void> {
    await this.backButton.click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Volta para a página anterior (clica em Voltar no step 1)
   * Pode ir para /campaigns ou / dependendo do histórico de navegação
   */
  async goBack(): Promise<void> {
    await this.backButton.click()
    // Aguarda sair do wizard
    await expect(this.page).not.toHaveURL('/campaigns/new', { timeout: 5000 })
  }

  /**
   * Verifica qual step está ativo (1-4)
   */
  async getCurrentStep(): Promise<number> {
    // O step ativo não está desabilitado
    if (await this.step1Button.isEnabled() && !(await this.step2Button.isEnabled())) return 1
    if (await this.step2Button.isEnabled() && !(await this.step3Button.isEnabled())) return 2
    if (await this.step3Button.isEnabled() && !(await this.step4Button.isEnabled())) return 3
    if (await this.step4Button.isEnabled()) return 4
    return 1
  }

  /**
   * Verifica se o botão Continuar está habilitado
   */
  async isContinueEnabled(): Promise<boolean> {
    return await this.continueButton.isEnabled()
  }

  /**
   * Obtém a mensagem de status do step atual
   */
  async getStepMessage(): Promise<string | null> {
    try {
      return await this.stepMessage.textContent()
    } catch {
      return null
    }
  }
}
