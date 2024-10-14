const base_URL = "https://pokeapi.co/api/v2/pokemon/";
const batchSize = 20;
let currentBatch = 0;
const maxPokemonId = 649;
const unovaDexCount = 156;
let nextBatchStartId = 494 + batchSize;
let pokemonList = [];
let filteredPokemonList = [];
let loadedPokemonArray = [];
let currentPokemonIndex = 0;
const funFacts = [
    "Did you know? Charizard can't learn the move Fly in the original Pokémon Red and Blue games despite having wings.",
    "Did you know? Meowth is the only Pokémon capable of speaking human language, thanks to extensive self-teaching.",
    "Did you know? Wobbuffet's blue body isn't its main form; the real Pokémon is its black tail with eyes.",
    "Did you know? Gyarados is inspired by a Chinese myth about a carp that transforms into a dragon after swimming up a waterfall.",
    "Did you know? In the Pokémon world, Porygon was the first artificial Pokémon created entirely from computer programming.",
    "Did you know? Eevee has the most evolutions of any Pokémon, with eight different forms known as 'Eeveelutions.'",
    "Did you know? Ash Ketchum never ages in the Pokémon series because the creators wanted to maintain a sense of timeless adventure.",
    "Did you know? Slowpoke takes five seconds to feel pain from an attack due to its notoriously slow reaction time."
];

function createPokemonDiv(pokemon, index) {
    const id = `#${(pokemon.id - 494).toString().padStart(3, '0')}`;
    const name = pokemon.name.split('-')[0].charAt(0).toUpperCase() + pokemon.name.split('-')[0].slice(1);
    const background = getPokemonBackground(pokemon);
    const sprite = pokemon.sprites.other['official-artwork'].front_default;
    const types = pokemon.types;

    return getPokemonCardTemplate(id, name, background, sprite, types, filteredPokemonList.length > 0 ? filteredPokemonList.indexOf(pokemon) : index);
}

function getPokemonCardTemplate(id, name, background, sprite, types, index) {
    return `
        <div class="pokemon-card" 
             onclick="showPokemonModal(${index})" 
             style="background: ${background};">
            <div class="pokemon-id">${id}</div>
            <p class="pokemonName">${name}</p>
            <img src="${sprite}" alt="${name} artwork" class="pokemon-image">
            <div class="pokemon-types">
                ${types.map(typeInfo => `<img src="types/${typeInfo.type.name}.png" alt="${typeInfo.type.name} type icon" class="type-icon">`).join('')}
            </div>
        </div>
    `;
}

async function showPokemonModal(index) {
    const pokemon = filteredPokemonList.length > 0 ? filteredPokemonList[index] : pokemonList[index];
    currentPokemonIndex = index;
    const flavorText = await fetchPokemonFlavorText(pokemon.id);
    const pokemonStats = await fetchAndDisplayStats(pokemon.id);
    const pokemonMeasurements = await fetchAndDisplayMeasurements(pokemon.id);
    document.body.classList.add('no-scroll');
    updateNavigationButtons(index);
    updateModalContent(pokemon, flavorText, pokemonStats, pokemonMeasurements);
    document.getElementById('pokemon-modal').style.display = 'flex';
}

function updateNavigationButtons() {
    const prevButton = document.querySelector('.previousPokemon');
    const nextButton = document.querySelector('.nextPokemon');
    const list = filteredPokemonList.length > 0 ? filteredPokemonList : pokemonList;
    prevButton.style.display = currentPokemonIndex === 0 ? 'none' : 'flex';
    nextButton.style.display = currentPokemonIndex === list.length - 1 ? 'none' : 'flex';
}

function showNextPokemon() {
    if (currentPokemonIndex < pokemonList.length - 1) {
        currentPokemonIndex++;
        showPokemonModal(currentPokemonIndex);
    }
}

function showPreviousPokemon() {
    if (currentPokemonIndex > 0) {
        currentPokemonIndex--;
        showPokemonModal(currentPokemonIndex);
    }
}

function updateModalContent(pokemon, flavorText) {
    const { id, name, background, sprite, types } = getPokemonDetails(pokemon);
    document.getElementById('modal-id').textContent = id;
    document.getElementById('modal-name').textContent = name;
    document.getElementById('modal-image').src = sprite;
    document.getElementById('modal-image').alt = `${name} artwork`;
    document.getElementById('modal-types').innerHTML = renderTypes(types);
    document.getElementById('modal-pokedexentry').textContent = flavorText;
    document.querySelector('.modal-content').style.background = background;
}

function getPokemonDetails(pokemon) {
    return {
        id: `#${(pokemon.id - 494).toString().padStart(3, '0')}`,
        name: pokemon.name.split('-')[0].charAt(0).toUpperCase() + pokemon.name.split('-')[0].slice(1),
        background: getPokemonBackground(pokemon),
        sprite: pokemon.sprites.other['official-artwork'].front_default,
        types: pokemon.types,
    };
}

function renderTypes(types) {
    return types.map(
        (typeInfo) => `<img src="types/${typeInfo.type.name}.png" alt="${typeInfo.type.name} type icon" class="type-icon">`
    ).join('');
}

function closePokemonModal() {
    document.getElementById('pokemon-modal').style.display = 'none';
    document.body.classList.remove('no-scroll');
}

async function loadPokemonBatch(startId) {
    showLoadingScreen();
    const pokemonMap = new Map(loadedPokemonArray.map(pokemon => [pokemon.id, pokemon]));
    const batch = await fetchPokemonRange(startId, batchSize);
    batch.forEach(pokemon => {
        if (!pokemonMap.has(pokemon.id)) {
            loadedPokemonArray.push(pokemon);
            pokemonMap.set(pokemon.id, pokemon);
        }
    });
    pokemonList = loadedPokemonArray.slice();
    displayPokemonBatch(pokemonList);
    hideLoadingScreen();
}

function displayPokemonBatch(pokemonList) {
    const pokemonContainer = document.getElementById('pokemonDisplay');
    pokemonContainer.innerHTML = '';
    const newPokemonHTML = pokemonList.map((pokemon, index) => createPokemonDiv(pokemon, index)).join('');
    pokemonContainer.innerHTML = newPokemonHTML;
}

function getPokemonBackground(pokemon) {
    const primaryType = pokemon.types[0].type.name;
    const secondaryType = pokemon.types[1]?.type.name;

    return secondaryType
        ? `linear-gradient(20.7deg, var(--${primaryType}) 50%, var(--${secondaryType}) 50%)`
        : `var(--${primaryType})`;
}

async function fetchPokemonRange(startId, count) {
    const fetchedPokemonList = [];
    for (let i = startId; i < startId + count && i <= maxPokemonId; i++) {
        if (!loadedPokemonArray.some(pokemon => pokemon.id === i)) {
            const response = await fetch(`${base_URL}${i}/`);
            const pokemon = await response.json();
            fetchedPokemonList.push(pokemon);
        }
    }
    return fetchedPokemonList;
}

async function fetchPokemonFlavorText(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);
    const data = await response.json();
    const englishEntry = data.flavor_text_entries.find(
        entry => entry.language.name === 'en'
    );
    return englishEntry ? englishEntry.flavor_text.replace(/\f/g, ' ') : 'No Pokédex entry available.';
}

async function fetchAndDisplayStats(id) {
    const response = await fetch(`${base_URL}${id}/`);
    const data = await response.json();
    const statNames = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
    statNames.forEach(statName => {
        const statValue = data.stats.find(stat => stat.stat.name === statName)?.base_stat || 'Not found';
        const statElement = document.getElementById(`${statName.replace('-', '_')}-stat`);
        if (statElement) {
            const displayName = statName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            statElement.textContent = `${displayName} ${statValue}`;
        }
    });
}

async function fetchAndDisplayMeasurements(id) {
    const response = await fetch(`${base_URL}${id}/`);
    const data = await response.json();
    const height = data.height / 10;
    const weight = data.weight / 10;
    document.getElementById('pokemon-height').textContent = `Height: ${height} m`;
    document.getElementById('pokemon-weight').textContent = `Weight: ${weight} kg`;
}

function showLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    const factContainer = document.querySelector('.loading-fact');

    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    factContainer.textContent = randomFact;

    loadingScreen.style.display = 'flex';
    document.body.classList.add('no-scroll');
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.body.classList.remove('no-scroll');
}

async function loadMorePokemon() {
    if (currentBatch < unovaDexCount) {
        await loadPokemonBatch(nextBatchStartId);
        nextBatchStartId += batchSize;
        currentBatch += batchSize;
    } else {
        displayEndOfDexMessage();
        const loadMoreButton = document.getElementById('loadMoreButton');
        loadMoreButton.style.display = 'none';
    }
}

function displayEndOfDexMessage() {
    const pokemonContainer = document.getElementById('pokemonDisplay');
    pokemonContainer.innerHTML += `
        <div class="end-message">
            No more Pokémon to display. This is the complete Unova Pokédex! To explore more Pokémon, please refer to previous or future generations.
        </div>
    `;
}

function filterPokemonList() {
    const searchTerm = document.querySelector('.searchInput').value.toLowerCase();
    
    if (searchTerm.length >= 3) {
        filteredPokemonList = pokemonList.filter(pokemon => pokemon.name.toLowerCase().includes(searchTerm));
        displayPokemonBatch(filteredPokemonList.length ? filteredPokemonList.slice(0, 10) : pokemonList);
        currentPokemonIndex = filteredPokemonList.length ? pokemonList.indexOf(filteredPokemonList[0]) : 0;
    } else {
        filteredPokemonList = [];
        displayPokemonBatch(pokemonList);
        currentPokemonIndex = 0;
    }
}

window.onload = () => {
    loadPokemonBatch(494);
    currentBatch += batchSize;
};
