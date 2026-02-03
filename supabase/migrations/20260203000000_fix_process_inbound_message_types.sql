-- =============================================================================
-- Fix: process_inbound_message - Corrige tipos TEXT vs UUID
-- =============================================================================
-- Problema: A função declarava v_contact_id como UUID, mas contacts.id é TEXT
-- (com prefixo 'ct_'). Isso causava erro 42804 no COALESCE.
--
-- Erro original: "COALESCE types text and uuid cannot be matched"
-- =============================================================================

CREATE OR REPLACE FUNCTION public.process_inbound_message(
  p_phone TEXT,
  p_content TEXT,
  p_whatsapp_message_id TEXT DEFAULT NULL,
  p_message_type TEXT DEFAULT 'text',
  p_media_url TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT NULL,
  p_contact_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_conversation_id UUID;
  v_message_id UUID;
  v_conversation_status TEXT;
  v_conversation_mode TEXT;
  v_ai_agent_id UUID;
  v_human_mode_expires_at TIMESTAMPTZ;
  v_automation_paused_until TIMESTAMPTZ;
  v_is_new_conversation BOOLEAN := FALSE;
  v_message_preview TEXT;
  -- FIX: Mudado de UUID para TEXT (contacts.id usa prefixo 'ct_')
  v_contact_id TEXT;
  v_current_contact_id TEXT;
BEGIN
  -- Auto-lookup contact by phone if not provided
  IF p_contact_id IS NULL THEN
    SELECT id INTO v_contact_id FROM contacts WHERE phone = p_phone LIMIT 1;
  ELSE
    v_contact_id := p_contact_id;  -- Já é TEXT, não precisa de cast
  END IF;

  -- Trunca preview para 100 chars
  v_message_preview := CASE
    WHEN LENGTH(p_content) > 100 THEN SUBSTRING(p_content, 1, 100) || '...'
    ELSE p_content
  END;

  -- 1. Busca conversa existente pelo telefone (usa idx_inbox_conversations_phone_covering)
  SELECT
    id, status, mode, ai_agent_id, human_mode_expires_at, automation_paused_until, contact_id
  INTO
    v_conversation_id, v_conversation_status, v_conversation_mode,
    v_ai_agent_id, v_human_mode_expires_at, v_automation_paused_until, v_current_contact_id
  FROM inbox_conversations
  WHERE phone = p_phone
  ORDER BY last_message_at DESC NULLS LAST
  LIMIT 1;

  -- 2. Se não existe, cria nova conversa
  IF v_conversation_id IS NULL THEN
    INSERT INTO inbox_conversations (
      phone,
      contact_id,
      mode,
      status,
      total_messages,
      unread_count,
      last_message_at,
      last_message_preview
    ) VALUES (
      p_phone,
      v_contact_id,
      'bot',
      'open',
      1,
      1,
      NOW(),
      v_message_preview
    )
    RETURNING id, mode, ai_agent_id, human_mode_expires_at, automation_paused_until
    INTO v_conversation_id, v_conversation_mode, v_ai_agent_id,
         v_human_mode_expires_at, v_automation_paused_until;

    v_is_new_conversation := TRUE;
    v_conversation_status := 'open';
  ELSE
    -- 3. Se existe, atualiza contadores e reabre se fechada
    -- Auto-link contact if conversation has no contact but we found one
    UPDATE inbox_conversations
    SET
      total_messages = total_messages + 1,
      unread_count = unread_count + 1,
      last_message_at = NOW(),
      last_message_preview = v_message_preview,
      status = CASE WHEN status = 'closed' THEN 'open' ELSE status END,
      contact_id = COALESCE(contact_id, v_contact_id),  -- Agora ambos são TEXT
      updated_at = NOW()
    WHERE id = v_conversation_id
    RETURNING status INTO v_conversation_status;
  END IF;

  -- 4. Cria mensagem
  INSERT INTO inbox_messages (
    conversation_id,
    direction,
    content,
    message_type,
    whatsapp_message_id,
    media_url,
    delivery_status,
    payload
  ) VALUES (
    v_conversation_id,
    'inbound',
    p_content,
    p_message_type,
    p_whatsapp_message_id,
    p_media_url,
    'delivered',
    p_payload
  )
  RETURNING id INTO v_message_id;

  -- 5. Retorna resultado completo
  RETURN json_build_object(
    'conversation_id', v_conversation_id,
    'message_id', v_message_id,
    'is_new_conversation', v_is_new_conversation,
    'conversation_status', v_conversation_status,
    'conversation_mode', v_conversation_mode,
    'ai_agent_id', v_ai_agent_id,
    'human_mode_expires_at', v_human_mode_expires_at,
    'automation_paused_until', v_automation_paused_until
  );
END;
$$;

COMMENT ON FUNCTION public.process_inbound_message IS
'Processa mensagem inbound de forma atômica: busca/cria conversa + cria mensagem + atualiza contadores. Auto-vincula contatos pelo telefone. v2: Fix tipos TEXT vs UUID.';
