const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const state = JSON.parse(localStorage.getItem('ai-tool-builder') || '{"tools":[]}');
let toastTimer;

function flash(message = 'Saved automatically') {
  $('#saveState').textContent = '● Saving…';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    localStorage.setItem('ai-tool-builder', JSON.stringify(state));
    $('#saveState').textContent = '● Saved';
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    setTimeout(() => $('#toast').classList.remove('show'), 1800);
  }, 350);
}

$$('.editor-tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.editor-tab, .panel').forEach(el => el.classList.remove('active'));
  tab.classList.add('active');
  $(`#${tab.dataset.panel}-panel`).classList.add('active');
}));

$('#promptText').addEventListener('input', () => flash());
$('#creativity').addEventListener('input', (e) => { $('#creativityValue').textContent = e.target.value; flash(); });
$('#themeToggle').addEventListener('click', () => { document.body.classList.toggle('light'); $('#themeToggle i').textContent = document.body.classList.contains('light') ? 'Light' : 'Dark'; flash('Appearance saved'); });
$('#newTool').addEventListener('click', () => { $('#modal').classList.add('open'); $('#newToolName').focus(); });
['#closeModal', '#cancelModal'].forEach(s => $(s).addEventListener('click', () => $('#modal').classList.remove('open')));
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) $('#modal').classList.remove('open'); });
$('#createTool').addEventListener('click', () => {
  const name = $('#newToolName').value.trim() || 'Untitled AI tool';
  const description = $('#newToolDesc').value.trim() || 'A custom AI tool ready for your workflow.';
  state.tools.push({ name, description, createdAt: Date.now() });
  $('#toolTitle').textContent = name; $('#crumbName').textContent = name; $('#toolDescription').textContent = description;
  $('#toolCount').textContent = state.tools.length;
  $('#newToolName').value = ''; $('#newToolDesc').value = ''; $('#modal').classList.remove('open'); flash('New tool created');
});
$('#duplicateTool').addEventListener('click', () => { state.tools.push({ name: `${$('#toolTitle').textContent} copy`, createdAt: Date.now() }); $('#toolCount').textContent = state.tools.length; flash('Tool duplicated'); });
$('#addVariable').addEventListener('click', () => { const n = `new_variable_${$('#variables').children.length + 1}`; $('#variables').insertAdjacentHTML('beforeend', `<button class="variable"><b>{ }</b><span>${n}</span><i>Text</i><em>›</em></button>`); flash('Input variable added'); });
$('#addField').addEventListener('click', () => { $('#formPreview').insertAdjacentHTML('beforeend', `<label>New field <input placeholder="Add a helpful placeholder" /></label>`); flash('Form field added'); });
$('#addStep').addEventListener('click', () => { $('#workflowCanvas').insertAdjacentHTML('beforeend', `<div class="flow-line"></div><div class="flow-card action"><span>✦</span><div><b>New workflow step</b><small>AI action</small></div><em>•••</em></div>`); flash('Workflow step added'); });
$('#runTool').addEventListener('click', () => { $('.editor-tab[data-panel="output"]').click(); flash('Demo output generated'); });
$('#templateButton').addEventListener('click', () => { $('#promptText').value += '\n\nReturn the response in a polished, scannable format.'; flash('Template guidance added'); });
$('#searchButton').addEventListener('click', () => { $('#toast').textContent = 'Search is ready — press ⌘ K to create a tool'; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 2400); });
document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#newTool').click(); } if (e.key === 'Escape') $('#modal').classList.remove('open'); });
