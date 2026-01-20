# Google File Search - Melhores Práticas

> Documentação interna sobre o uso do Google File Search (RAG) com Gemini no SmartZap.

## Regra de Ouro: Uma Tool por Chamada

**NUNCA combine `file_search` com outras tools na mesma chamada.**

O File Search é uma "provider-defined tool" do Google que tem comportamento especial - ele injeta contexto automaticamente e não pode ser combinado com tools customizadas.

### Padrão Correto

| Cenário | Tools | Output | toolChoice |
|---------|-------|--------|------------|
| **COM** knowledge base | `file_search` apenas | texto plano | `auto` |
| **SEM** knowledge base | `respond` apenas | structured output | `required` |

### Código de Referência

```typescript
// COM knowledge base - File Search injeta contexto automaticamente
if (hasKnowledgeBase && agent.file_search_store_id) {
  const result = await generateText({
    model,
    system: agent.system_prompt,
    messages: aiMessages,
    tools: {
      file_search: google.tools.fileSearch({
        fileSearchStoreNames: [agent.file_search_store_id],
        topK: 5,
      }),
    },
    // toolChoice: 'auto' (default) - modelo decide quando usar
  })

  // Resposta vem como texto plano
  const message = result.text
}

// SEM knowledge base - usar tool customizada para structured output
else {
  const respondTool = tool({
    description: 'Envia uma resposta estruturada ao usuário.',
    inputSchema: responseSchema,
    execute: async (params) => params,
  })

  await generateText({
    model,
    system: agent.system_prompt,
    messages: aiMessages,
    tools: { respond: respondTool },
    toolChoice: 'required', // Força uso da tool
  })
}
```

## O que o File Search Faz Automaticamente

1. **Busca semântica** nos documentos indexados
2. **Injeta contexto relevante** no prompt (via `toolUsePromptTokens`)
3. **Retorna metadados de grounding** com citações das fontes

### Exemplo de Token Usage

```json
{
  "promptTokenCount": 379,        // Mensagem do usuário
  "toolUsePromptTokenCount": 3266, // Contexto injetado pelo File Search!
  "totalTokenCount": 4608
}
```

### Exemplo de Grounding Metadata

```json
{
  "groundingChunks": [
    {
      "retrievedContext": {
        "title": "documento.pdf",
        "text": "conteúdo relevante...",
        "fileSearchStore": "fileSearchStores/xxx"
      }
    }
  ],
  "groundingSupports": [
    {
      "segment": { "text": "parte da resposta" },
      "groundingChunkIndices": [0, 1]
    }
  ]
}
```

## File Search Store

### Formato do Nome
```
fileSearchStores/{display-name}-{random-id}
```

Exemplo: `fileSearchStores/smartzapagentjulia1df9618d-skkqie1sbq3h`

### Ciclo de Vida

1. **Criar store** ao configurar knowledge base do agente
2. **Upload de arquivos** - são chunked e indexados automaticamente
3. **Usar em queries** via `google.tools.fileSearch()`
4. **Deletar store** quando agente for removido

### Parâmetros Importantes

```typescript
google.tools.fileSearch({
  fileSearchStoreNames: [storeId], // Array de stores
  topK: 5,                          // Quantos chunks retornar (default: 5)
})
```

## Formatos de Arquivo Suportados

- PDF (com OCR automático)
- Markdown (.md)
- Texto (.txt)
- CSV
- JSON

## Erros Comuns

### 1. Combinar tools
```typescript
// ❌ ERRADO - não funciona
tools: {
  file_search: google.tools.fileSearch(...),
  respond: respondTool,  // Não pode combinar!
}

// ✅ CORRETO - uma tool por vez
tools: {
  file_search: google.tools.fileSearch(...),
}
```

### 2. Store não existe (403/404)
Se o store foi deletado ou nunca existiu, a API retorna erro. Sempre verificar se `file_search_store_id` é válido antes de usar.

### 3. Forçar toolChoice com File Search
```typescript
// ❌ ERRADO - pode causar comportamento inesperado
toolChoice: 'required'

// ✅ CORRETO - deixar o modelo decidir
toolChoice: 'auto' // ou omitir (default)
```

## System Prompt

**Use EXATAMENTE o que está configurado na UI.** Não adicione instruções extras.

O File Search já injeta contexto automaticamente - não precisa de:
- "Use as informações abaixo..."
- "Baseado no contexto fornecido..."
- Qualquer modificação do prompt original

## Referências

- [AI SDK Google Provider](https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai)
- [Google File Search API](https://ai.google.dev/gemini-api/docs/file-search)
