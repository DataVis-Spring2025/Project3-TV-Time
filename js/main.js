import { loadData, hideLoading, showLoading, updateLoadingMessage } from './loading.js';
import WordCloud from './word-cloud.js';
import { tabs, createTabs } from './tabs.js';
import Table from './table.js';
import PieChart from './pieChart.js';
import CharMap from './map.js';
import { Timeline } from './timeline.js';
import CharacterStats from './characterStats.js';
import DialoguePieChart from './dialoguepiechart.js';

let data = [];
let filteredData = [];
let selectedCharacters = new Set();
let charMapInstance = null;
let characterStats = null;
const music = new Audio('infinity_castle_1_hour_loop_full_best_soundtrack__run_like_hashira__kimetsu_no_yaiba_-demon_slayer (1).mp3');
music.loop = true;
music.volume = 0.5;
music.muted=true;
let isMuted = true;

window.onload = () => {
    showPopup();
    loadData('./data/demon-slayer-transcript.csv')
        .then(csvData => {
            data = csvData.map(d => ({ ...d, character: d.speaker?.trim() })).filter((d) => d.speaker.toLowerCase() !== "rengoku");
            filteredData = data;
            const timeline = new Timeline("timeline", 64, 16, onEpisodeRangeSelect);
            createTabs(tabs, renderTabContent);

            const characterCountMap = {};
            let uniqueCharacters = [];

            data.forEach(d => {
                const character = d.character;
                if (character) {
                    if (!uniqueCharacters.includes(character)) {
                        uniqueCharacters.push(character);
                    }
                    characterCountMap[character] = (characterCountMap[character] || 0) + 1;
                }
            });
            
            const charData = uniqueCharacters
                .map(character => ({
                    character,
                    count: characterCountMap[character]
                }))
                .filter(d => d.count > 20);

            window.characterData = charData;
            initializeFilter(charData, handleCharacterToggle);

            hideLoading();
        })
        .catch(error => {
            console.error(error);
            updateLoadingMessage("Failed to load data.");
            setTimeout(() => hideLoading(), 1500);
        });
        console.clear();
};


function handleCharacterToggle(character, isChecked) {
    if (isChecked) {
        if (selectedCharacters.size >= 3) {
            alert("You can only select up to 3 characters.");
            document.querySelector(`input[data-character="${character}"]`).checked = false;
            return;
        }
        selectedCharacters.add(character);
    } else {
        selectedCharacters.delete(character);
    }
    applyFilters();
}

function onEpisodeRangeSelect(selectedEpisodes) {
    window.selectedEpisodeSet = selectedEpisodes.length > 0 
        ? new Set(selectedEpisodes.map(ep => `S${ep.season}E${ep.episode}`)) 
        : null;

    applyFilters();
}

function applyFilters() {
    const selectedCharArr = Array.from(selectedCharacters);
    if (selectedCharArr.length === 0) {
        filteredData = window.selectedEpisodeSet 
            ? data.filter(d => window.selectedEpisodeSet.has(`S${+d.season}E${+d.episode}`)) 
            : data;
    } else {
        let base = window.selectedEpisodeSet 
            ? data.filter(d => window.selectedEpisodeSet.has(`S${+d.season}E${+d.episode}`)) 
            : data;

        const grouped = d3.groups(base, d => `S${d.season}E${d.episode}`);
        const validEpisodes = grouped.filter(([, rows]) => {
            const episodeChars = new Set(rows.map(r => r.character));
            return selectedCharArr.every(c => episodeChars.has(c));
        });

        const validKeys = new Set(validEpisodes.map(([key]) => key));
        filteredData = base.filter(d => selectedCharArr.includes(d.character) && validKeys.has(`S${d.season}E${d.episode}`));
    }

    updateWordCloud();
    updateTable();
    updatePie();

    if (charMapInstance) {
        charMapInstance.moveCharacters(selectedCharArr);
    }
}

function renderTabContent(tabName) {
    const tabContent = document.getElementById(`tab-${tabs.indexOf(tabName)}`);
    tabContent.innerHTML = '';

    if (tabName === "Word Cloud") {
        const wordCloudContainer = document.createElement('div');
        wordCloudContainer.style.width = '100%';
        wordCloudContainer.style.height = '400px';
        wordCloudContainer.id = 'word-cloud-container';
        tabContent.appendChild(wordCloudContainer);
        new WordCloud(wordCloudContainer, data);
        updateWordCloud();
    }

    if (tabName === "Phrases") {
        const tableContainer = document.createElement('div');
        tableContainer.id = 'table-container';
        tabContent.appendChild(tableContainer);
        updateTable();
    }

    if (tabName === "Map") {
        const mapContent = document.getElementById('tab-2');
        mapContent.innerHTML = '';
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 736 531");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.style.width = "100%";
        svg.style.height = "100%";
        mapContent.appendChild(svg);
        charMapInstance = new CharMap(svg);
    }

    if (tabName === "More Info") {
        const tabContent = document.getElementById('tab-3');
        tabContent.innerHTML = '';
        const pieContainer = document.createElement('div');
        pieContainer.id = 'pie-container';
        tabContent.appendChild(pieContainer);
        
        updatePie();
    }
}

function updateWordCloud() {
    const container = document.getElementById('word-cloud-container');
    if (!container) return;
    container.innerHTML = '';
    new WordCloud(container, filteredData);
}
function updateTable() {
    const container = document.getElementById('table-container');
    if (!container) return;
    container.innerHTML = '';
    new Table(container, filteredData);
}
function updatePie() {
    const container = document.getElementById('pie-container');
    if (!container) return;
    container.innerHTML = '';

    // Create a wrapper to hold the pie charts side by side
    const pieWrapper = document.createElement('div');
    pieWrapper.style.display = 'flex'; // Use Flexbox to align the charts horizontally
    pieWrapper.style.justifyContent = 'space-between'; // Optional: Space between the charts
    pieWrapper.style.width = '100%'; // Ensure the wrapper takes full width
    container.appendChild(pieWrapper);

    // Create containers for both pie charts
    const pieChartContainer1 = document.createElement('div');
    pieChartContainer1.style.width = '45%'; // Each pie chart takes 45% of the width
    pieWrapper.appendChild(pieChartContainer1);

    const pieChartContainer2 = document.createElement('div');
    pieChartContainer2.style.width = '55%'; // Same width as the other pie chart
    pieWrapper.appendChild(pieChartContainer2);

    new PieChart(pieChartContainer1, filteredData);
    new DialoguePieChart(pieChartContainer2, filteredData);
    console.log("Current Characters:", selectedCharacters);
    console.log("filteredData length:", filteredData.length);
     
        const characterStats = new CharacterStats(filteredData);
        
        // Create a wrapper for character stats with horizontal layout
        const statsWrapper = document.createElement('div');
        statsWrapper.style.display = 'flex';
        statsWrapper.style.flexWrap = 'wrap'; // Wrap to new line if too many
        statsWrapper.style.gap = '20px'; // Space between each stats box
        statsWrapper.style.marginTop = '20px';
        container.appendChild(statsWrapper);

        selectedCharacters.forEach(name => {
            const stats = characterStats.getCharacterStats(name);
            console.log(`Generating stats for: ${name}`);
console.log("Stats:", stats);
            const statsBox = document.createElement('div');
            statsBox.style.flex = '1 1 200px'; // Responsive width, min 200px
            statsBox.style.border = '1px solid #ccc';
            statsBox.style.padding = '10px';
            statsBox.style.borderRadius = '8px';
            statsBox.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            statsBox.style.backgroundColor = '#fafafa';

            const charTitle = document.createElement('strong');
            charTitle.textContent = `Stats for ${name}`;
            statsBox.appendChild(charTitle);

            const seasonInfo = document.createElement('div');
            seasonInfo.textContent = `Seasons Appeared: ${stats.totalSeasons}`;
            statsBox.appendChild(seasonInfo);

            const episodeInfo = document.createElement('div');
            episodeInfo.textContent = `Episodes Appeared: ${stats.totalEpisodes}`;
            statsBox.appendChild(episodeInfo);

            const dialogueInfo = document.createElement('div');
            dialogueInfo.textContent = `Total Dialogue: ${stats.totalDialogue} lines`;
            statsBox.appendChild(dialogueInfo);

            const linkInfo = document.createElement('div');
            const anchor = document.createElement('a');
            anchor.href = `https://kimetsu-no-yaiba.fandom.com/wiki/Special:Search?query=${encodeURIComponent(name)}&scope=internal`;
            anchor.textContent = `More Info on ${name}`;
            anchor.target = "_blank";
            linkInfo.appendChild(anchor);
            statsBox.appendChild(linkInfo);

            statsWrapper.appendChild(statsBox);
        });
    
}

const overlay = document.getElementById("overlay");
const continueBtn = document.getElementById("continueBtn");
const reopenPopupBtn = document.getElementById("reopenPopupBtn");
const clearBtn = document.getElementById("clearbtn");

function showPopup() {
    overlay.classList.remove("hidden");
}
function hidePopup() {
    overlay.classList.add("hidden");
}

continueBtn.addEventListener("click", () => {
    hidePopup();
    if (music.paused) {
        music.play().catch(err => console.warn("Autoplay blocked:", err));
    }
});
reopenPopupBtn.addEventListener("click", showPopup);

clearBtn.addEventListener("click", () => {
    // Uncheck all checkboxes
    document.querySelectorAll('input[data-character]').forEach(input => {
        input.checked = false;
    });

    // Clear the selected characters set
    selectedCharacters.clear();

    // Reapply filters to update the visualizations
    applyFilters();

     // Change path if needed
});

    const toggleMusicBtn = document.getElementById('toggleMusic');
    const speakerIcon = document.getElementById('speakerIcon');

    const volumeUpIcon = `
      <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
      <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z"/>
      <path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06"/>
    `;

    const muteIcon = `
      <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06m7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0"/>
    `;

    toggleMusicBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      music.muted = isMuted;
      speakerIcon.innerHTML = isMuted ? muteIcon : volumeUpIcon;
      console.log("Muted:", music.muted, "Paused:", music.paused);
    });