import React, { useMemo, useState } from "react";
import { FiCpu, FiRefreshCw, FiSend, FiSettings, FiX } from "react-icons/fi";
import "./AiAssistantWidget.css";

const PROVIDERS = {
  openai: {
    label: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    authRequired: true,
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"]
  },
  gemini: {
    label: "Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    authRequired: true,
    models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
  },
  anthropic: {
    label: "Anthropic",
    endpoint: "https://api.anthropic.com/v1/messages",
    authRequired: true,
    models: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"]
  },
  ollama: {
    label: "Ollama/Local",
    endpoint: "http://localhost:11434/v1/chat/completions",
    authRequired: false,
    models: ["llama3.1", "llama3.2", "mistral", "gemma2"]
  }
};

const DEFAULT_PROVIDER = "openai";
const CUSTOM_MODEL = "custom";

const createDefaultConfig = (providerId = DEFAULT_PROVIDER) => {
  const provider = PROVIDERS[providerId];

  return {
    provider: providerId,
    endpoint: provider.endpoint,
    model: provider.models[0],
    customModel: "",
    apiKey: ""
  };
};

const DEFAULT_CONFIG = createDefaultConfig();

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content: "Conexao ativa. Pergunte sobre os dados visiveis no dashboard.",
    localOnly: true
  }
];

const getDashboardContext = () => {
  if (typeof document === "undefined") return "Dashboard indisponivel no momento.";

  const schema = document.documentElement.getAttribute("data-dashboard-schema") || "default";
  const dashboardText = document.querySelector(".dashboard-container")?.innerText || "";
  const compactText = dashboardText.replace(/\s+/g, " ").trim().slice(0, 6000);
  const analyticsContext = document.documentElement.getAttribute("data-dashboard-ai-context");

  return [
    `Aba/schema atual: ${schema}.`,
    "Use prioritariamente o contexto analitico estruturado do dashboard. Use o texto visivel apenas como complemento.",
    analyticsContext
      ? `Contexto analitico estruturado: ${analyticsContext.slice(0, 12000)}`
      : "Contexto analitico estruturado indisponivel.",
    compactText ? `Conteudo visivel: ${compactText}` : "Nenhum conteudo visivel capturado."
  ].join("\n");
};

const getActiveModel = (config) =>
  config.model === CUSTOM_MODEL ? config.customModel.trim() : config.model.trim();

const toConversationMessages = (messages) =>
  messages
    .filter((message) => !message.localOnly && (message.role === "user" || message.role === "assistant"))
    .map(({ role, content }) => ({ role, content }));

const buildProviderRequest = (config, nextMessages) => {
  const provider = PROVIDERS[config.provider];
  const model = getActiveModel(config);
  const systemPrompt = `Voce e um assistente de BI. Responda em portugues, de forma objetiva.\n\n${getDashboardContext()}`;

  if (config.provider === "gemini") {
    return {
      url: `${config.endpoint.replace(/\/$/, "")}/${encodeURIComponent(model)}:generateContent`,
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey.trim()
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: nextMessages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }]
          })),
          generationConfig: { temperature: 0.2 }
        })
      }
    };
  }

  if (config.provider === "anthropic") {
    return {
      url: config.endpoint.trim(),
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey.trim(),
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          temperature: 0.2,
          system: systemPrompt,
          messages: toConversationMessages(nextMessages)
        })
      }
    };
  }

  return {
    url: config.endpoint.trim(),
    options: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(provider.authRequired ? { Authorization: `Bearer ${config.apiKey.trim()}` } : {})
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...toConversationMessages(nextMessages)
        ]
      })
    }
  };
};

const extractProviderAnswer = (providerId, data) => {
  if (providerId === "gemini") {
    return data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  if (providerId === "anthropic") {
    return data?.content
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return data?.choices?.[0]?.message?.content?.trim();
};

const getProviderErrorMessage = async (response) => {
  const body = await response.text();

  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message || parsed?.message || body;
  } catch {
    return body;
  }
};

const AiAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const canConnect = useMemo(
    () => {
      const provider = PROVIDERS[config.provider];
      const hasAuth = !provider.authRequired || config.apiKey.trim();
      return config.endpoint.trim() && getActiveModel(config) && hasAuth;
    },
    [config]
  );

  const updateConfig = (field) => (event) => {
    setConfig((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };

  const updateProvider = (event) => {
    setConfig(createDefaultConfig(event.target.value));
    setError("");
  };

  const connect = (event) => {
    event.preventDefault();

    if (!canConnect) {
      setError("Preencha provedor, URL, modelo e chave quando exigida.");
      return;
    }

    setIsConnected(true);
    setMessages(INITIAL_MESSAGES);
    setError("");
  };

  const resetSession = () => {
    setIsConnected(false);
    setConfig(createDefaultConfig());
    setMessages([]);
    setDraft("");
    setError("");
    setIsSending(false);
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    const question = draft.trim();
    if (!question || isSending) return;

    const nextMessages = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setIsSending(true);

    try {
      const request = buildProviderRequest(config, nextMessages);
      const response = await fetch(request.url, request.options);

      if (!response.ok) {
        const message = await getProviderErrorMessage(response);
        throw new Error(message || `Falha na API: ${response.status}`);
      }

      const data = await response.json();
      const answer = extractProviderAnswer(config.provider, data);

      if (!answer) throw new Error("A API nao retornou uma resposta valida.");

      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel consultar o servico de IA.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="ai-assistant">
      {isOpen ? (
        <section className="ai-assistant__panel" aria-label="Assistente de IA">
          <header className="ai-assistant__header">
            <div className="ai-assistant__title">
              <FiCpu aria-hidden="true" />
              <span>Assistente IA</span>
            </div>

            <div className="ai-assistant__actions">
              {isConnected ? (
                <button type="button" onClick={resetSession} aria-label="Resetar sessao" title="Resetar sessao">
                  <FiRefreshCw aria-hidden="true" />
                </button>
              ) : null}
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Fechar assistente" title="Fechar">
                <FiX aria-hidden="true" />
              </button>
            </div>
          </header>

          {isConnected ? (
            <>
              <div className="ai-assistant__messages" aria-live="polite">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`ai-assistant__message ai-assistant__message--${message.role}`}
                  >
                    {message.content}
                  </div>
                ))}
                {isSending ? (
                  <div className="ai-assistant__message ai-assistant__message--assistant">
                    Processando...
                  </div>
                ) : null}
              </div>

              {error ? <p className="ai-assistant__error">{error}</p> : null}

              <form className="ai-assistant__composer" onSubmit={sendMessage}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Pergunte sobre o dashboard..."
                  rows={2}
                />
                <button type="submit" disabled={!draft.trim() || isSending} aria-label="Enviar pergunta">
                  <FiSend aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <form className="ai-assistant__connection" onSubmit={connect}>
              <label>
                Provedor de IA
                <select value={config.provider} onChange={updateProvider}>
                  {Object.entries(PROVIDERS).map(([id, provider]) => (
                    <option key={id} value={id}>
                      {provider.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                URL da API de IA
                <input value={config.endpoint} onChange={updateConfig("endpoint")} placeholder={DEFAULT_CONFIG.endpoint} />
              </label>

              <label>
                Modelo
                <select value={config.model} onChange={updateConfig("model")}>
                  {PROVIDERS[config.provider].models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                  <option value={CUSTOM_MODEL}>Outro modelo...</option>
                </select>
              </label>

              {config.model === CUSTOM_MODEL ? (
                <label>
                  Nome do modelo
                  <input
                    value={config.customModel}
                    onChange={updateConfig("customModel")}
                    placeholder="Digite o identificador do modelo"
                  />
                </label>
              ) : null}

              <label>
                Chave de API {PROVIDERS[config.provider].authRequired ? "" : "(opcional)"}
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={updateConfig("apiKey")}
                  placeholder="Insira sua chave somente para esta sessao"
                  autoComplete="off"
                />
              </label>

              {error ? <p className="ai-assistant__error">{error}</p> : null}

              <button type="submit" className="ai-assistant__connect-btn" disabled={!canConnect}>
                Conectar
              </button>
            </form>
          )}
        </section>
      ) : null}

      <button
        type="button"
        className="ai-assistant__fab"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Abrir assistente de IA"
        title="Assistente de IA"
      >
        {isConnected ? <FiCpu aria-hidden="true" /> : <FiSettings aria-hidden="true" />}
      </button>
    </div>
  );
};

export default AiAssistantWidget;
