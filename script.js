// Chave para identificar os dados salvos pela nossa aplicação no navegador.
const STORAGE_KEY = "prompts_storage"

// Estado carregar os promts salvos e exibir.
const state = {
  prompts: [],
  selectedId: null,
}
// Seletores dos elementos HTML por ID
const elements = {
  promptTitle: document.getElementById("prompt-title"),
  promptContent: document.getElementById("prompt-content"),
  titleWrapper: document.getElementById("title-wrapper"),
  contentWrapper: document.getElementById("content-wrapper"),
  btnOpen: document.getElementById("btn-open"),
  btnCollapse: document.getElementById("btn-collapse"),
  sidebar: document.querySelector(".sidebar"),
  btnSave: document.getElementById("btn-save"),
  list: document.getElementById("prompt-list"),
  search: document.getElementById("search-input"),
  btnNew: document.getElementById("btn-new"),
  btnCopy: document.getElementById("btn-copy"),
}

// Atualiza o estado do wrapper conforme o conteúdo do elemento
function updateEditableWrapperState(element, wrapper) {
  const hasText = element.textContent.trim().length > 0
  wrapper.classList.toggle("is-empty", !hasText)
}

// Funções para abrir e fechar a sidebar
function openSidebar() {
  const isMobile = window.innerWidth <= 950
  elements.btnOpen.style.display = "none"

  if (isMobile) {
    elements.sidebar.classList.add("open")
  } else {
    elements.sidebar.classList.remove("collapsed")
  }
}

function closeSidebar() {
  const isMobile = window.innerWidth <= 950
  elements.btnOpen.style.display = "block"

  if (isMobile) {
    elements.sidebar.classList.remove("open")
  } else {
    elements.sidebar.classList.add("collapsed")
  }
}
// Atualiza o estado de todos os elementos editáveis
function updateAllEditableStates() {
  updateEditableWrapperState(elements.promptTitle, elements.titleWrapper)
  updateEditableWrapperState(elements.promptContent, elements.contentWrapper)
}

// Adiciona ouvintes de input para atualizar wrappers em tempo real
function attachAllEditableHandlers() {
  elements.promptTitle.addEventListener("input", function () {
    updateEditableWrapperState(elements.promptTitle, elements.titleWrapper)
  })
  elements.promptContent.addEventListener("input", function () {
    updateEditableWrapperState(elements.promptContent, elements.contentWrapper)
  })
}

function save() {
  const title = elements.promptTitle.textContent.trim()
  const content = elements.promptContent.innerHTML.trim()
  const hasContent = elements.promptContent.textContent.trim()

  if (!title || !hasContent) {
    alert("Por favor, preencha tanto o título quanto o conteúdo do prompt.")
    return
  }

  if (state.selectedId) {
    // Editando um prompt existente
    const existinPrompt = state.prompts.find((p) => p.id === state.selectedId)

    if (existinPrompt) {
      existinPrompt.title = title || "Sem título"
      existinPrompt.content = content || "Sem conteúdo"
    }
  } else {
    // Criando um novo prompt
    const newPrompt = {
      id: Date.now().toString(36),
      title,
      content,
    }
    state.prompts.unshift(newPrompt)
    state.selectedId = newPrompt.id
  }
  renderList(elements.search.value)
  persist()
  alert("Prompt salvo com sucesso!")
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prompts))
  } catch (error) {
    console.log("Erro ao salvar no localStorage", error)
  }
}

function load() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    state.prompts = stored ? JSON.parse(stored) : []
    state.selectedId = null
  } catch (error) {
    console.log("Erro ao carregar do localStorage", error)
  }
}

function createPromptItem(prompt) {
  const temporario = document.createElement("div")
  temporario.innerHTML = prompt.content
  return `
      <li class="prompt-item" data-id="${prompt.id}" data-action="select">
        <div class="prompt-item-content">
          <div class="prompt-item-title">${prompt.title}</div>
          <div class="prompt-item-description">${temporario.textContent}</div>
        </div>
        <button class="btn-icon" aria-label="Remover prompt" data-action="remove">
          <img src="./assets/remove.svg" alt="Remover" class="icon icon-trash" />
        </button>
      </li>
  `
}

function renderList(filterText = "") {
  const filteredPrompts = state.prompts
    .filter((prompt) =>
      prompt.title.toLowerCase().includes(filterText.toLowerCase().trim())
    )
    .map((p) => createPromptItem(p))
    .join("")
  elements.list.innerHTML = filteredPrompts
}

function newPrompt() {
  elements.search.value = "" // ✅ limpa o campo de busca
  renderList("") // ✅ recarrega a lista completa
  state.selectedId = null
  elements.promptTitle.textContent = ""
  elements.promptContent.textContent = ""
  updateAllEditableStates()
  elements.promptTitle.focus()
}

function copySelected() {
  try {
    const content = elements.promptContent

    if (!navigator.clipboard) {
      console.error("Clipboard API não suportada neste ambiente.")
      return
    }
    navigator.clipboard.writeText(content.innerText)
    alert("Conteúdo copiado para a área de transferência!")
  } catch (error) {
    console.log("Erro ao copiar para a área de transferência", error)
  }
}

// Eventos
elements.btnSave.addEventListener("click", save)
elements.btnNew.addEventListener("click", newPrompt)
elements.btnCopy.addEventListener("click", copySelected)

elements.search.addEventListener("input", function (event) {
  renderList(event.target.value)
})
elements.list.addEventListener("click", function (event) {
  const removeBtn = event.target.closest("[data-action='remove']")
  const item = event.target.closest("[data-id]")

  if (!item) return

  const id = item.getAttribute("data-id")
  state.selectedId = id

  if (removeBtn) {
    // deseja remover
    const confirm = window.confirm(
      "Tem certeza que deseja remover este prompt?"
    )
    if (!confirm) return
    // Remover prompt
    state.prompts = state.prompts.filter((p) => p.id !== id)
    renderList(elements.search.value)
    persist()
    return
  }
  if (event.target.closest("[data-action='select']")) {
    const prompt = state.prompts.find((p) => p.id === id)

    if (prompt) {
      elements.promptTitle.textContent = prompt.title
      elements.promptContent.innerHTML = prompt.content
      updateAllEditableStates()
    }
  }
})

// Inicializa os handlers e faz a verificação inicial dos estados.
function init() {
  load()
  renderList("")
  attachAllEditableHandlers()
  updateAllEditableStates()

  // Estado inicial: sidebar aberta (desktop) ou fechada (mobile)

  if (window.innerWidth <= 950) {
    elements.sidebar.classList.remove("open")
    elements.btnOpen.style.display = "block"
  } else {
    elements.sidebar.classList.remove("collapsed")
    elements.btnOpen.style.display = "none"
  }
  // Evento de “resize”
  window.addEventListener("resize", () => {
    if (window.innerWidth > 950) {
      elements.sidebar.classList.remove("open")
      elements.btnOpen.style.display = "none"
    } else {
      elements.sidebar.classList.remove("collapsed")
      elements.sidebar.classList.remove("open")
      elements.btnOpen.style.display = "block"
    }
  })
  // Eventos para abrir/fechar sidebar
  elements.btnOpen.addEventListener("click", openSidebar)
  elements.btnCollapse.addEventListener("click", closeSidebar)
}

// Executa init quando o DOM estiver pronto
init()
