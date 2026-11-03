import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const identifier = value => text(value) && !/[/\\\s?#%:\u0000-\u001f\u007f]/.test(value) && value !== '.' && value !== '..';
const file = value => text(value) && value === value.trim() && !/[\\/\u0000-\u001f\u007f?#%:]/.test(value) && value !== '.' && value !== '..';
const image = value => file(value) && /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(value);

export function validateCatalog(consoles, games) {
  const errors = [];
  const fail = (location, message) => errors.push(`${location}: ${message}`);
  const arrays = [['src/json/consoles.json', consoles], ['src/json/roms.json', games]];
  for (const [path, value] of arrays) {
    if (!Array.isArray(value) || value.length === 0) fail(path, 'esperado um array não vazio');
  }
  if (errors.length) return errors;
  const ids = new Set();
  consoles.forEach((console, index) => {
    const location = `src/json/consoles.json[${index}]`;
    if (!object(console)) return fail(location, 'esperado um objeto');
    if (!identifier(console.id)) fail(`${location}.id`, 'esperado identificador de rota sem espaços ou delimitadores de URL');
    if (ids.has(console.id)) fail(`${location}.id`, `console duplicado: ${console.id}`);
    ids.add(console.id);
    if (!text(console.name)) fail(`${location}.name`, 'esperado texto não vazio');
    if (typeof console.active !== 'boolean') fail(`${location}.active`, 'esperado booleano');
    if (!console.active) return;
    try {
      const url = new URL(console.base_url);
      if (!text(console.base_url) || !['http:', 'https:'].includes(url.protocol) || url.search || url.hash || url.username || url.password || console.base_url !== console.base_url.trim()) throw new Error();
    } catch {
      fail(`${location}.base_url`, 'esperada URL HTTP(S) absoluta sem query, fragmento ou credenciais');
    }
    if (typeof console.image !== 'string' || !console.image.startsWith('/') || !image(console.image.slice(1))) fail(`${location}.image`, 'esperado /nome-da-capa com extensão de imagem');
    if (!object(console.controls)) return fail(`${location}.controls`, 'esperado objeto de controles');
    if (!object(console.controls.player1) || Object.keys(console.controls.player1).length === 0) fail(`${location}.controls.player1`, 'esperado mapa não vazio');
    for (const [player, bindings] of Object.entries(console.controls)) {
      if (!['player1', 'player2'].includes(player) || !object(bindings) || Object.keys(bindings).length === 0) {
        fail(`${location}.controls.${player}`, 'esperado mapa não vazio de player1 ou player2');
        continue;
      }
      for (const [button, key] of Object.entries(bindings)) {
        if (!text(button) || !text(key)) fail(`${location}.controls.${player}.${button}`, 'botão e tecla devem ser textos não vazios');
      }
    }
  });
  const keys = new Set();
  games.forEach((game, index) => {
    const location = `src/json/roms.json[${index}]`;
    if (!object(game)) return fail(location, 'esperado um objeto');
    if (!identifier(game.id)) fail(`${location}.id`, 'esperado identificador de rota sem espaços ou delimitadores de URL');
    if (!text(game.name)) fail(`${location}.name`, 'esperado texto não vazio');
    if (!identifier(game.console) || !ids.has(game.console)) fail(`${location}.console`, 'console inexistente ou identificador inválido');
    const key = JSON.stringify([game.console, game.id]);
    if (keys.has(key)) fail(`${location}.id`, `combinação console + id duplicada: ${key}`);
    keys.add(key);
    if (typeof game.active !== 'boolean') fail(`${location}.active`, 'esperado booleano');
    if (!file(game.filename) || !/\.[a-z0-9]+$/i.test(game.filename)) fail(`${location}.filename`, 'esperado nome de arquivo com extensão, sem diretórios ou caracteres reservados de URL');
    if (!image(game.image)) fail(`${location}.image`, 'esperado nome de arquivo de imagem, sem diretórios ou URL absoluta');
    for (const field of ['check_image', 'check_name', 'block_change']) {
      if (field in game && typeof game[field] !== 'boolean') fail(`${location}.${field}`, 'esperado booleano');
    }
    if ('id_igdb' in game && game.id_igdb !== '' && !(Number.isSafeInteger(game.id_igdb) && game.id_igdb > 0) && !(typeof game.id_igdb === 'string' && /^[1-9][0-9]*$/.test(game.id_igdb))) fail(`${location}.id_igdb`, 'esperado ID inteiro positivo, texto numérico positivo ou texto vazio');
  });
  return errors;
}

export function checkCatalog(root = new URL('../', import.meta.url)) {
  const values = [];
  const errors = [];
  for (const path of ['src/json/consoles.json', 'src/json/roms.json']) {
    try {
      values.push(JSON.parse(readFileSync(new URL(path, root), 'utf8')));
    } catch (error) {
      errors.push(`${path}: não foi possível ler JSON válido (${error.message})`);
    }
  }
  if (!errors.length) errors.push(...validateCatalog(...values));
  if (errors.length) {
    console.error(errors.join('\n'));
    console.error(`Catálogo inválido: ${errors.length} erro(s).`);
    return 1;
  }
  console.log(`Catálogo válido: ${values[0].length} consoles e ${values[1].length} jogos.`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = checkCatalog();
}
