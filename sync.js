const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const axios = require('axios');

const dir = path.join(__dirname, 'public', 'roms');
const dir_json = path.join(__dirname, 'src', 'json');

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

function update_roms(json, list, consol) {
    json
        .filter((item) => item.console === consol)
        .forEach((item) => {
            item.active = false;
        });

    list.forEach((filename) => {
        const item = json.find((item) => item.filename === filename && item.console === consol);

        let name = filename.replace(/\s*\(.*?\)|\s*\[.*?\]/g, ''); // Remove conteúdo entre () e []
        name = name.replace(/\.[^/.]+$/, ''); // Remove a extensão
        name = name.trim(); // Remove espaços em branco ao redor

        let id = name.replace(/\.[^/.]+$/, ''); // Remove a extensão
        id = id.replace(/[^a-zA-Z0-9]+/g, '_');
        id = id.trim().toLowerCase();
        id = id.replace(/_{2,}/g, '_');

        if (item) {
            item.active = true;
        } else {
            json.push({
                name,
                filename,
                image: "",
                console: consol,
                id,
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
                    console.log('O diretório já existe.');
                } catch (error) {
                    // Se o diretório não existir, cria-o
                    await fs.mkdir(dirPath, { recursive: true });
                    console.log('Diretório criado:', dirPath);
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
    }

    return json;
}

async function main() {
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
        json = update_roms(json, roms, consol);
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
