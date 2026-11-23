const form = document.querySelector("#ask");
if (form) {
  const input = document.querySelector("#question");
  const messages = document.querySelector("#messages");
  let busy = false;
  function element(tag, text, parent) {
    const el = document.createElement(tag);
    el.textContent = text;
    parent.append(el);
    return el;
  }
  function action(label, parent, run) {
    const button = element("button", label, parent);
    button.className = "choice";
    button.onclick = run;
    return button;
  }
  async function ask(question, retry = false) {
    if (busy || !question.trim()) return;
    busy = true;
    form.querySelector("button").disabled = true;
    document.querySelector("#welcome").hidden = true;
    if (!retry) element("p", question, messages).className = "bubble mine";
    const box = element("article", "", messages);
    box.className = "bubble";
    element("b", "ST&T One", box);
    const reply = element("p", "Consultando…", box);
    input.value = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type":"application/json","X-CSRF-Token":document.querySelector('meta[name="csrf"]').content},
        body: JSON.stringify({pregunta:question})
      });
      if (response.status === 401) { location.assign("/acceso"); return; }
      if (!response.ok) throw new Error();
      const data = await response.json();
      reply.textContent = data.text;
      if (data.source) {
        const link = element("a", data.source.label, box);
        link.href = data.source.href;
        link.target = "_blank";
        link.rel = "noopener";
      }
      for (const name of data.choices || []) action(name, box, () => ask(name));
    } catch {
      reply.textContent = "No se pudo completar la consulta.";
      action("Reintentar", box, () => { if (!busy) {box.remove(); ask(question, true);} });
    } finally {
      busy = false;
      form.querySelector("button").disabled = false;
      input.focus({preventScroll:true});
      form.scrollIntoView({block:"nearest"});
    }
  }
  document.querySelectorAll("[data-question]").forEach(b => b.onclick = () => ask(b.dataset.question));
  form.onsubmit = event => {event.preventDefault(); ask(input.value.trim());};
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  const shortcuts = {perfil:"¿Qué datos hay en mi perfil?", proyectos:"¿En qué proyectos participo?"};
  const shortcut = new URLSearchParams(location.search).get("consulta");
  if (Object.hasOwn(shortcuts, shortcut)) ask(shortcuts[shortcut]);
}

