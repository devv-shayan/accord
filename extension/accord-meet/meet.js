(() => {
  let joined = false, leaveTimer, busy = false, root, title, controls, status;
  const isJoined = () => [...document.querySelectorAll('button')].some(button =>
    /leave call|leave the call|end call/i.test(button.getAttribute('aria-label') || button.getAttribute('data-tooltip') || '') ||
    [...button.querySelectorAll('i,span')].some(icon => icon.textContent.trim() === 'call_end'));
  const info = () => ({ joined: isJoined(), title: document.title.replace(/\s*[-–]\s*Google Meet.*$/i, '').replace(/^Meet\s*[-–]\s*/i, '').slice(0,160), participants: [] });
  async function send(type, extra = {}) {
    const result = await chrome.runtime.sendMessage({ type, ...extra });
    if (result?.error) throw new Error(result.error);
    return result;
  }
  function button(label, type) {
    const button = document.createElement('button'); button.textContent = label;
    button.type = 'button';
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { await send(type); await refresh(); }
      catch (error) { status.textContent = error.message; }
      finally { button.disabled = false; }
    });
    return button;
  }
  function show() {
    if (root) return;
    root = document.createElement('div'); root.id = 'accord-recording-control';
    root.style.cssText = 'position:fixed;bottom:92px;right:20px;z-index:2147483647;max-width:300px';
    const shadow = root.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = ':host{font-family:system-ui,sans-serif}section{background:#191b1f;color:#f5f5f5;border:1px solid #494339;border-radius:12px;padding:14px;box-shadow:0 8px 28px #0006}h2{margin:0;font-size:14px}p{font-size:12px;line-height:1.6;margin:8px 0}nav{display:flex;gap:6px;flex-wrap:wrap}button{font:inherit;font-size:12px;color:inherit;background:#30333a;border:1px solid #575a61;border-radius:6px;padding:7px 9px;cursor:pointer}button:focus-visible{outline:2px solid #edc36d}button:disabled{opacity:.5}.status{color:#edc36d}.hide{float:right;border:0;padding:0 4px;background:none}';
    shadow.append(style);
    const section = document.createElement('section'); section.setAttribute('aria-label','Accord recording controls');
    const hide = document.createElement('button'); hide.className = 'hide'; hide.textContent = '×'; hide.title = 'Hide Accord controls'; hide.addEventListener('click', () => { root.remove(); root = null; });
    title = document.createElement('h2'); title.textContent = 'Accord Meet';
    status = document.createElement('p'); status.className = 'status'; status.setAttribute('role','status');
    controls = document.createElement('nav');
    section.append(hide,title,status,controls); shadow.append(section); document.documentElement.append(root);
  }
  async function refresh() {
    if (!root) return;
    const result = await send('status');
    const active = result.active;
    controls.replaceChildren();
    if (active) {
      const minutes = Math.floor(active.durationSeconds / 60), seconds = Math.floor(active.durationSeconds % 60);
      status.textContent = `${active.status === 'paused' ? 'Paused' : 'Recording'} · ${minutes}:${String(seconds).padStart(2,'0')} · Mic ${active.microphone ? 'on' : 'off'}`;
      if (active.status !== 'saving' && active.status !== 'starting') controls.append(button(active.status === 'paused' ? 'Resume' : 'Pause',active.status === 'paused' ? 'resume' : 'pause'),button('Mark moment','mark'),button('Stop and save','stop'));
      if (active.error) status.textContent += ` · ${active.error}`;
    } else status.textContent = 'Click Accord in the Chrome toolbar to start. Pin the extension to keep its controls in view.';
  }
  async function inspect() {
    if (busy) return;
    const nowJoined = isJoined();
    if (nowJoined) {
      clearTimeout(leaveTimer);
      if (!joined) {
        joined = true; busy = true;
        try { const result = await send('joined'); if (result.connected) { show(); await refresh(); } }
        catch { /* Accord may not yet be connected. */ }
        finally { busy = false; }
      }
    } else if (joined && !leaveTimer) {
      leaveTimer = setTimeout(() => {
        leaveTimer = undefined;
        if (isJoined()) return;
        joined = false; void send('left').catch(() => undefined); root?.remove(); root = null;
      }, 2500);
    }
  }
  new MutationObserver(() => void inspect()).observe(document.documentElement, { subtree:true, childList:true });
  chrome.runtime.onMessage.addListener((message, _sender, reply) => {
    if (message.type === 'meet-info') reply(info());
  });
  setInterval(() => { void inspect(); if (joined && root) void refresh().catch(() => undefined); },5000);
  void inspect();
})();
