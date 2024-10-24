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
        console.log(`JSON ${dir} aberto com sucesso!`);
        const data = await fs.readFile(dir, 'utf8');

        if (data.trim() === '') {
            console.error(`O arquivo JSON ${dir} está vazio.`);
            return [];
        }

        return JSON.parse(data);
    } catch (err) {
        console.error(`Erro ao abrir o arquivo JSON ${dir}:`, err);
        return [];
    }
}

async function save(dir, data) {
    try {
        await fs.writeFile(dir, JSON.stringify(data, null, 2), 'utf8');
        console.log(`JSON ${dir} atualizado com sucesso!`);
    } catch (err) {
        console.error(`Erro ao salvar o arquivo JSON ${dir}:`, err);
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
            countMap[key] = { count: 1, items: [] };
        }
        countMap[key].items.push(item)
    });

    // Filtrar os ids que aparecem mais de uma vez com o mesmo console
    for (const entry of Object.values(countMap)) {
        if (entry.count > 1) {
            duplicateEntries.push(entry.items);
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

async function update_roms(json, list, consol, action, dir_json) {
    // Desativa todos os itens com o console correspondente
    if (action == 'sync') {
        json
            .filter((item) => item.console === consol)
            .forEach((item) => {
                item.active = false;
            });
    }

    // Usa for...of para garantir que await funcione corretamente
    for (const filename of list) {
        let change = false;
        let change_image = false;
        let change_name = false;

        const item = json.find((item) => item.filename === filename && item.console === consol);

        let name = item ? item.name : "";
        if (name == "") {
            name = filename.replace(/\s*\(.*?\)|\s*\[.*?\]/g, ''); // Remove conteúdo entre () e []
            name = name.replace(/\.[^/.]+$/, ''); // Remove a extensão
            name = name.trim(); // Remove espaços em branco ao redor
        }

        let id = item ? item.id : "";
        if (id == "") {
            id = name.replace(/\.[^/.]+$/, ''); // Remove a extensão
            id = id.replace(/[^a-zA-Z0-9]+/g, '-');
            id = id.trim().toLowerCase();
            id = id.replace(/_{2,}/g, '-');
        }

        let image = item ? item.image : "";
        let check_image = item ? item.check_image ?? false : false;
        let check_name = item ? item.check_name ?? false : false;
        let id_igdb = item ? item.id_igdb ?? "" : "";
        let block_change = item ? item.block_change ?? false : false;

        console.log("Processando...", { id, name, consol, image })

        if (!block_change && action == 'find_image') {
            if (image === "" && !check_image) {
                try {
                    const accessToken = await getAccessToken(clientId, clientSecret);
                    let gameImage = await getGameData(name, consol, clientId, accessToken);
                    if (gameImage) {
                        if (gameImage.cover_url) {
                            image = gameImage.cover_url;
                        }
                        if (gameImage.slug) {
                            id = gameImage.slug;
                        }
                        if (gameImage.name) {
                            name = gameImage.name;
                        }
                        if (gameImage.id) {
                            id_igdb = gameImage.id;
                        }
                        console.log("Dados encontrados:", { id, name, consol, image, gameImage })
                        change = true;
                    } /*else {
                        gameImage = await getGameData(id, consol, clientId, accessToken);
                        if (gameImage && gameImage.cover_url) {
                            image = gameImage.cover_url;
                            id = gameImage.slug;
                            name = gameImage.name;
                            id_igdb = gameImage.id;
                            console.log("Imagem encontrada na 2ª análise:", { id, name, consol, image, gameImage })
                            change = true;
                        }
                    }*/
                } catch (error) {
                    console.error("Erro ao buscar a imagem:", error);
                }
                check_image = true;
                change_image = true;
            }
        }

        if (!block_change && action == 'find_name') {
            if (id_igdb != "" && !check_name) {
                const accessToken = await getAccessToken(clientId, clientSecret);
                const response = await axios.post('https://api.igdb.com/v4/games', `where id = ${id_igdb}; fields name,slug,cover.url,platforms;`, {
                    headers: {
                        'Client-ID': clientId,
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (response.data.length > 0) {
                    if (name != response.data[0].name) {
                        console.log("Nome alterado", name, response.data[0].name)
                        name = response.data[0].name;
                        change = true;
                    }
                }
                check_name = true;
                change_name = true;
            }
        }

        if (item) {
            item.active = true;
            if (check_image) {
                item.check_image = check_image;
            }
            if (check_name) {
                item.check_name = check_name;
            }
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
            change = true;
        }

        if (change || change_image || change_name) {
            await save(dir_json, json);
        }
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
                await fs.rename(path.join(__dirname, '/public', oldImagePath), path.join(__dirname, '/public', newImagePath));
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

async function getGameData(gameName, gameConsole, clientId, accessToken, gameSearch) {
    let platform = null;
    let select = true;
    if (gameSearch != undefined) {
        gameSearch = gameSearch.replace(/["']/g, '');
        select = false;
    }

    if (gameSearch != undefined && (gameSearch[0] === "*" || gameSearch[0] === ":")) {
        gameSearch = gameSearch.slice(1);
        console.log("Buscando por", gameSearch)
    } else {
        switch (gameConsole) {
            case "gens":
                platform = 29;
                break;
            case "snes":
                platform = 19;
                break;
        }
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
    if (gameSearch == undefined) {
        gameSearch = gameName;
    }

    const query = `search "${gameSearch}"; fields name,slug,cover.url,platforms;${platform ? ` where platforms = (${platform});` : ''}`;
    const response = await axios.post('https://api.igdb.com/v4/games', query, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (response.data.length > 0) {
        let game = response.data.find(g => g.slug === gameName && g.cover && g.cover.url);
        if (game && select) {
            return gameDataImage(game);
        } else {
            let game = response.data.find(g => g.name === gameName && g.cover && g.cover.url);
            if (game && select) {
                return gameDataImage(game);
            } else {
                /* if (response.data.length >= 2) {
                     return null;
                 }*/
                console.log(qQuestion(`Buscando por: "${gameSearch}"`));
                console.log(qQuestion(`Digite o numero do jogo ('0' pra nenhum):`));
                console.log(qOption(0, `${gameName} | original`));
                for (let i = 0; i < response.data.length; i++) {
                    if (response.data[i].cover && response.data[i].cover.url) {
                        console.log(qOption(i + 1, `${response.data[i].name} | https:${response.data[i].cover.url.replace('/t_thumb/', '/t_cover_big/')}`));
                    } else {
                        console.log(qOption(i + 1, `${response.data[i].name} | IMAGEM NÃO ENCONTRADA`));
                    }
                }
                console.log(qOption('*', `Se preferir, digite o valor que deseja buscar...`));
                const chosenGame = await readlineSync.question('> ');
                if (chosenGame > 0 && chosenGame <= response.data.length) {
                    game = response.data[chosenGame - 1];
                    return gameDataImage(game);
                } else if (chosenGame.startsWith('http') || chosenGame.startsWith('https')) {
                    return { cover: { cover_url: chosenGame } };
                } else if (chosenGame == 0) {
                    return null;
                } else {
                    return getGameData(gameName, gameConsole, clientId, accessToken, chosenGame);
                }
            }
        }
    } else {
        console.log(qQuestion(`Buscando por: "${gameSearch}"`));
        console.log(qQuestion(`Nada encontrado! Digite algo para buscar, ou '0' para ignorar.`));
        console.log(qOption(0, `${gameName} | original`));
        const chosenGame = await readlineSync.question('> ');
        if (chosenGame == 0) {
            return null;
        } else if (chosenGame.startsWith('http') || chosenGame.startsWith('https')) {
            return { cover: { cover_url: chosenGame } };
        } else {
            return getGameData(gameName, gameConsole, clientId, accessToken, chosenGame);
        }
    }
}

function qQuestion(value) {
    return `${value}`;
}
function qOption(key, value) {
    return `[${key}] ${value}`;
}

async function main() {
    let json;
    let consoles;
    let dupicates;

    console.log(qQuestion('Escolha uma opção:'));
    console.log(qOption(1, 'Atualizar consoles'));
    console.log(qOption(2, 'Atualizar jogos'));
    console.log(qOption(3, 'Verificar jogos em duplicidade'));
    console.log(qOption(4, 'Localizar imagens dos jogos'));
    console.log(qOption(5, 'Resetar checagem de imagens dos jogos'));
    console.log(qOption(6, 'Baixar imagens dos jogos'));
    console.log(qOption(7, 'Atualizar nomes dos jogos'));
    console.log(qOption(8, 'Resetar checagem de nomes dos jogos'));
    console.log(qOption(9, 'Apagar jogos desativados'));
    console.log(qOption(0, 'Sair'));

    const option = await readlineSync.question('> ');

    switch (option) {
        case '1':
            consoles = await get_files(dir);
            json = await open(path.join(dir_json, 'consoles.json'));
            json = update_consoles(json, consoles);
            json = await download_image(json, "console");
            await save(path.join(dir_json, 'consoles.json'), json);
            main();
            break;
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            consoles = await get_files(dir);

            dupicates = [];
            for (const consol of consoles) {
                let roms = await get_files(path.join(dir, consol));
                let json = await open(path.join(dir_json, 'roms.json'));
                let dup;

                switch (option) {
                    case '2':
                        json = await update_roms(json, roms, consol, 'sync', path.join(dir_json, 'roms.json'));
                        break;
                    case '3':
                        dup = find_duplicate_ids(json);
                        if (dup.length > 0) {
                            dupicates.push(...dup);
                        }

                        if (dupicates.length > 0) {
                            console.log(`Existem ${dupicates.length} itens duplicados!!!`, dupicates, "FIM DOS ITENS DUPLICADOS");
                        } else {
                            console.log("Não há itens duplicados!!!",);

                        }
                        break;
                    case '4':
                        json = await update_roms(json, roms, consol, 'find_image', path.join(dir_json, 'roms.json'));
                        break;
                    case '5':
                        json.forEach(item => {
                            delete item.check_image;
                        });
                        break;
                    case '6':
                        json = await download_image(json, "rom");
                        break;
                    case '7':
                        json = await update_roms(json, roms, consol, 'find_name', path.join(dir_json, 'roms.json'));
                        break;
                    case '8':
                        json.forEach(item => {
                            delete item.check_name;
                        });
                        break;
                    case '9':
                        json = json.filter(item => item.active);
                        break;
                }

                await save(path.join(dir_json, 'roms.json'), json);
            }



            main();
            break;
        default:
            return;
    }
}

main();
