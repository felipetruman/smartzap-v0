/**
 * API para o Telegram Mini App - Conversas
 *
 * Retorna conversas no formato otimizado para mobile.
 * Mapeia InboxConversation → TelegramConversation
 */

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { InboxConversation, Contact } from '@/types'

// =============================================================================
// TIPOS DO MINI APP
// =============================================================================

export type TelegramConversationStatus = 'ai_active' | 'human_active' | 'handoff_requested' | 'resolved'

export interface TelegramConversation {
  id: string
  contactName: string
  contactPhone: string
  contactAvatar?: string
  status: TelegramConversationStatus
  lastMessage: string
  lastMessageAt: string // ISO string para serialização
  unreadCount: number
  isTyping?: boolean
  aiAgentName?: string
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Mapeia status do inbox para status do Mini App
 */
function mapStatus(conversation: InboxConversation): TelegramConversationStatus {
  // Conversa fechada = resolvida
  if (conversation.status === 'closed') {
    return 'resolved'
  }

  // Se tem priority urgent e está no modo bot, provavelmente pediu handoff
  if (conversation.priority === 'urgent' && conversation.mode === 'bot') {
    return 'handoff_requested'
  }

  // Se tem handoff_summary, também pediu handoff
  if (conversation.handoff_summary && conversation.mode === 'bot') {
    return 'handoff_requested'
  }

  // Mapeia modo diretamente
  if (conversation.mode === 'human') {
    return 'human_active'
  }

  return 'ai_active'
}

/**
 * Transforma InboxConversation em TelegramConversation
 */
function transformConversation(
  conv: InboxConversation & { contact?: Contact | null }
): TelegramConversation {
  return {
    id: conv.id,
    contactName: conv.contact?.name || formatPhoneForDisplay(conv.phone),
    contactPhone: conv.phone,
    contactAvatar: undefined, // Contatos não têm avatar no momento
    status: mapStatus(conv),
    lastMessage: conv.last_message_preview || 'Sem mensagens',
    lastMessageAt: conv.last_message_at || conv.created_at,
    unreadCount: conv.unread_count,
    aiAgentName: conv.ai_agent?.name,
  }
}

/**
 * Formata telefone para exibição
 */
function formatPhoneForDisplay(phone: string): string {
  // Remove o + e formata como (XX) XXXXX-XXXX
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13) {
    // +55 11 99999-9999
    return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
  }
  return phone
}

// =============================================================================
// GET - Lista conversas para o Mini App
// =============================================================================

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'open' | 'closed' | null (all)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Query base
    let query = supabase
      .from('inbox_conversations')
      .select(`
        *,
        contact:contacts(*),
        ai_agent:ai_agents(id, name)
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit)

    // Filtro por status
    if (status === 'open') {
      query = query.eq('status', 'open')
    } else if (status === 'closed') {
      query = query.eq('status', 'closed')
    }

    // Filtro por busca (nome do contato ou telefone)
    if (search) {
      query = query.or(`phone.ilike.%${search}%,contact.name.ilike.%${search}%`)
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error('[telegram-api] Error fetching conversations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transformar para formato do Mini App
    const telegramConversations = (conversations || []).map(transformConversation)

    // Calcular contadores
    const counts = {
      total: telegramConversations.length,
      urgent: telegramConversations.filter(c => c.status === 'handoff_requested').length,
      ai: telegramConversations.filter(c => c.status === 'ai_active').length,
      human: telegramConversations.filter(c => c.status === 'human_active').length,
      resolved: telegramConversations.filter(c => c.status === 'resolved').length,
    }

    return NextResponse.json({
      conversations: telegramConversations,
      counts,
    })

  } catch (error) {
    console.error('[telegram-api] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
