const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const axios = require('axios');
const readlineSync = require('readline-sync');


const dir = path.join(__dirname, 'public', 'roms');
const dir_json = path.join(__dirname, 'src', 'json');

const clientId = 'bnig3v9we3h5gvfa98c0nmhh5h2pfb';
const clientSecret = '0mjtbkz0sn882cfdy1xsxyxvgczjhy';

async function get_files(dir) {
    try {
        const files = await fs.readdir(dir);
        return files;
    } catch (err) {
        console.error('Erro ao ler o diretório:', err);
        return [];
    }
}

async function open(dir) {
    try {
        console.log('JSON aberto com sucesso!');
        const data = await fs.readFile(dir, 'utf8');

        if (data.trim() === '') {
            console.error('O arquivo JSON está vazio.');
            return [];
        }

        return JSON.parse(data);
    } catch (err) {
        console.error('Erro ao abrir o arquivo JSON:', err);
        return [];
    }
}

async function save(dir, data) {
    try {
        await fs.writeFile(dir, JSON.stringify(data, null, 2), 'utf8');
        console.log('JSON atualizado com sucesso!');
    } catch (err) {
        console.error('Erro ao salvar o arquivo JSON:', err);
    }
}


function find_duplicate_ids(data) {
    const countMap = {};
    const duplicateEntries = [];

    // Contar a ocorrência de cada combinação de id + console
    data.forEach(item => {
        const key = `${item.id}_${item.console}`; // Combinação de id e console

        if (countMap[key]) {
            countMap[key].count++;
        } else {
            countMap[key] = { count: 1, item };
        }
    });

    // Filtrar os ids que aparecem mais de uma vez com o mesmo console
    for (const entry of Object.values(countMap)) {
        if (entry.count > 1) {
            duplicateEntries.push(entry.item);
        }
    }

    return duplicateEntries;
}


function update_consoles(json, list) {
    json.forEach((item) => {
        item.active = false;
    });

    list.forEach((key) => {
        const item = json.find((item) => item.id === key);

        if (item) {
            item.active = true;
        } else {
            json.push({
                name: key,
                image: "",
                id: key,
                active: true
            });
        }
    });

    json = json.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });

    return json;
}

async function update_roms(json, list, consol, dir_json) {
    // Desativa todos os itens com o console correspondente
    json
        .filter((item) => item.console === consol)
        .forEach((item) => {
            item.active = false;
        });

    // Usa for...of para garantir que await funcione corretamente
    for (const filename of list) {
        const item = json.find((item) => item.filename === filename && item.console === consol);

        let name = filename.replace(/\s*\(.*?\)|\s*\[.*?\]/g, ''); // Remove conteúdo entre () e []
        name = name.replace(/\.[^/.]+$/, ''); // Remove a extensão
        name = name.trim(); // Remove espaços em branco ao redor

        let id = name.replace(/\.[^/.]+$/, ''); // Remove a extensão
        id = id.replace(/[^a-zA-Z0-9]+/g, '-');
        id = id.trim().toLowerCase();
        id = id.replace(/_{2,}/g, '-');

        let image = item ? item.image : "";
        let slug = item ? item.id : id;
        let id_igdb = item ? item.id_igdb ?? "" : "";

        console.log("Processando...", { id, name, consol, image })

        if (image === "") {
            try {
                const accessToken = await getAccessToken(clientId, clientSecret);
                let gameImage = await getGameData(id, consol, clientId, accessToken);
                if (gameImage && gameImage.cover_url) {
                    if (gameImage.cover_url) {
                        image = gameImage.cover_url;
                        slug = gameImage.slug;
                        name = gameImage.name;
                        id_igdb = gameImage.id;
                        console.log("Imagem encontrada:", { id, name, consol, image, gameImage })
                    }
                } else {
                    gameImage = await getGameData(name, consol, clientId, accessToken);
                    if (gameImage && gameImage.cover_url) {
                        image = gameImage.cover_url;
                        slug = gameImage.slug;
                        name = gameImage.name;
                        id_igdb = gameImage.id;
                        console.log("Imagem encontrada na 2ª análise:", { id, name, consol, image, gameImage })
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar a imagem:", error);
            }
        }

        id = slug;

        if (item) {
            item.active = true;
            item.image = image;
            item.name = name;
            item.id = id;
            item.id_igdb = id_igdb;
        } else {
            json.push({
                name,
                filename,
                image: image,
                console: consol,
                id,
                id_igdb,
                active: true
            });
        }

        await save(dir_json, json);
    }

    // Ordena o JSON pelo nome dos itens
    json = json.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });

    return json;
}


async function download_image(json, type) {
    for (const item of json) {
        // Verifica se a imagem é uma URL externa
        if (item.image.startsWith('http')) {
            const imageUrl = item.image;
            const imageExtension = path.extname(imageUrl);
            let localImagePath;
            if (type == "console") {
                localImagePath = path.join(__dirname, 'public', 'images', 'consoles', `${item.id}${imageExtension}`);
            } else {
                localImagePath = path.join(__dirname, 'public', 'images', 'roms', item.console, `${item.id}${imageExtension}`);
            }

            try {
                // Faz o download da imagem
                const response = await axios({
                    url: imageUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                // Cria o diretório se ele não existir
                const dirPath = path.dirname(localImagePath);
                try {
                    // Verifica se o diretório existe
                    await fs.access(dirPath);
                } catch (error) {
                    // Se o diretório não existir, cria-o
                    await fs.mkdir(dirPath, { recursive: true });
                }

                // Salva a imagem localmente
                const writer = fsSync.createWriteStream(localImagePath);
                response.data.pipe(writer);

                // Retorna uma promise que resolve quando a imagem foi salva
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                // Atualiza o campo 'image' para o caminho local
                if (type == "console") {
                    item.image = `/images/consoles/${item.id}${imageExtension}`;
                } else {
                    item.image = `/images/roms/${item.console}/${item.id}${imageExtension}`;
                }
                console.log(`Imagem baixada e salva em: ${item.image}`);

            } catch (error) {
                console.error(`Erro ao baixar a imagem: ${imageUrl}`, error);
            }
        }

        if (item.id.includes('--')) {
            item.id = item.id.split('--')[0];

            const oldImagePath = item.image;
            const newImagePath = oldImagePath.replace(/--[^.]+(\.[a-zA-Z0-9]+)$/, '$1');

            try {
                await fs.rename(path.join(__dirname, oldImagePath), path.join(__dirname, newImagePath));
                item.image = newImagePath;
            } catch (error) {
                console.error('Erro ao renomear a imagem:', error);
            }
        }
    }

    return json;
}


// Função para obter o token de acesso
async function getAccessToken(clientId, clientSecret) {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
        }
    });
    return response.data.access_token;
}

function gameDataImage(game) {
    let coverUrl = game.cover?.url;

    if (coverUrl) {
        coverUrl = 'https:' + coverUrl.replace('/t_thumb/', '/t_cover_big/');
    }

    game["cover_url"] = coverUrl;
    return game;
}

async function getGameData(gameName, gameConsole, clientId, accessToken) {
    let platform = null;
    switch (gameConsole) {
        case "gens":
            platform = 29;
            break;
        case "snes":
            platform = 19;
            break;
    }
    /*
     {
    id: 29,
    abbreviation: 'Genesis/MegaDrive',
    alternative_name: 'Sega Genesis',
    name: 'Sega Mega Drive/Genesis',
    slug: 'genesis-slash-megadrive'
  },
  {
    id: 78,
    abbreviation: 'segacd',
    alternative_name: 'Mega CD',
    name: 'Sega CD',
    slug: 'segacd'
  },
    {
    id: 19,
    abbreviation: 'SNES',
    alternative_name: 'SNES, Super Nintendo',
    name: 'Super Nintendo Entertainment System',
    slug: 'snes'
  },
     */
    /*
    const responsePlatforms = await axios.post('https://api.igdb.com/v4/platforms', `search "nintendo"; fields id,slug,name,abbreviation,alternative_name;`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    console.log("Plataformas:", responsePlatforms.data);
    return;
*/

    const response = await axios.post('https://api.igdb.com/v4/games', `search "${gameName}"; fields name,slug,cover.url,platforms; where platforms = (${platform});`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (response.data.length > 0) {
        let game = response.data.find(g => g.slug === gameName);
        if (game) {
            return gameDataImage(game);
        } else {
            let game = response.data.find(g => g.name === gameName);
            if (game) {
                return gameDataImage(game);
            } else {
                /*  if (response.data.length >= 2) {
                      return null;
                  }*/
                /*   console.log(`Digite o numero do jogo correto para "${gameName}" (ou '0' pra nenhum):`);
                   for (let i = 0; i < response.data.length; i++) {
                       if (response.data[i].cover && response.data[i].cover.url) {
                           console.log(`${i + 1} - ${response.data[i].name} | https:${response.data[i].cover.url.replace('/t_thumb/', '/t_cover_big/')}`);
                       } else {
                           console.log(`${i + 1} - ${response.data[i].name} | IMAGEM NÃO ENCONTRADA`);
                       }
                   }
                   const chosenGame = await readlineSync.question('> ');
                   if (chosenGame > 0 && chosenGame <= response.data.length) {
                       game = response.data[chosenGame - 1];
                       return gameDataImage(game);
                   }*/
            }
        }
        return null;
    } else {
        return null;
    }
}

async function main() {
    /*  let id = 'aladdin';
      let consol = 'snes';
      const accessToken = await getAccessToken(clientId, clientSecret);
      const gameImage = await getGameData(id, consol, clientId, accessToken);
      if (gameImage) {
          if (gameImage.cover_url) {
              image = gameImage.cover_url;
              console.log("Imagem encontrada:", { id })
          }
      }
  
      return;
  */

    //Atualiza Consoles
    const consoles = await get_files(dir);
    let json = await open(path.join(dir_json, 'consoles.json'));
    json = update_consoles(json, consoles);
    json = await download_image(json, "console");
    await save(path.join(dir_json, 'consoles.json'), json);

    //Atualiza Jogos
    let dupicates = [];
    for (const consol of consoles) {
        let roms = await get_files(path.join(dir, consol));
        let json = await open(path.join(dir_json, 'roms.json'));
        json = await update_roms(json, roms, consol, path.join(dir_json, 'roms.json'));
        let dup = find_duplicate_ids(json);
        if (dup.length > 0) {
            dupicates.push(...dup);
        }
        json = await download_image(json, "rom");
        await save(path.join(dir_json, 'roms.json'), json);
    }

    if (dupicates.length > 0) {
        console.log("Existem items duplicados!!!", dupicates);
    }
}

main();
