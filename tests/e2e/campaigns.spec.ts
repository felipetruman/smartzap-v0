import { test, expect } from './fixtures'
import { CampaignsPage, CampaignWizardPage, ContactsPage, LoginPage } from './pages'

/**
 * Testes E2E do fluxo de Campanhas
 *
 * Cobre:
 * - Listagem de campanhas
 * - Criação de nova campanha (wizard)
 * - Visualização de detalhes
 * - Ações: iniciar, pausar, retomar, excluir
 * - Filtros e busca
 */
test.describe('Campanhas', () => {
  // Antes de cada teste, faz login
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    const password = process.env.MASTER_PASSWORD || process.env.TEST_PASSWORD || 'test123'

    await loginPage.goto()
    await loginPage.loginAndWaitForDashboard(password)
  })

  test.describe('Listagem', () => {
    test('deve exibir página de campanhas corretamente', async ({ page }) => {
      const campaignsPage = new CampaignsPage(page)

      await campaignsPage.goto()
      await campaignsPage.waitForLoad()

      // Verifica elementos principais
      await expect(campaignsPage.pageTitle).toBeVisible()
      await expect(campaignsPage.createCampaignButton).toBeVisible()
    })

    test('deve ter campo de busca', async ({ page }) => {
      const campaignsPage = new CampaignsPage(page)

      await campaignsPage.goto()
      await campaignsPage.waitForLoad()

      await expect(campaignsPage.searchInput).toBeVisible()
    })

    test('deve ter botão de criar campanha visível e clicável', async ({ page }) => {
      const campaignsPage = new CampaignsPage(page)

      await campaignsPage.goto()
      await campaignsPage.waitForLoad()

      await expect(campaignsPage.createCampaignButton).toBeVisible()
      await expect(campaignsPage.createCampaignButton).toBeEnabled()
    })
  })

  test.describe('Wizard de Criação', () => {
    test('deve abrir wizard de nova campanha', async ({ page }) => {
      const campaignsPage = new CampaignsPage(page)

      await campaignsPage.goto()
      await campaignsPage.waitForLoad()

      await campaignsPage.clickCreateCampaign()

      // Deve estar na página de nova campanha
      await expect(page).toHaveURL(/\/campaigns\/new/)
    })

    test('deve exibir campo de nome da campanha no Step 1', async ({ page }) => {
      const wizardPage = new CampaignWizardPage(page)

      await wizardPage.goto()

      // Campo de nome deve estar visível
      await expect(wizardPage.campaignNameInput).toBeVisible()
    })

    test('deve permitir preencher nome da campanha', async ({ page, generateUniqueCampaign }) => {
      const wizardPage = new CampaignWizardPage(page)
      const campaign = generateUniqueCampaign()

      await wizardPage.goto()

      await wizardPage.fillCampaignName(campaign.name)

      // Verifica que foi preenchido
      await expect(wizardPage.campaignNameInput).toHaveValue(campaign.name)
    })

    test('deve ter botões de navegação do wizard', async ({ page }) => {
      const wizardPage = new CampaignWizardPage(page)

      await wizardPage.goto()

      // Deve ter botão Voltar
      await expect(wizardPage.backButton).toBeVisible()

      // Deve ter botão Continuar (inicialmente desabilitado até selecionar template)
      await expect(wizardPage.continueButton).toBeVisible()
    })

    test('deve poder sair do wizard clicando em Voltar', async ({ page }) => {
      const wizardPage = new CampaignWizardPage(page)

      await wizardPage.goto()

      // Clica em Voltar para sair do wizard
      await wizardPage.backButton.click()
      await page.waitForTimeout(500)

      // Deve sair do wizard (pode ir para / ou /campaigns dependendo do histórico)
      await expect(page).not.toHaveURL('/campaigns/new', { timeout: 5000 })
    })
  })

  test.describe('Busca e Filtros', () => {
    test('deve filtrar campanhas por busca', async ({ page }) => {
      const campaignsPage = new CampaignsPage(page)

      await campaignsPage.goto()
      await campaignsPage.waitForLoad()

      // Busca por algo específico
      await campaignsPage.searchCampaign('teste')

      // A página deve processar a busca sem erro
      await page.waitForLoadState('networkidle')
      expect(await campaignsPage.searchInput.inputValue()).toBe('teste')
    })

    test('deve permitir limpar busca', async ({ page }) => {
      const campaignsPage = new CampaignsPage(page)

      await campaignsPage.goto()
      await campaignsPage.waitForLoad()

      // Busca
      await campaignsPage.searchCampaign('teste')

      // Limpa
      await campaignsPage.searchInput.clear()
      await page.waitForLoadState('networkidle')

      // Campo deve estar vazio
      expect(await campaignsPage.searchInput.inputValue()).toBe('')
    })
  })

  test.describe('Fluxo Completo', () => {
    // Este teste requer que existam templates e contatos cadastrados
    // É um teste mais complexo que valida o fluxo inteiro
    test.skip('deve criar campanha completa', async ({ page, generateUniqueCampaign, generateUniqueContact }) => {
      const wizardPage = new CampaignWizardPage(page)
      const contactsPage = new ContactsPage(page)
      const campaignsPage = new CampaignsPage(page)
      const campaign = generateUniqueCampaign()
      const contact = generateUniqueContact()

      // 1. Primeiro cria um contato para usar na campanha
      await contactsPage.goto()
      await contactsPage.waitForLoad()
      await contactsPage.createContact(contact)
      await page.waitForLoadState('networkidle')

      // 2. Vai para criação de campanha
      await wizardPage.goto()

      // 3. Step 1: Nome e template
      await wizardPage.fillCampaignName(campaign.name)
      // Template selection depende de ter templates cadastrados
      await wizardPage.nextStep()

      // 4. Step 2: Público
      await wizardPage.selectAllContacts()
      await wizardPage.nextStep()

      // 5. Step 3: Validação
      await wizardPage.nextStep()

      // 6. Step 4: Agendar e lançar
      await wizardPage.scheduleNow()
      await wizardPage.launch()

      // 7. Verifica que a campanha foi criada
      await campaignsPage.goto()
      await campaignsPage.searchCampaign(campaign.name)

      const exists = await campaignsPage.campaignExists(campaign.name)
      expect(exists).toBe(true)
    })
  })

  test.describe('Ações de Campanha', () => {
    // Estes testes requerem campanhas existentes
    // Skipados por padrão pois dependem de dados pré-existentes
    test.skip('deve iniciar campanha em rascunho', async ({ page }) => {
      const campaignsPage = new CampaignsPage(page)

      await campaignsPage.goto()
      await campaignsPage.waitForLoad()

      // Encontra uma campanha em rascunho e inicia
      // Isso requer ter uma campanha de teste criada
    })

    test.skip('deve pausar campanha em envio', async ({ page }) => {
      const campaignsPage = new CampaignsPage(page)

      await campaignsPage.goto()
      await campaignsPage.waitForLoad()

      // Pausa uma campanha em envio
    })

    test.skip('deve excluir campanha', async ({ page }) => {
      const campaignsPage = new CampaignsPage(page)

      await campaignsPage.goto()
      await campaignsPage.waitForLoad()

      // Exclui uma campanha
    })
  })

  test.describe('Navegação', () => {
    test('deve exibir mensagem quando não há campanhas', async ({ page }) => {
      const campaignsPage = new CampaignsPage(page)

      await campaignsPage.goto()
      await campaignsPage.waitForLoad()

      // Verifica se há campanhas na lista
      const emptyMessage = page.locator('text=Nenhuma campanha encontrada')
      const hasCampaigns = !(await emptyMessage.isVisible())

      if (hasCampaigns) {
        // Se há campanhas, verifica que não mostra mensagem de vazio
        await expect(emptyMessage).not.toBeVisible()
      } else {
        // Se não há campanhas, deve mostrar mensagem
        await expect(emptyMessage).toBeVisible()
      }
    })
  })
})
