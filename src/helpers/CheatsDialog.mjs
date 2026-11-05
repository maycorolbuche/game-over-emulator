import { formatCode, newEntry } from './Cheats.mjs';

// DOM text properties keep user codes/descriptions out of HTML interpolation.
export async function open(Swal, { profile, entries, target, onChange, active }) {
  const root = document.createElement('div');
  root.className = 'cheats-dialog';
  const form = document.createElement('form');
  const select = document.createElement('select');
  select.id = 'cheat-format';
  const formats = profile?.formats?.length ? profile.formats : [{ id: 'free', label: 'Livre', masks: [] }];
  for (const format of formats) {
    const option = document.createElement('option'); option.value = format.id; option.textContent = format.label;
    select.append(option);
  }
  select.value = profile?.default_format || 'free';
  const code = document.createElement('textarea'); code.id = 'cheat-code'; code.rows = 3; code.maxLength = 240;
  code.autocomplete = 'off'; code.spellcheck = false;
  const description = document.createElement('input'); description.id = 'cheat-description'; description.maxLength = 160;
  const hint = document.createElement('small');
  const selected = () => formats.find(format => format.id === select.value);
  const updateHint = () => {
    const masks = selected()?.masks || [];
    hint.textContent = masks.length ? `Formato: ${masks.join(' ou ')}` : 'Digitação livre. Códigos com várias linhas ficam no mesmo cheat.';
    code.placeholder = masks[0] || 'Cole o código aqui';
  };
  select.addEventListener('change', updateHint);
  code.addEventListener('blur', () => { code.value = formatCode(code.value, selected()); });
  for (const [text, input] of [['Formato', select], ['Código', code], ['Descrição', description]]) {
    const label = document.createElement('label'); label.htmlFor = input.id; label.textContent = text;
    form.append(label, input);
    if (input === code) form.append(hint);
  }
  const add = document.createElement('button'); add.type = 'submit'; add.className = 'swal2-confirm swal2-styled'; add.textContent = 'Adicionar';
  form.append(add);
  const list = document.createElement('div'); list.className = 'cheats-list';
  const note = document.createElement('small');
  note.textContent = 'Os códigos dependem do jogo e da região. Desativar impede novas aplicações; efeitos já gravados no jogo podem exigir reinício.';
  root.append(form, list, note);
  let current = entries;
  const persist = next => {
    if (!active()) throw new Error('A sessão deste jogo foi encerrada.');
    current = onChange(next);
    Swal.resetValidationMessage();
    render();
  };
  const fail = error => Swal.showValidationMessage(error.message || 'Não foi possível atualizar os cheats.');
  function render() {
    list.replaceChildren();
    if (!current.length) {
      const empty = document.createElement('p'); empty.textContent = 'Nenhum cheat adicionado para este jogo.'; list.append(empty);
    }
    for (const entry of current) {
      const row = document.createElement('label'); row.className = 'cheat-row';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = entry.enabled;
      checkbox.setAttribute('aria-label', `Ativar ${entry.description}`);
      const text = document.createElement('span');
      const title = document.createElement('strong'); title.textContent = entry.description;
      const value = document.createElement('code'); value.textContent = entry.code;
      text.append(title, value); row.append(checkbox, text); list.append(row);
      checkbox.addEventListener('change', () => {
        try { persist(current.map(item => item.id === entry.id ? { ...item, enabled: checkbox.checked } : item)); }
        catch (error) { checkbox.checked = entry.enabled; fail(error); }
      });
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const entry = newEntry(code.value, description.value, selected());
      persist([...current, entry]);
      code.value = ''; description.value = ''; code.focus();
    } catch (error) { fail(error); }
  });
  updateHint(); render();
  return Swal.fire({
    title: 'Cheats', html: root, target, confirmButtonText: 'Voltar ao jogo',
    heightAuto: false, width: 620, focusConfirm: false, allowOutsideClick: false,
    customClass: { htmlContainer: 'cheats-content' },
    didOpen: () => code.focus(),
  });
}
