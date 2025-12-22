'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Braces, Eye, MessageSquare, Plus, Sparkles, Users } from 'lucide-react'
import { CustomFieldsSheet } from '@/components/features/contacts/CustomFieldsSheet'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const steps = [
  { id: 1, label: 'Configuracao' },
  { id: 2, label: 'Publico' },
  { id: 3, label: 'Revisao' },
]

type TemplateComponent = {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: string
  text?: string
  buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>
}

type Template = {
  id?: string
  name: string
  category?: string
  language?: string
  status?: string
  preview?: string
  content?: string
  components?: TemplateComponent[]
  parameterFormat?: 'positional' | 'named'
}

type Contact = {
  id: string
  name: string
  phone: string
  email?: string | null
  custom_fields?: Record<string, unknown>
}

type CustomField = {
  key: string
  label: string
  type: string
}

type ContactStats = {
  total: number
  optIn: number
  optOut: number
}

type CountryCount = {
  code: string
  count: number
}

type StateCount = {
  code: string
  count: number
}

type TestContact = {
  name?: string
  phone?: string
}

type TemplateVar = {
  id: string
  value: string
  required: boolean
}

const fetchJson = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || 'Erro ao buscar dados')
  }
  return res.json()
}

export default function CampaignsNewRealPage() {
  const [step, setStep] = useState(1)
  const [audienceMode, setAudienceMode] = useState('todos')
  const [combineMode, setCombineMode] = useState('or')
  const [collapseAudienceChoice, setCollapseAudienceChoice] = useState(false)
  const [collapseQuickSegments, setCollapseQuickSegments] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [testContactSearch, setTestContactSearch] = useState('')
  const [selectedTestContact, setSelectedTestContact] = useState<Contact | null>(null)
  const [configuredContact, setConfiguredContact] = useState<Contact | null>(null)
  const [sendToConfigured, setSendToConfigured] = useState(true)
  const [sendToSelected, setSendToSelected] = useState(false)
  const [templateSelected, setTemplateSelected] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [showAllTemplates, setShowAllTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [scheduleMode, setScheduleMode] = useState('imediato')
  const [isFieldsSheetOpen, setIsFieldsSheetOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [templateVars, setTemplateVars] = useState<{ header: TemplateVar[]; body: TemplateVar[] }>({
    header: [],
    body: [],
  })
  const [campaignName, setCampaignName] = useState(() => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const month = months[now.getMonth()] || 'mes'
    return `Campanha ${day} de ${month}.`
  })
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({})
  const [showStatesPanel, setShowStatesPanel] = useState(false)
  const [stateSearch, setStateSearch] = useState('')

  useEffect(() => {
    if (combineMode !== 'and') return
    setSelectedCountries((prev) => (prev.length > 1 ? [prev[prev.length - 1]] : prev))
    setSelectedStates((prev) => (prev.length > 1 ? [prev[prev.length - 1]] : prev))
  }, [combineMode])

  useEffect(() => {
    if (!selectedStates.length) return
    if (selectedCountries.includes('BR')) return
    setSelectedStates([])
  }, [selectedCountries, selectedStates])

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const local = await fetchJson<Template[]>('/api/templates?source=local').catch(() => [])
      if (Array.isArray(local) && local.length) return local
      return fetchJson<Template[]>('/api/templates')
    },
    staleTime: 30_000,
  })

  const customFieldsQuery = useQuery({
    queryKey: ['custom-fields', 'contact'],
    queryFn: () => fetchJson<CustomField[]>('/api/custom-fields?entityType=contact'),
    staleTime: 60_000,
  })

  const tagsQuery = useQuery({
    queryKey: ['contact-tags'],
    queryFn: () => fetchJson<string[]>('/api/contacts/tags'),
    staleTime: 60_000,
  })

  const statsQuery = useQuery({
    queryKey: ['contact-stats'],
    queryFn: () => fetchJson<ContactStats>('/api/contacts/stats'),
    staleTime: 30_000,
  })

  const countriesQuery = useQuery({
    queryKey: ['contact-country-codes'],
    queryFn: () => fetchJson<{ data: CountryCount[] }>('/api/contacts/country-codes'),
    staleTime: 60_000,
  })

  const statesQuery = useQuery({
    queryKey: ['contact-state-codes'],
    queryFn: () => fetchJson<{ data: StateCount[] }>('/api/contacts/state-codes'),
    staleTime: 60_000,
  })

  const testContactQuery = useQuery({
    queryKey: ['test-contact'],
    queryFn: () => fetchJson<TestContact | null>('/api/settings/test-contact'),
    staleTime: 30_000,
  })

  const contactSearchQuery = useQuery({
    queryKey: ['contacts-search', testContactSearch],
    queryFn: async () => {
      const res = await fetchJson<{ data: Contact[] }>('/api/contacts?limit=5&search=' + encodeURIComponent(testContactSearch))
      return res.data || []
    },
    enabled: testContactSearch.trim().length >= 2,
    staleTime: 10_000,
  })

  const segmentCountQuery = useQuery({
    queryKey: ['segment-count', combineMode, selectedTags, selectedCountries, selectedStates],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('combine', combineMode)
      if (selectedTags.length) params.set('tags', selectedTags.join(','))
      if (selectedCountries.length) params.set('countries', selectedCountries.join(','))
      if (selectedStates.length) params.set('states', selectedStates.join(','))
      return fetchJson<{ total: number; matched: number }>(`/api/contacts/segment-count?${params.toString()}`)
    },
    enabled: audienceMode === 'segmentos',
    staleTime: 10_000,
  })

  const contactSearchResults = contactSearchQuery.data || []
  const displayTestContacts = useMemo(() => {
    if (!selectedTestContact) return contactSearchResults
    const others = contactSearchResults.filter((contact) => contact.id !== selectedTestContact.id)
    return [selectedTestContact, ...others]
  }, [contactSearchResults, selectedTestContact])

  const configuredName = testContactQuery.data?.name?.trim() || configuredContact?.name || ''
  const configuredPhone = testContactQuery.data?.phone?.trim() || configuredContact?.phone || ''
  const hasConfiguredContact = Boolean(configuredPhone)
  const configuredLabel = configuredPhone
    ? [configuredName || 'Contato de teste', configuredPhone].filter(Boolean).join(' - ')
    : 'Defina um telefone de teste'

  const allTemplates = templatesQuery.data || []
  const templateOptions = allTemplates.filter(
    (template) => String(template.status || '').toUpperCase() === 'APPROVED'
  )
  const customFields = customFieldsQuery.data || []
  const customFieldKeys = customFields.map((field) => field.key)
  const recentTemplates = useMemo(() => templateOptions.slice(0, 3), [templateOptions])
  const recommendedTemplates = useMemo(() => templateOptions.slice(3, 6), [templateOptions])
  const filteredTemplates = useMemo(() => {
    const term = templateSearch.trim().toLowerCase()
    if (!term) return templateOptions
    return templateOptions.filter((template) => template.name.toLowerCase().includes(term))
  }, [templateOptions, templateSearch])

  useEffect(() => {
    if (!selectedTemplate) return
    if (!templateOptions.some((template) => template.name === selectedTemplate.name)) {
      setSelectedTemplate(null)
      setTemplateSelected(false)
    }
  }, [selectedTemplate, templateOptions])

  useEffect(() => {
    const phone = testContactQuery.data?.phone
    if (!phone) {
      setConfiguredContact(null)
      return
    }
    const controller = new AbortController()
    fetch('/api/contacts?limit=1&search=' + encodeURIComponent(phone), { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const contact = payload?.data?.[0]
        if (contact) setConfiguredContact(contact)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [testContactQuery.data?.phone])

  useEffect(() => {
    const tags = (tagsQuery.data || []).slice(0, 6)
    if (!tags.length) return
    let cancelled = false
    Promise.all(
      tags.map(async (tag) => {
        const res = await fetchJson<{ total: number }>('/api/contacts?limit=1&tag=' + encodeURIComponent(tag))
        return [tag, res.total ?? 0] as const
      })
    ).then((pairs) => {
      if (cancelled) return
      const next: Record<string, number> = {}
      pairs.forEach(([tag, total]) => {
        next[tag] = total
      })
      setTagCounts(next)
    })
    return () => {
      cancelled = true
    }
  }, [tagsQuery.data])

  const contactFields = [
    { key: 'nome', label: 'Nome' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'email', label: 'Email' },
  ]
  const sampleValues = useMemo(() => {
    const preferredContact = sendToSelected && selectedTestContact ? selectedTestContact : configuredContact
    const base = {
      nome: preferredContact?.name || configuredContact?.name || testContactQuery.data?.name || 'Contato',
      telefone:
        preferredContact?.phone ||
        configuredContact?.phone ||
        testContactQuery.data?.phone ||
        '+55 11 99999-0001',
      email: preferredContact?.email || 'contato@smartzap.com',
    } as Record<string, string>
    customFieldKeys.forEach((key) => {
      base[key] = base[key] || 'valor'
    })
    return base
  }, [
    configuredContact,
    customFieldKeys,
    selectedTestContact,
    sendToSelected,
    testContactQuery.data?.name,
    testContactQuery.data?.phone,
  ])

  const resolveValue = (key: string | undefined) => {
    if (!key) return ''
    return sampleValues[key] ?? key
  }

  const selectedTestCount =
    Number(Boolean(sendToConfigured && hasConfiguredContact)) + Number(Boolean(sendToSelected && selectedTestContact))

  const baseCount = statsQuery.data?.total ?? 0
  const segmentEstimate = segmentCountQuery.data?.matched ?? baseCount
  const audienceCount =
    audienceMode === 'todos' ? baseCount : audienceMode === 'segmentos' ? segmentEstimate : selectedTestCount
  const audienceCost = audienceMode === 'teste' ? 0 : Number((audienceCount * 0.0375).toFixed(2))
  const isSegmentCountLoading = audienceMode === 'segmentos' && segmentCountQuery.isFetching
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`
  const formattedAudienceCount = audienceMode === 'teste' ? selectedTestCount : audienceCount
  const displayAudienceCount = isSegmentCountLoading ? 'Calculando...' : String(formattedAudienceCount)
  const displayAudienceCost = isSegmentCountLoading ? '—' : formatCurrency(audienceCost)
  const footerSummary =
    audienceMode === 'teste'
      ? `${selectedTestCount || 0} contato${selectedTestCount === 1 ? '' : 's'} de teste`
      : isSegmentCountLoading
        ? 'Calculando estimativa...'
        : `${audienceCount} contatos • ${formatCurrency(audienceCost)}`
  const missingTemplateVars = [...templateVars.header, ...templateVars.body].filter(
    (item) => item.required && !item.value.trim()
  ).length
  const isConfigComplete = Boolean(campaignName.trim()) && templateSelected && missingTemplateVars === 0
  const isAudienceComplete = audienceMode === 'teste' ? selectedTestCount > 0 : audienceCount > 0
  const isReviewComplete =
    scheduleMode !== 'agendar' || (scheduleDate.trim().length > 0 && scheduleTime.trim().length > 0)
  const canContinue = step === 1 ? isConfigComplete : step === 2 ? isAudienceComplete : isReviewComplete
  const scheduleLabel = scheduleMode === 'agendar' ? 'Agendado' : 'Imediato'
  const combineModeLabel = combineMode === 'or' ? 'Mais alcance' : 'Mais preciso'
  const combineFilters = [...selectedTags, ...selectedCountries, ...selectedStates]
  const combinePreview = combineFilters.length
    ? combineFilters.join(' • ')
    : 'Nenhum filtro selecionado'
  const activeTemplate = previewTemplate ?? (templateSelected ? selectedTemplate : null)
  const resolveTemplateValue = (value: string) => {
    if (!value) return ''
    const match = value.match(/^\{\{(.+)\}\}$/)
    if (!match) return value
    const rawKey = match[1].trim()
    const normalized = rawKey.startsWith('contact.') ? rawKey.slice(8) : rawKey
    const mapped =
      normalized === 'name'
        ? 'nome'
        : normalized === 'phone'
          ? 'telefone'
          : normalized === 'email'
            ? 'email'
            : normalized
    return resolveValue(mapped)
  }
  const renderTemplatePreview = (text: string) => {
    let output = text || ''
    const vars = [...templateVars.header, ...templateVars.body]
    vars.forEach((variable) => {
      output = output.replaceAll(variable.id, resolveTemplateValue(variable.value))
    })
    return output.replaceAll('#{pedido}', '#12345')
  }

  const countryData = countriesQuery.data?.data || []
  const stateData = statesQuery.data?.data || []
  const tagChips = (tagsQuery.data || []).slice(0, 6)
  const countryChips = countryData.map((item) => item.code)
  const stateChips = stateData.map((item) => item.code)
  const countryCounts = useMemo(() => {
    const next: Record<string, number> = {}
    countryData.forEach((item) => {
      next[item.code] = item.count
    })
    return next
  }, [countryData])
  const stateCounts = useMemo(() => {
    const next: Record<string, number> = {}
    stateData.forEach((item) => {
      next[item.code] = item.count
    })
    return next
  }, [stateData])
  const isBrSelected = selectedCountries.includes('BR')
  const stateChipsToShow = stateChips.slice(0, 3)
  const hiddenStateCount = Math.max(0, stateChips.length - stateChipsToShow.length)
  const stateSearchTerm = stateSearch.trim().toLowerCase()
  const filteredStates = stateData.filter((item) =>
    stateSearchTerm ? item.code.toLowerCase().includes(stateSearchTerm) : true
  )
  const toggleSelection = (value: string, current: string[], setCurrent: (next: string[]) => void) => {
    setCurrent(current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  useEffect(() => {
    if (!selectedTemplate) return
    const components = selectedTemplate.components || []
    const headerText =
      components.find((component) => component.type === 'HEADER')?.text || ''
    const bodyText =
      components.find((component) => component.type === 'BODY')?.text ||
      selectedTemplate.content ||
      selectedTemplate.preview ||
      ''

    const extractTokens = (text: string) => {
      const matches = text.match(/\{\{[^}]+\}\}/g) || []
      const unique: string[] = []
      matches.forEach((token) => {
        if (!unique.includes(token)) unique.push(token)
      })
      return unique
    }

    const mapTokens = (tokens: string[]) =>
      tokens.map((token) => ({
        id: token,
        value: '',
        required: true,
      }))

    setTemplateVars({
      header: mapTokens(extractTokens(headerText)),
      body: mapTokens(extractTokens(bodyText)),
    })
  }, [selectedTemplate?.name, selectedTemplate?.preview, selectedTemplate?.content, customFieldKeys.join(',')])

  const setTemplateVarValue = (section: 'header' | 'body', index: number, value: string) => {
    setTemplateVars((prev) => {
      const next = { ...prev, [section]: [...prev[section]] }
      next[section][index] = { ...next[section][index], value }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs text-gray-500">App / Campanhas / Novo</div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-white">Criar Campanha</h1>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-gray-400">
              mock redesign
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Fluxo simplificado: uma decisao por vez, com contexto sempre visivel.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-right text-sm text-gray-500 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          Custo estimado:{' '}
          <span className="font-semibold text-emerald-400">{displayAudienceCost}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {steps.map((item) => {
              const isStepEnabled =
                item.id === 1 ||
                (item.id === 2 && isConfigComplete) ||
                (item.id === 3 && isConfigComplete && isAudienceComplete)
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!isStepEnabled}
                  onClick={() => {
                    if (!isStepEnabled) return
                    setStep(item.id)
                  }}
                  title={
                    isStepEnabled
                      ? undefined
                      : item.id === 2
                        ? 'Complete a configuracao para avancar'
                        : 'Complete configuracao e publico para avancar'
                  }
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    step === item.id
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-white'
                      : 'border-white/10 bg-zinc-900/40 text-gray-400'
                  } ${!isStepEnabled ? 'cursor-not-allowed opacity-40' : 'hover:text-white'}`}
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold ${
                      step === item.id
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/10 text-gray-400'
                    }`}
                  >
                    {item.id}
                  </span>
                  <span className="text-xs uppercase tracking-widest">{item.label}</span>
                </button>
              )
            })}
          </div>
          {step === 1 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-5 py-3 shadow-[0_10px_26px_rgba(0,0,0,0.3)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <input
                    className="w-full flex-1 rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-1.5 text-sm text-white placeholder:text-gray-600"
                    placeholder="Nome da campanha"
                    value={campaignName}
                    onChange={(event) => setCampaignName(event.target.value)}
                    aria-label="Nome da campanha"
                  />
                  <div className="relative w-full lg:w-[180px]">
                    <select
                      className="w-full appearance-none rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-1.5 pr-9 text-sm text-white"
                      aria-label="Objetivo da campanha"
                    >
                      <option>Utilidade</option>
                      <option>Marketing</option>
                      <option>Suporte</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base text-emerald-200">
                      ▾
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-2xl border border-white/10 bg-zinc-900/40 shadow-[0_10px_26px_rgba(0,0,0,0.3)] ${
                  templateSelected ? 'px-6 py-4' : 'p-6'
                }`}
              >
                {templateSelected ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-2 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/40 text-[10px] text-emerald-300">
                          ✓
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-white">{selectedTemplate?.name}</span>
                          {selectedTemplate?.category && (
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                              {selectedTemplate.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateSelected(false)
                          setPreviewTemplate(null)
                        }}
                        className="text-xs text-emerald-400/80 hover:text-emerald-300"
                      >
                        Trocar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-white">Template</h2>
                      <p className="text-sm text-gray-500">Busque e escolha o template da campanha.</p>
                    </div>

                    <div className="mt-5">
                      <label className="text-xs uppercase tracking-widest text-gray-500">Buscar template</label>
                      <input
                        className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white placeholder:text-gray-600"
                        placeholder="Digite o nome do template..."
                        value={templateSearch}
                        onChange={(event) => setTemplateSearch(event.target.value)}
                      />
                      {templatesQuery.isLoading && (
                        <div className="mt-2 text-xs text-gray-500">Carregando templates...</div>
                      )}
                      {templatesQuery.isError && (
                        <div className="mt-2 text-xs text-amber-300">
                          Falha ao carregar templates. Verifique as credenciais.
                        </div>
                      )}
                      {!templatesQuery.isLoading && !templatesQuery.isError && templateOptions.length === 0 && (
                        <div className="mt-2 text-xs text-amber-300">Nenhum template aprovado encontrado.</div>
                      )}
                    </div>

                    {showAllTemplates ? (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs uppercase tracking-widest text-gray-500">Todos os templates</div>
                          <button
                            type="button"
                            onClick={() => setShowAllTemplates(false)}
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            Voltar para recentes
                          </button>
                        </div>
                        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-2 text-sm">
                          {filteredTemplates.map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              onMouseEnter={() => setPreviewTemplate(template)}
                              onMouseLeave={() => setPreviewTemplate(null)}
                              onClick={() => {
                                setSelectedTemplate(template)
                                setTemplateSelected(true)
                                setPreviewTemplate(null)
                              }}
                              className="w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-left text-gray-300 hover:border-emerald-400/40"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-white">{template.name}</span>
                                <span className="text-[10px] uppercase text-gray-500">{template.category}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
                            <div className="text-xs uppercase tracking-widest text-gray-500">Recentes</div>
                            <div className="mt-3 space-y-2 text-sm">
                              {recentTemplates.map((template) => (
                                <button
                                  key={template.id}
                                  type="button"
                                  onMouseEnter={() => setPreviewTemplate(template)}
                                  onMouseLeave={() => setPreviewTemplate(null)}
                                  onClick={() => {
                                    setSelectedTemplate(template)
                                    setTemplateSelected(true)
                                    setPreviewTemplate(null)
                                  }}
                                  className="w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-left text-gray-300 hover:border-emerald-400/40"
                                >
                                  <div className="font-semibold text-white">{template.name}</div>
                                  <div className="mt-1 text-xs text-gray-500">{template.category}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
                            <div className="text-xs uppercase tracking-widest text-gray-500">Recomendados</div>
                            <div className="mt-3 space-y-2 text-sm">
                              {recommendedTemplates.map((template) => (
                                <button
                                  key={template.id}
                                  type="button"
                                  onMouseEnter={() => setPreviewTemplate(template)}
                                  onMouseLeave={() => setPreviewTemplate(null)}
                                  onClick={() => {
                                    setSelectedTemplate(template)
                                    setTemplateSelected(true)
                                    setPreviewTemplate(null)
                                  }}
                                  className="w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-left text-gray-300 hover:border-emerald-400/40"
                                >
                                  <div className="font-semibold text-white">{template.name}</div>
                                  <div className="mt-1 text-xs text-gray-500">{template.category}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAllTemplates(true)}
                          className="mt-4 text-xs text-emerald-300"
                        >
                          Ver todos os templates
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              {templateSelected && (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Variaveis do Template</h2>
                      <p className="text-sm text-gray-500">
                        Preencha os valores que serao usados neste template. Esses valores serao iguais para todos os destinatarios.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-5">
                    {templateVars.header.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
                          <Eye size={14} />
                          <span>Variaveis do cabecalho</span>
                        </div>
                      <div className="space-y-3">
                          {templateVars.header.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <span className="rounded-lg bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
                                {item.id}
                              </span>
                              <div className="relative flex flex-1 items-center">
                                <input
                                  value={item.value}
                                  onChange={(event) => setTemplateVarValue('header', index, event.target.value)}
                                  placeholder={`Variavel do cabecalho (${item.id})`}
                                  className={`w-full rounded-xl border bg-zinc-950/40 px-4 py-2 pr-10 text-sm text-white placeholder:text-gray-600 ${
                                    !item.value.trim() && item.required
                                      ? 'border-amber-400/40'
                                      : 'border-white/10'
                                  }`}
                                />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-300"
                                    >
                                      <Braces size={14} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="min-w-52 border border-white/10 bg-zinc-900 text-white"
                                  >
                                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-gray-500">
                                      Dados do contato
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onSelect={() => setTemplateVarValue('header', index, '{{nome}}')}
                                      className="flex items-center gap-2"
                                    >
                                      <Users size={14} className="text-indigo-400" />
                                      <span>Nome</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() => setTemplateVarValue('header', index, '{{telefone}}')}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="text-green-400 font-mono text-[10px] w-3.5 text-center">Ph</div>
                                      <span>Telefone</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() => setTemplateVarValue('header', index, '{{email}}')}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="text-blue-400 font-mono text-[10px] w-3.5 text-center">@</div>
                                      <span>Email</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    {customFields.length > 0 && (
                                      <>
                                        <DropdownMenuLabel className="text-xs uppercase tracking-widest text-gray-500">
                                          Campos personalizados
                                        </DropdownMenuLabel>
                                        {customFields.map((field) => (
                                          <DropdownMenuItem
                                            key={field.key}
                                            onSelect={() => setTemplateVarValue('header', index, `{{${field.key}}}`)}
                                            className="flex items-center gap-2"
                                          >
                                            <div className="text-amber-400 font-mono text-[10px] w-3.5 text-center">#</div>
                                            <span>{field.label || field.key}</span>
                                          </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator className="bg-white/10" />
                                      </>
                                    )}
                                    <DropdownMenuItem
                                      onSelect={() => setIsFieldsSheetOpen(true)}
                                      className="text-xs text-amber-400"
                                    >
                                      <Plus size={12} /> Gerenciar campos
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {item.required && <span className="text-xs text-amber-300">obrigatorio</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {templateVars.body.length > 0 && (
                      <div className="space-y-3 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
                          <MessageSquare size={14} />
                          <span>Variaveis do corpo</span>
                        </div>
                        <div className="space-y-3">
                          {templateVars.body.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="flex items-center gap-3">
                              <span className="rounded-lg bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
                                {item.id}
                              </span>
                              <div className="relative flex flex-1 items-center">
                                <input
                                  value={item.value}
                                  onChange={(event) => setTemplateVarValue('body', index, event.target.value)}
                                  placeholder={`Variavel do corpo (${item.id})`}
                                  className={`w-full rounded-xl border bg-zinc-950/40 px-4 py-2 pr-10 text-sm text-white placeholder:text-gray-600 ${
                                    !item.value.trim() && item.required
                                      ? 'border-amber-400/40'
                                      : 'border-white/10'
                                  }`}
                                />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-300"
                                    >
                                      <Braces size={14} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="min-w-52 border border-white/10 bg-zinc-900 text-white"
                                  >
                                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-gray-500">
                                      Dados do contato
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onSelect={() => setTemplateVarValue('body', index, '{{nome}}')}
                                      className="flex items-center gap-2"
                                    >
                                      <Users size={14} className="text-indigo-400" />
                                      <span>Nome</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() => setTemplateVarValue('body', index, '{{telefone}}')}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="text-green-400 font-mono text-[10px] w-3.5 text-center">Ph</div>
                                      <span>Telefone</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() => setTemplateVarValue('body', index, '{{email}}')}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="text-blue-400 font-mono text-[10px] w-3.5 text-center">@</div>
                                      <span>Email</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    {customFields.length > 0 && (
                                      <>
                                        <DropdownMenuLabel className="text-xs uppercase tracking-widest text-gray-500">
                                          Campos personalizados
                                        </DropdownMenuLabel>
                                        {customFields.map((field) => (
                                          <DropdownMenuItem
                                            key={field.key}
                                            onSelect={() => setTemplateVarValue('body', index, `{{${field.key}}}`)}
                                            className="flex items-center gap-2"
                                          >
                                            <div className="text-amber-400 font-mono text-[10px] w-3.5 text-center">#</div>
                                            <span>{field.label || field.key}</span>
                                          </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator className="bg-white/10" />
                                      </>
                                    )}
                                    <DropdownMenuItem
                                      onSelect={() => setIsFieldsSheetOpen(true)}
                                      className="text-xs text-amber-400"
                                    >
                                      <Plus size={12} /> Gerenciar campos
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {item.required && <span className="text-xs text-amber-300">obrigatorio</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                {collapseAudienceChoice ? (
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-gray-500">Publico</div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {audienceMode === 'todos' && 'Todos'}
                        {audienceMode === 'segmentos' && 'Segmentos'}
                        {audienceMode === 'teste' && 'Teste'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCollapseAudienceChoice(false)}
                      className="text-xs text-emerald-300"
                    >
                      Editar publico
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-white">Escolha o publico</h2>
                      <p className="text-sm text-gray-500">Uma decisao rapida antes dos filtros.</p>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                      {[
                        { label: 'Todos', value: 'todos', helper: '221 contatos elegiveis' },
                        { label: 'Segmentos', value: 'segmentos', helper: 'Filtrar por tags, DDI ou UF' },
                        { label: 'Teste', value: 'teste', helper: 'Enviar para contato de teste' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setAudienceMode(item.value)}
                          className={`rounded-2xl border px-4 py-4 text-left text-sm ${
                            audienceMode === item.value
                              ? 'border-emerald-400/40 bg-emerald-500/10 text-white'
                              : 'border-white/10 bg-zinc-950/40 text-gray-400'
                          }`}
                        >
                          <div className="text-sm font-semibold">{item.label}</div>
                          <div className="mt-2 text-xs text-gray-500">{item.helper}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {audienceMode === 'todos' && (
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">Todos os contatos</h2>
                    <p className="text-sm text-gray-500">Nenhum filtro aplicado.</p>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-center">
                      <p className="text-2xl font-semibold text-white">221</p>
                      <p className="text-xs text-gray-500">Elegiveis</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-center">
                      <p className="text-2xl font-semibold text-amber-200">6</p>
                      <p className="text-xs text-gray-500">Suprimidos</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-center">
                      <p className="text-2xl font-semibold text-gray-200">0</p>
                      <p className="text-xs text-gray-500">Duplicados</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-gray-500">
                    Envio para todos os contatos validos, excluindo opt-out e suprimidos.
                  </p>
                </div>
              )}

              {audienceMode === 'segmentos' && (
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                  <Sheet open={showStatesPanel} onOpenChange={setShowStatesPanel}>
                    <SheetContent className="w-full border-l border-white/10 bg-zinc-950 p-0 sm:max-w-md">
                      <SheetHeader className="border-b border-white/10 p-6">
                        <SheetTitle className="text-white">Selecionar UF</SheetTitle>
                        <SheetDescription className="text-gray-400">
                          Escolha os estados para segmentar.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-4 p-6">
                        {!isBrSelected && (
                          <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                            Selecione BR no DDI para habilitar as UFs.
                          </div>
                        )}
                        <input
                          className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                          placeholder="Buscar UF..."
                          value={stateSearch}
                          onChange={(event) => setStateSearch(event.target.value)}
                        />
                        <div className="max-h-64 overflow-y-auto pr-1">
                          <div className="flex flex-wrap gap-2">
                            {filteredStates.length === 0 && (
                              <span className="text-xs text-gray-500">Nenhuma UF encontrada.</span>
                            )}
                            {filteredStates.map((item) => {
                              const active = selectedStates.includes(item.code)
                              const disabled = !isBrSelected
                              return (
                                <button
                                  key={item.code}
                                  type="button"
                                  disabled={disabled}
                                  aria-disabled={disabled}
                                  onClick={() => {
                                    if (disabled) return
                                    if (combineMode === 'and') {
                                      setSelectedStates(active ? [] : [item.code])
                                      return
                                    }
                                    toggleSelection(item.code, selectedStates, setSelectedStates)
                                  }}
                                  className={`rounded-full border px-3 py-1 text-xs ${
                                    active
                                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                                      : 'border-white/10 bg-zinc-950/40 text-gray-300'
                                  } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                                >
                                  <span>{item.code}</span>
                                  <sup className="ml-1 text-[8px] leading-none text-amber-300">{item.count}</sup>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                  {collapseQuickSegments ? (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-gray-500">Segmentos rapidos</div>
                        <div className="mt-1 text-sm font-semibold text-white">Resumo aplicado</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCollapseQuickSegments(false)}
                        className="text-xs text-emerald-300"
                      >
                        Editar segmentos
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-white">Segmentos rapidos</h2>
                          <p className="text-sm text-gray-500">Refine sem abrir um construtor completo.</p>
                        </div>
                        <button className="text-xs text-gray-400 hover:text-white">Limpar</button>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="uppercase tracking-widest text-gray-500">Combinacao</span>
                        <button
                          type="button"
                          onClick={() => setCombineMode('or')}
                          className={`rounded-full border px-3 py-1 ${
                            combineMode === 'or'
                              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                              : 'border-white/10 bg-zinc-950/40 text-gray-300'
                          }`}
                        >
                          Mais alcance
                        </button>
                        <button
                          type="button"
                          onClick={() => setCombineMode('and')}
                          className={`rounded-full border px-3 py-1 ${
                            combineMode === 'and'
                              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                              : 'border-white/10 bg-zinc-950/40 text-gray-300'
                          }`}
                        >
                          Mais preciso
                        </button>
                        <span className="text-xs text-gray-500">
                          {combineModeLabel}: {combinePreview}
                        </span>
                        <span className="text-xs text-gray-500">
                          Estimativa: {isSegmentCountLoading ? 'Calculando...' : `${audienceCount} contatos`}
                        </span>
                      </div>
                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-gray-500">Tags</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {tagChips.length === 0 && (
                              <span className="text-xs text-gray-500">Sem tags cadastradas</span>
                            )}
                            {tagChips.map((tag) => {
                              const count = tagCounts[tag]
                              const active = selectedTags.includes(tag)
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => toggleSelection(tag, selectedTags, setSelectedTags)}
                                  className={`rounded-full border px-3 py-1 text-xs ${
                                    active
                                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                                      : 'border-white/10 bg-zinc-950/40 text-gray-300'
                                  }`}
                                >
                                  <span>{tag}</span>
                                  {typeof count === 'number' && (
                                    <sup className="ml-1 text-[8px] leading-none text-amber-300">{count}</sup>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-widest text-gray-500">Pais (DDI)</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {countriesQuery.isLoading && (
                              <span className="text-xs text-gray-500">Carregando DDI...</span>
                            )}
                            {!countriesQuery.isLoading && countryChips.length === 0 && (
                              <span className="text-xs text-gray-500">Sem DDI cadastrados</span>
                            )}
                            {countryChips.map((chip) => {
                              const active = selectedCountries.includes(chip)
                              const count = countryCounts[chip]
                              return (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => {
                                    if (combineMode === 'and') {
                                      setSelectedCountries(active ? [] : [chip])
                                      if (!active && chip !== 'BR') {
                                        setSelectedStates([])
                                      }
                                      return
                                    }
                                    toggleSelection(chip, selectedCountries, setSelectedCountries)
                                  }}
                                  className={`rounded-full border px-3 py-1 text-xs ${
                                    active
                                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                                      : 'border-white/10 bg-zinc-950/40 text-gray-300'
                                  }`}
                                >
                                  <span>{chip}</span>
                                  {typeof count === 'number' && (
                                    <sup className="ml-1 text-[8px] leading-none text-amber-300">{count}</sup>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-widest text-gray-500">UF (BR)</p>
                          <div className="mt-3 flex items-center gap-2 overflow-hidden">
                            {statesQuery.isLoading && (
                              <span className="text-xs text-gray-500">Carregando UFs...</span>
                            )}
                            {!statesQuery.isLoading && stateChips.length === 0 && (
                              <span className="text-xs text-gray-500">Sem UFs cadastrados</span>
                            )}
                            {stateChipsToShow.map((chip) => {
                              const active = selectedStates.includes(chip)
                              const disabled = !isBrSelected
                              const count = stateCounts[chip]
                              return (
                                <button
                                  key={chip}
                                  type="button"
                                  disabled={disabled}
                                  aria-disabled={disabled}
                                  onClick={() => {
                                    if (disabled) return
                                    if (combineMode === 'and') {
                                      setSelectedStates(active ? [] : [chip])
                                      return
                                    }
                                    toggleSelection(chip, selectedStates, setSelectedStates)
                                  }}
                                  className={`rounded-full border px-3 py-1 text-xs ${
                                    active
                                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                                      : 'border-white/10 bg-zinc-950/40 text-gray-300'
                                  } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                                >
                                  <span>{chip}</span>
                                  {typeof count === 'number' && (
                                    <sup className="ml-1 text-[8px] leading-none text-amber-300">{count}</sup>
                                  )}
                                </button>
                              )
                            })}
                            {!statesQuery.isLoading && hiddenStateCount > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isBrSelected) return
                                  setStateSearch('')
                                  setShowStatesPanel(true)
                                }}
                                className={`rounded-full border px-3 py-1 text-xs ${
                                  isBrSelected
                                    ? 'border-white/10 bg-zinc-950/40 text-gray-300 hover:border-white/30'
                                    : 'cursor-not-allowed border-white/10 bg-zinc-950/40 text-gray-500'
                                }`}
                              >
                                +{hiddenStateCount}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {audienceMode === 'teste' && (
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">Contato de teste</h2>
                    <p className="text-sm text-gray-500">Escolha o contato configurado, outro contato, ou ambos.</p>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Telefone de teste (settings)</label>
                        <a href="/settings#test-contact" className="text-xs text-emerald-300">
                          Editar em configuracoes
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!hasConfiguredContact) return
                          setSendToConfigured((prev) => !prev)
                        }}
                        className={`mt-3 w-full rounded-xl border bg-zinc-950/40 px-4 py-3 text-left text-sm ${
                          sendToConfigured && hasConfiguredContact
                            ? 'border-emerald-400/40 text-white'
                            : 'border-white/10 text-gray-300'
                        } ${!hasConfiguredContact ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        {configuredLabel}
                      </button>
                      {hasConfiguredContact ? (
                        <p className="mt-2 text-xs text-gray-500">Clique para incluir/remover no envio.</p>
                      ) : (
                        <p className="mt-2 text-xs text-amber-300">Nenhum telefone de teste configurado.</p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
                      <label className="text-xs uppercase tracking-widest text-gray-500">Usar outro contato</label>
                      <input
                        className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white placeholder:text-gray-600"
                        placeholder="Nome, telefone ou email..."
                        value={testContactSearch}
                        onChange={(event) => setTestContactSearch(event.target.value)}
                      />
                      {testContactSearch.trim().length < 2 && !selectedTestContact && (
                        <p className="mt-2 text-xs text-gray-600">Digite pelo menos 2 caracteres para buscar.</p>
                      )}
                      {contactSearchQuery.isLoading && (
                        <p className="mt-2 text-xs text-gray-500">Buscando contatos...</p>
                      )}
                      {contactSearchQuery.isError && (
                        <p className="mt-2 text-xs text-amber-300">Erro ao buscar contatos.</p>
                      )}
                      <div className="mt-3 space-y-2 text-sm text-gray-400">
                        {displayTestContacts.map((contact) => {
                          const isSelected = selectedTestContact?.id === contact.id
                          const isActive = isSelected && sendToSelected
                          return (
                            <button
                              key={contact.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSendToSelected((prev) => !prev)
                                } else {
                                  setSelectedTestContact(contact)
                                  setSendToSelected(true)
                                }
                              }}
                              className={`w-full rounded-xl border bg-zinc-950/40 px-3 py-2 text-left transition ${
                                isActive
                                  ? 'border-emerald-400/40 text-gray-200'
                                  : isSelected
                                    ? 'border-white/20 text-gray-300'
                                    : 'border-white/10 text-gray-300 hover:border-emerald-400/40'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white">{contact.name || 'Contato'}</span>
                                <span className="text-xs text-gray-500">{contact.phone}</span>
                              </div>
                              {contact.email && <div className="mt-1 text-xs text-gray-500">{contact.email}</div>}
                            </button>
                          )
                        })}
                        {!displayTestContacts.length &&
                          testContactSearch.trim().length >= 2 &&
                          !contactSearchQuery.isLoading && (
                            <div className="rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-gray-500">
                              Nenhum contato encontrado.
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-gray-500">
                      Envio de teste nao consome limite diario. Selecione 1 ou 2 contatos.
                    </p>
                    <button
                      disabled={!selectedTestCount}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                        selectedTestCount
                          ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                          : 'border-white/10 bg-zinc-950/40 text-gray-500'
                      }`}
                    >
                      Enviar teste
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-white">Pre-check de destinatarios</h2>
                  <p className="text-sm text-gray-500">Validacao automatica antes do disparo.</p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-center">
                    <p className="text-2xl font-semibold text-white">217</p>
                    <p className="text-xs text-gray-500">Validos</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-center">
                    <p className="text-2xl font-semibold text-amber-300">4</p>
                    <p className="text-xs text-gray-500">Ignorados</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-center">
                    <p className="text-2xl font-semibold text-emerald-300">OK</p>
                    <p className="text-xs text-gray-500">Status</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-white">Agendamento</h2>
                  <p className="text-sm text-gray-500">Defina se o envio sera agora ou programado.</p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('imediato')}
                    className={`rounded-xl border px-4 py-3 text-left text-sm ${
                      scheduleMode === 'imediato'
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-white/10 bg-zinc-950/40 text-gray-400'
                    }`}
                  >
                    Imediato
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode('agendar')}
                    className={`rounded-xl border px-4 py-3 text-left text-sm ${
                      scheduleMode === 'agendar'
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-white/10 bg-zinc-950/40 text-gray-400'
                    }`}
                  >
                    Agendar
                  </button>
                </div>
                <div
                  className={`mt-4 transition ${
                    scheduleMode === 'agendar' ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-500">Data</label>
                      <input
                        className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white"
                        type="date"
                        disabled={scheduleMode !== 'agendar'}
                        value={scheduleDate}
                        onChange={(event) => setScheduleDate(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-500">Horario</label>
                      <input
                        className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white"
                        type="time"
                        disabled={scheduleMode !== 'agendar'}
                        value={scheduleTime}
                        onChange={(event) => setScheduleTime(event.target.value)}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">Fuso fixo: America/Sao_Paulo.</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <button className="text-sm text-gray-400 hover:text-white">Voltar</button>
              <div className="text-center text-sm text-gray-400">
                {step === 1 && !templateSelected && 'Selecione um template para continuar'}
                {step === 1 && templateSelected && missingTemplateVars > 0 && (
                  <>Preencha {missingTemplateVars} variavel(is) obrigatoria(s)</>
                )}
                {step === 1 && templateSelected && missingTemplateVars === 0 && !campaignName.trim() && (
                  <>Defina o nome da campanha</>
                )}
                {step === 2 && !isAudienceComplete && 'Selecione um publico valido'}
                {step === 3 && !isReviewComplete && 'Defina data e horario do agendamento'}
                {canContinue && footerSummary}
              </div>
              <button
                onClick={() => {
                  if (!canContinue) return
                  if (step < 3) {
                    setStep(step + 1)
                  }
                }}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  canContinue
                    ? 'bg-white text-black'
                    : 'cursor-not-allowed border border-white/10 bg-white/10 text-gray-500'
                }`}
                disabled={!canContinue}
              >
                {step < 3 ? 'Continuar' : 'Lancar campanha'}
              </button>
            </div>
          </div>
        </div>

        <div className={`flex h-full flex-col gap-4 ${step === 2 ? 'lg:sticky lg:top-6' : ''}`}>
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-gray-500">Resumo</div>
              <button className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                Campanha Rapida
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Contatos</span>
                <span className="text-white">{displayAudienceCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Custo</span>
                <span className="text-emerald-300">{displayAudienceCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Agendamento</span>
                <span className="text-white">{scheduleLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Nome</span>
                <span className="text-white">{campaignName.trim() || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Template</span>
                <span className="text-white">{templateSelected ? selectedTemplate?.name || '—' : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Publico</span>
                <span className="text-white">
                  {audienceMode === 'teste'
                    ? `${selectedTestCount || 0} contato(s) de teste`
                    : isSegmentCountLoading
                      ? 'Calculando...'
                      : `${audienceCount} contatos`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-gray-500">Preview</div>
              <button className="text-xs text-gray-400 hover:text-white">Expandir</button>
            </div>
            <div className="mt-6 rounded-2xl bg-zinc-950/40 p-6 text-sm text-gray-300">
              <p className="text-xs uppercase tracking-widest text-gray-500">Template</p>
              {activeTemplate ? (
                <>
                  <p className="mt-2 text-base font-semibold text-white">{activeTemplate.name}</p>
                  <p className="mt-3">{renderTemplatePreview(activeTemplate.preview ?? '')}</p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-base font-semibold text-white">Selecione um template</p>
                  <p className="mt-3 text-sm text-gray-500">O preview aparece aqui quando voce escolher.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <CustomFieldsSheet
        open={isFieldsSheetOpen}
        onOpenChange={setIsFieldsSheetOpen}
        entityType="contact"
      />
    </div>
  )
}
