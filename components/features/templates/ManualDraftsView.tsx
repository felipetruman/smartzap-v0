'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FileText, RefreshCw, Plus, Trash2, Send, Pencil, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ManualDraftTemplate } from '@/hooks/useManualDrafts'

function extractDraftBody(draft: ManualDraftTemplate): string {
  if (typeof draft.content === 'string' && draft.content.trim()) return draft.content
  const spec = draft.spec
  if (spec && typeof spec === 'object') {
    const body = (spec as any).body
    if (body && typeof body.text === 'string') return body.text
    if (typeof (spec as any).content === 'string') return (spec as any).content
  }
  return ''
}

function DraftStatusBadge({ ready }: { ready: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide border',
        ready
          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
          : 'bg-white/5 text-gray-400 border-white/10'
      )}
    >
      {ready ? 'Pronto para enviar' : 'Em edição'}
    </span>
  )
}

export function ManualDraftsView({
  drafts,
  isLoading,
  isRefreshing,
  search,
  setSearch,
  onRefresh,
  onCreate,
  isCreating,
  onDelete,
  isDeleting,
  isUpdating,
  onSubmit,
  isSubmitting,
  normalizeName,
}: {
  drafts: ManualDraftTemplate[]
  isLoading: boolean
  isRefreshing: boolean
  search: string
  setSearch: (v: string) => void
  onRefresh: () => void
  onCreate: (input: { name: string; category: string; language: string; parameterFormat: 'positional' | 'named' }) => Promise<ManualDraftTemplate | void>
  isCreating: boolean
  onDelete: (id: string) => void
  isDeleting: boolean
  onUpdate: (id: string, patch: { spec: unknown }) => void
  isUpdating: boolean
  onSubmit: (id: string) => void
  isSubmitting: boolean
  normalizeName: (input: string) => string
}) {
  const router = useRouter()
  const [newName, setNewName] = React.useState('')
  const [newCategory, setNewCategory] = React.useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING')
  const [newLanguage, setNewLanguage] = React.useState<'pt_BR' | 'en_US' | 'es_ES'>('pt_BR')
  const [newParameterFormat, setNewParameterFormat] = React.useState<'positional' | 'named'>('positional')
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const canSubmit = (draft: ManualDraftTemplate): boolean => {
    const spec = (draft.spec || {}) as any
    const bodyText = typeof spec?.body?.text === 'string' ? spec.body.text : (typeof spec?.content === 'string' ? spec.content : '')
    return bodyText.trim().length > 0
  }

  const handleCreate = async () => {
    const normalized = normalizeName(newName)
    if (!normalized) return
    try {
      const created = await onCreate({
        name: newName,
        category: newCategory,
        language: newLanguage,
        parameterFormat: newParameterFormat,
      })
      if (created?.id) {
        setNewName('')
        router.push(`/templates/drafts/${encodeURIComponent(created.id)}`)
        return
      }
      setNewName('')
    } catch {
      // Toast handled by caller.
    }
  }

  const normalizedName = normalizeName(newName)
  const readyDrafts = drafts.filter((d) => canSubmit(d))
  const editingDrafts = drafts.filter((d) => !canSubmit(d))
  const showContinue = !search.trim() && !isLoading && drafts.length > 0
  const recentDrafts = showContinue ? drafts.slice(0, 3) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Templates em rascunho</h2>
            <p className="text-sm text-gray-400">Comece pelo nome e vá direto para o editor.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="border-white/10 bg-zinc-900 hover:bg-white/5"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing ? 'animate-spin' : '')} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div>
          <div className="text-base font-semibold text-white">Comece por aqui</div>
          <div className="text-xs text-gray-400 mt-1">1. Nomeie • 2. Escreva • 3. Envie</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">Nome do template</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="meu_template_01"
              className="bg-zinc-900 border-white/10 text-white"
            />
            <p className="text-xs text-gray-500">
              Normalizado: <span className="font-mono">{normalizedName || '-'}</span>
            </p>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!normalizedName || isCreating}
            className="h-10"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Criando...' : 'Criar e abrir editor'}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="text-xs text-gray-400 hover:text-gray-200 inline-flex items-center gap-1"
          aria-expanded={showAdvanced}
        >
          Configurações avançadas
          <ChevronDown className={cn('w-4 h-4 transition-transform', showAdvanced ? 'rotate-180' : '')} />
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Categoria</label>
              <Select value={newCategory} onValueChange={(v) => setNewCategory(v as any)}>
                <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="UTILITY">Utilidade</SelectItem>
                  <SelectItem value="AUTHENTICATION">Autenticação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Idioma</label>
              <Select value={newLanguage} onValueChange={(v) => setNewLanguage(v as any)}>
                <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt_BR">Português (Brasil) — pt_BR</SelectItem>
                  <SelectItem value="en_US">English (US) — en_US</SelectItem>
                  <SelectItem value="es_ES">Español — es_ES</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Formato de variáveis</label>
              <Select value={newParameterFormat} onValueChange={(v) => setNewParameterFormat(v as any)}>
                <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positional">Positional ({'{{1}}'}, {'{{2}}'})</SelectItem>
                  <SelectItem value="named">Named ({'{{first_name}}'})</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Dica: URL dinâmica em botões funciona melhor com <span className="font-mono">positional</span>.
              </p>
            </div>
          </div>
        )}
      </div>

      {showContinue && (
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Continue criando</div>
              <div className="text-xs text-gray-500">Acesse os últimos rascunhos para terminar rápido.</div>
            </div>
            <div className="text-xs text-gray-400">{drafts.length} rascunho(s)</div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {recentDrafts.map((draft) => {
              const snippet = extractDraftBody(draft).trim()
              const ready = canSubmit(draft)
              return (
                <div
                  key={draft.id}
                  className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white truncate">{draft.name}</div>
                    <DraftStatusBadge ready={ready} />
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-3 whitespace-pre-wrap">
                    {snippet || 'Escreva o corpo do template para ver um preview aqui.'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Atualizado {new Date(draft.updatedAt).toLocaleDateString('pt-BR')}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`/templates/drafts/${encodeURIComponent(draft.id)}`)}
                      disabled={isUpdating}
                    >
                      <Pencil className="w-4 h-4" />
                      Continuar
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar rascunhos..."
          className="bg-zinc-900 border-white/5 text-white placeholder-gray-600 w-full sm:w-96"
        />
        <div className="text-xs text-gray-400">
          {drafts.length} rascunho(s) • {readyDrafts.length} pronto(s) para envio
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-10 text-center text-gray-400">Carregando...</div>
        ) : drafts.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">
            <div className="text-sm font-semibold text-gray-300">Nenhum rascunho ainda.</div>
            <div className="text-xs text-gray-500 mt-1">Crie seu primeiro template acima.</div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Em edição ({editingDrafts.length})
            </div>
            {editingDrafts.length === 0 ? (
              <div className="px-4 py-5 text-sm text-gray-500">Tudo pronto para enviar.</div>
            ) : (
              editingDrafts.map((draft) => {
                const snippet = extractDraftBody(draft).trim()
                return (
                  <div key={draft.id} className="px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-white/5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-white font-medium truncate">{draft.name}</div>
                        <DraftStatusBadge ready={false} />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap">
                        {snippet || 'Sem corpo ainda. Escreva o conteúdo para aparecer aqui.'}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        Atualizado {new Date(draft.updatedAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/templates/drafts/${encodeURIComponent(draft.id)}`)}
                        disabled={isUpdating}
                      >
                        <Pencil className="w-4 h-4" />
                        Continuar edição
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(draft.id)}
                        disabled={isDeleting}
                        title="Excluir rascunho"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                )
              })
            )}

            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Prontos para enviar ({readyDrafts.length})
            </div>
            {readyDrafts.length === 0 ? (
              <div className="px-4 py-5 text-sm text-gray-500">Nenhum rascunho pronto ainda.</div>
            ) : (
              readyDrafts.map((draft) => {
                const snippet = extractDraftBody(draft).trim()
                return (
                  <div key={draft.id} className="px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-white/5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-white font-medium truncate">{draft.name}</div>
                        <DraftStatusBadge ready />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap">
                        {snippet || 'Pronto para enviar.'}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        Atualizado {new Date(draft.updatedAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onSubmit(draft.id)}
                        disabled={isSubmitting}
                      >
                        <Send className="w-4 h-4" />
                        Enviar para a Meta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/templates/drafts/${encodeURIComponent(draft.id)}`)}
                        disabled={isUpdating}
                      >
                        <Pencil className="w-4 h-4" />
                        Continuar edição
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(draft.id)}
                        disabled={isDeleting}
                        title="Excluir rascunho"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        Para enviar, o BODY do template precisa estar preenchido.
      </div>
    </div>
  )
}
