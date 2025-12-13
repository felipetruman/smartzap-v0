type CustomFieldLabelByKey = Record<string, string>;

export type ContactFixFocus =
  | { type: 'email' }
  | { type: 'custom_field'; key: string }
  | null;

export type HumanizedReason = {
  title: string;
  details?: string;
  focus?: ContactFixFocus;
};

const SYSTEM_TOKEN_LABELS: Record<string, { label: string; focus: ContactFixFocus }> = {
  nome: { label: 'Nome', focus: null },
  telefone: { label: 'Telefone', focus: null },
  email: { label: 'Email', focus: { type: 'email' } },
};

function extractSingleToken(raw: string): string | null {
  const s = (raw || '').trim();
  const m = s.match(/^\{\{([\w\d_]+)\}\}$/);
  return m ? m[1] : null;
}

function normalizeWhere(where: string): string {
  if (where === 'header') return 'Cabeçalho';
  if (where === 'body') return 'Corpo';
  if (where === 'button') return 'Botão';
  return 'Template';
}

export function humanizeVarSource(
  raw: string,
  customFieldLabelByKey?: CustomFieldLabelByKey
): { label: string; focus?: ContactFixFocus } {
  const token = extractSingleToken(raw);
  if (!token) {
    if (!raw || raw === '<vazio>') {
      return { label: 'Valor não preenchido' };
    }
    return { label: 'Valor não disponível' };
  }

  const sys = SYSTEM_TOKEN_LABELS[token.toLowerCase()];
  if (sys) return { label: sys.label, focus: sys.focus };

  const customLabel = customFieldLabelByKey?.[token];
  return {
    label: customLabel ? `Campo: ${customLabel}` : `Campo: ${token}`,
    focus: { type: 'custom_field', key: token },
  };
}

export function humanizePrecheckReason(
  reason: string,
  options?: { customFieldLabelByKey?: CustomFieldLabelByKey }
): HumanizedReason {
  const text = String(reason || '').trim();
  if (!text) return { title: '-' };

  // Caso principal: variáveis faltantes (pré-check/template contract)
  if (text.includes('Variáveis obrigatórias sem valor:')) {
    const tail = text.split('Variáveis obrigatórias sem valor:')[1] || '';
    const parts = tail.split(',').map(s => s.trim()).filter(Boolean);

    // Tenta achar o primeiro raw="{{...}}" para inferir qual dado está faltando.
    let firstRaw: string | null = null;
    let firstWhere: string | null = null;
    let firstKey: string | null = null;
    let firstButtonIndex: number | null = null;

    for (const p of parts) {
      const btn = p.match(/^button:(\d+):(\w+) \(raw="([\s\S]*?)"\)$/);
      if (btn) {
        firstWhere = 'button';
        firstButtonIndex = Number(btn[1]);
        firstKey = btn[2];
        firstRaw = btn[3];
        break;
      }
      const hb = p.match(/^(header|body):(\w+) \(raw="([\s\S]*?)"\)$/);
      if (hb) {
        firstWhere = hb[1];
        firstKey = hb[2];
        firstRaw = hb[3];
        break;
      }
    }

    const inferred = humanizeVarSource(firstRaw || '<vazio>', options?.customFieldLabelByKey);

    // Se não deu pra inferir o token, ao menos mostra qual variável do template.
    const title = inferred.label.startsWith('Valor')
      ? `Precisa de: {{${firstKey || '?' }}}`
      : `Precisa de: ${inferred.label}`;

    const whereLabel = firstWhere ? normalizeWhere(firstWhere) : undefined;
    const details = whereLabel
      ? (firstWhere === 'button' && firstButtonIndex != null
        ? `${whereLabel} ${firstButtonIndex + 1} • variável {{${firstKey || '?' }}}`
        : `${whereLabel} • variável {{${firstKey || '?' }}}`)
      : undefined;

    return {
      title,
      details,
      focus: inferred.focus || null,
    };
  }

  // Outros motivos comuns (mantém simples/curto)
  if (text.toLowerCase().includes('telefone') && text.toLowerCase().includes('invál')) {
    return { title: 'Telefone inválido' };
  }

  if (text.toLowerCase().includes('opt-out') || text.toLowerCase().includes('opt out')) {
    return { title: 'Contato opt-out (não quer receber mensagens)' };
  }

  return { title: text };
}
