export const tabs = ["Word Cloud", "Timeline", "Phrases","Map"];

export function renderPlaceholder(tabName) {
  console.log(`Not implemented: ${tabName}`);
}

export function createTabs(tabLabels, renderFunction) {
  const tabHeader = document.getElementById('tab-header');
  const tabContainer = document.getElementById('tab-container');

  tabLabels.forEach((label, index) => {
    const tabId = `tab-${index}`;

    const button = document.createElement('button');
    button.textContent = label;
    button.classList.add('tab-button');
    if (index === 0) button.classList.add('active');
    button.dataset.tab = tabId;
    tabHeader.appendChild(button);

    const content = document.createElement('div');
    content.id = tabId;
    content.classList.add('tab-content');
    if (index !== 0) content.classList.add('hidden');
    content.innerHTML = `<h3>${label} vis</h3><p>Placeholder for ${label}</p>`;
    tabContainer.appendChild(content);

    renderFunction(label);
  });

  tabHeader.addEventListener('click', e => {
    if (e.target.classList.contains('tab-button')) {
      const tabId = e.target.dataset.tab;

      document.querySelectorAll('.tab-button').forEach(btn =>
        btn.classList.remove('active')
      );
      e.target.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === tabId) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    }
  });
}

