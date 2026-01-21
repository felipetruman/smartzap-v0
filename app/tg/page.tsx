'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Settings, RefreshCw } from 'lucide-react';
import { useTelegramSDK } from '@/components/telegram/TelegramSDKProvider';
import {
  useHaptic,
  useTelegramConversations,
  formatRelativeTime,
  getStatusEmoji,
  getStatusLabel,
  getStatusColor,
  type TelegramConversation,
} from '@/hooks/telegram';

// =============================================================================
// TIPOS
// =============================================================================

type FilterTab = 'all' | 'urgent' | 'ai' | 'human';

// =============================================================================
// COMPONENTES
// =============================================================================

function FilterTabs({
  activeTab,
  onTabChange,
  counts,
}: {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  counts: Record<FilterTab, number>;
}) {
  const { selection } = useHaptic();

  const tabs: { id: FilterTab; label: string; emoji?: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'urgent', label: 'Urgente', emoji: '🚨' },
    { id: 'ai', label: 'IA', emoji: '🤖' },
    { id: 'human', label: 'Humano', emoji: '👤' },
  ];

  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => {
              selection();
              onTabChange(tab.id);
            }}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${isActive
                ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                : 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)]'
              }
            `}
          >
            {tab.emoji && <span>{tab.emoji}</span>}
            {tab.label}
            {count > 0 && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                ${isActive ? 'bg-white/20' : 'bg-[var(--tg-theme-bg-color)]'}
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ConversationItem({
  conversation,
  onClick,
}: {
  conversation: TelegramConversation;
  onClick: () => void;
}) {
  const { selection } = useHaptic();
  const isUrgent = conversation.status === 'handoff_requested';

  return (
    <button
      type="button"
      onClick={() => {
        selection();
        onClick();
      }}
      className={`
        w-full text-left p-4 border-b border-[var(--tg-theme-secondary-bg-color)]
        hover:bg-[var(--tg-theme-secondary-bg-color)]/50 transition-colors
        active:bg-[var(--tg-theme-secondary-bg-color)]
        ${isUrgent ? 'bg-red-500/5' : ''}
      `}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium shrink-0
          ${isUrgent
            ? 'bg-red-500/20 text-red-400'
            : 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)]'
          }
        `}>
          {conversation.contactAvatar || conversation.contactName.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium truncate">
              {conversation.contactName}
            </span>
            <span className="text-xs text-[var(--tg-theme-hint-color)] shrink-0">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-[var(--tg-theme-hint-color)] truncate">
              {conversation.isTyping ? (
                <span className="text-[var(--tg-theme-link-color)]">Digitando...</span>
              ) : (
                conversation.lastMessage
              )}
            </p>

            {conversation.unreadCount > 0 && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0
                ${isUrgent
                  ? 'bg-red-500 text-white'
                  : 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                }
              `}>
                {conversation.unreadCount}
              </span>
            )}
          </div>

          {/* Status badge + AI Agent name */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`text-xs ${getStatusColor(conversation.status)}`}>
              {getStatusEmoji(conversation.status)} {getStatusLabel(conversation.status)}
            </span>
            {conversation.aiAgentName && conversation.status === 'ai_active' && (
              <span className="text-xs text-[var(--tg-theme-hint-color)]">
                • {conversation.aiAgentName}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ filter }: { filter: FilterTab }) {
  const messages: Record<FilterTab, { emoji: string; title: string; description: string }> = {
    all: {
      emoji: '💬',
      title: 'Nenhuma conversa',
      description: 'Suas conversas aparecerão aqui',
    },
    urgent: {
      emoji: '✨',
      title: 'Nenhuma urgência',
      description: 'Nenhum cliente pedindo atendente humano',
    },
    ai: {
      emoji: '🤖',
      title: 'Nenhuma IA ativa',
      description: 'Conversas com IA aparecerão aqui',
    },
    human: {
      emoji: '👤',
      title: 'Nenhum atendimento',
      description: 'Conversas com humanos aparecerão aqui',
    },
  };

  const msg = messages[filter];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-5xl mb-4">{msg.emoji}</span>
      <h3 className="text-lg font-medium mb-1">{msg.title}</h3>
      <p className="text-sm text-[var(--tg-theme-hint-color)]">{msg.description}</p>
    </div>
  );
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

export default function InboxPage() {
  const router = useRouter();
  const { user } = useTelegramSDK();
  const { notification } = useHaptic();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Buscar conversas reais da API
  const {
    conversations,
    counts: apiCounts,
    isLoading,
    isRefetching,
    refetch,
  } = useTelegramConversations({
    status: 'open', // Só conversas abertas
    search: searchQuery || undefined,
  });

  // Filtrar conversas por tab (client-side para UX mais rápida)
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filtro por tab
    switch (activeTab) {
      case 'urgent':
        filtered = filtered.filter((c) => c.status === 'handoff_requested');
        break;
      case 'ai':
        filtered = filtered.filter((c) => c.status === 'ai_active');
        break;
      case 'human':
        filtered = filtered.filter((c) => c.status === 'human_active');
        break;
    }

    // Ordenar: urgentes primeiro, depois por data
    return filtered.sort((a, b) => {
      if (a.status === 'handoff_requested' && b.status !== 'handoff_requested') return -1;
      if (b.status === 'handoff_requested' && a.status !== 'handoff_requested') return 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }, [activeTab, conversations]);

  // Contagens para as tabs
  const counts: Record<FilterTab, number> = useMemo(() => ({
    all: apiCounts.total,
    urgent: apiCounts.urgent,
    ai: apiCounts.ai,
    human: apiCounts.human,
  }), [apiCounts]);

  // Função para refresh manual
  const handleRefresh = () => {
    notification('success');
    refetch();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">SmartZap</h1>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">
              Olá, {user?.firstName}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefetching}
              className="p-2 rounded-lg hover:bg-[var(--tg-theme-secondary-bg-color)] transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={20}
                className={`text-[var(--tg-theme-hint-color)] ${isRefetching ? 'animate-spin' : ''}`}
              />
            </button>
            {/* Settings button */}
            <button
              type="button"
              onClick={() => router.push('/tg/settings')}
              className="p-2 rounded-lg hover:bg-[var(--tg-theme-secondary-bg-color)] transition-colors"
            >
              <Settings size={22} className="text-[var(--tg-theme-hint-color)]" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tg-theme-hint-color)]"
          />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] placeholder:text-[var(--tg-theme-hint-color)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]/50"
          />
        </div>
      </header>

      {/* Filter tabs */}
      <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-[var(--tg-theme-secondary-bg-color)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--tg-theme-secondary-bg-color)] rounded w-1/3" />
                  <div className="h-3 bg-[var(--tg-theme-secondary-bg-color)] rounded w-2/3" />
                  <div className="h-3 bg-[var(--tg-theme-secondary-bg-color)] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <EmptyState filter={activeTab} />
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onClick={() => router.push(`/tg/conversation/${conversation.id}`)}
            />
          ))
        )}
      </div>

      {/* Stats bar */}
      <div className="shrink-0 px-4 py-3 bg-[var(--tg-theme-secondary-bg-color)]/50 border-t border-[var(--tg-theme-secondary-bg-color)]">
        <div className="flex items-center justify-around text-center">
          <div>
            <p className="text-lg font-bold">{counts.all}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Total</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-400">{counts.urgent}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Urgente</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">{counts.ai}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">IA</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-400">{counts.human}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Humano</p>
          </div>
        </div>
      </div>
    </div>
  );
}
