export class Timeline {
  constructor(containerId, totalEpisodes = 64, episodesPerSeason = 16, onSelectRange = () => {}) {
    this.containerId = containerId;
    this.totalEpisodes = totalEpisodes;
    this.episodesPerSeason = episodesPerSeason;
    this.episodeData = this.generateEpisodes();
    this.selectedRange = [];
    this.dragging = false;
    this.startIndex = null;
    this.endIndex = null;
    this.onSelectRange = onSelectRange;

    this.renderTimeline();

    const clearBtn = document.getElementById('clearTimelineBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', this.clearSelection.bind(this));
    }
  }
  
  generateEpisodes() {
    const episodesPerSeason = [26,18,11,7]; // manual input
    const episodes = [];
    let id = 0;
  
    for (let season = 1; season <= episodesPerSeason.length; season++) {
      for (let episode = 1; episode <= episodesPerSeason[season - 1]; episode++) {
        episodes.push({
          id: id++,
          season,
          episode,
          label: `S${season}E${episode}`
        });
      }
    }
  
    return episodes;
  }
  

  renderTimeline() {
    const container = document.getElementById(this.containerId);
    container.innerHTML = '';

    const svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', 130);

    const width = container.offsetWidth;
    const boxWidth = width / this.episodeData.length;


    // Glow filter for season start
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append('g')
      .attr('transform', 'translate(0, 10)');

    // Tooltip

    const tooltip = d3.select("#tooltip");
    const episodeBoxes = g.selectAll('rect')
      .data(this.episodeData)
      .enter()
      .append('rect')
      .attr('x', (d, i) => i * boxWidth)
      .attr('y', 0)
      .attr('width', boxWidth - 2)
      .attr('height', 30)
      .attr('fill', '#ccc')
      .attr('stroke', d => d.episode === 1 ? '#000' : '#666')
      .attr('stroke-width', d => d.episode === 1 ? 2 : 1)
      .attr('filter', d => d.episode === 1 ? 'url(#glow)' : null)
      .attr('opacity', 0)
      .on('mousedown', (event, d) => this.startSelection(d.id))
      .on('mouseenter', (event, d) => {
        this.dragSelection(d.id);
        tooltip
          .style('opacity', 1)
          .text(d.label);

  const offsetX = d.season === 4 ? -40 : 10;

  tooltip
    .style('left', `${event.pageX + offsetX}px`)
    .style('top', `${event.pageY - 20}px`);

  d3.select(event.currentTarget)
    .transition()
    .duration(150)
    .attr('height', 40)
    .attr('y', -5);

        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('height', 40)
          .attr('y', -5);
      })
      .on('mousemove', (event) => {
        const offsetX = d.season === 4 ? -40 : 10;
        tooltip
        .style('left', `${event.pageX + offsetX}px`)
          .style('top', `${event.pageY - 20}px`);
      })
      .on('mousehover', (event) => {
        const offsetX = d.season === 4 ? -40 : 10;
        tooltip
        .style('left', `${event.pageX + offsetX}px`)
          .style('top', `${event.pageY - 20}px`);
      })
      .on('mouseleave', (event) => {
        tooltip.style('opacity', 0);

        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('height', 30)
          .attr('y', 0);
      })
      .on('mouseup', () => this.endSelection())
      .transition()
      .delay((d, i) => i * 10)
      .duration(400)
      .attr('opacity', 1);

    // Show only labels for first episode of each season
    g.selectAll('text')
      .data(this.episodeData)
      .enter()
      .append('text')
      .attr('x', (d, i) => i * boxWidth + boxWidth / 2)
      .attr('y', 90)
      .attr('transform', (d, i) => `rotate(-45 ${i * boxWidth + boxWidth / 2},90)`)
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('fill', '#333')
      .text(d => d.episode === 1 ? d.label : '');
  }

  startSelection(index) {
    this.dragging = true;
    this.startIndex = index;
    this.endIndex = index;
    this.updateSelection();
  }

  


  dragSelection(index) {
    if (this.dragging) {
      this.endIndex = index;
      this.updateSelection();
    }
  }


  endSelection() {
    if (!this.dragging) return;
    this.dragging = false;
    const [start, end] = [this.startIndex, this.endIndex].sort((a, b) => a - b);
  
    if (start === end) {
      // User clicked a single episode
      this.selectedRange = [this.episodeData[start]];
    } else {
      // User dragged over multiple episodes, include both start and end
      this.selectedRange = this.episodeData.slice(start, end + 1);
    }
  
    this.logSelectedRange();
    this.onSelectRange(this.selectedRange);
  }

  updateSelection() {
    const [start, end] = [this.startIndex, this.endIndex].sort((a, b) => a - b);
  const container = document.getElementById(this.containerId);

  const svg = d3.select(container).select('svg');
  const g = svg.select('g');

  g.selectAll('rect')
    .data(this.episodeData, d => d.id)
    .join(
      enter => enter,
      update =>
        update
          .transition()
          .duration(100)
          .attr('fill', d => (d.id >= start && d.id <= end ? '#88f' : '#ccc'))
          ,
      exit => exit
    ).on('mousehover', (event) => {
      tooltip
      .style('left', `${event.pageX + leftOffset}px`)
        .style('top', `${event.pageY - 20}px`);
    }); 
    const tooltip = d3.select("#tooltip");
    const hoverEpisode = this.episodeData[end];  // Track the current episode being hovered
    const rects = d3.select(container).selectAll('rect').nodes();
    const targetRect = rects[hoverEpisode.id];
    const rectBox = targetRect.getBoundingClientRect();
  
    tooltip
      .style("opacity", 1)
      .style("left", `${rectBox.left + window.scrollX + rectBox.width / 2}px`)
      .style("top", `${rectBox.top + window.scrollY - 30}px`)
      .text(hoverEpisode.label);
  
  }

  clearSelection() {
    this.selectedRange = [];
    this.startIndex = null;
    this.endIndex = null;
    this.dragging = false;
  
    const container = document.getElementById(this.containerId);
    const svg = d3.select(container).select('svg');
    const g = svg.select('g');
  
    g.selectAll('rect')
      .data(this.episodeData, d => d.id)
      .transition()
      .duration(300)
      .attr('fill', '#ccc');
  
    d3.select("#tooltip").style("opacity", 0);
  
    console.clear();
    console.log("Selection cleared.");
    this.onSelectRange(this.episodeData);
  }

  logSelectedRange() {
    console.clear();
    console.log(`Selected Episodes (${this.selectedRange.length}):`);
    this.selectedRange.forEach(ep => {
      console.log(`${ep.label}`);
    });
  }
}



