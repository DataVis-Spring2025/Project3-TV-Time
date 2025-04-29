class CharMap {
  constructor(svgSelector) {
    this.svg = d3.select(svgSelector);
    this.tooltip1 = d3.select("body")
      .append("div")
      .attr("id", "tooltip1")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("padding", "5px 10px")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("display", "none")
      .style("font-family", "sans-serif")
      .style("font-size", "12px")
      .style("box-shadow", "0 0 5px rgba(0,0,0,0.2)");

    this.imagePath = "image/DemonSlayerFanArt3.jpg";
    this.width = 736;
    this.height = 531;

    this.points = [
      { id: "p1", name: "Mount Kumotori", x: 30, y: 100, fp: "Episode 1" },
      { id: "p2", name: "Mount Sagiri", x: 240, y: 125, fp: "Episode 2" },
      { id: "p3", name: "Mount Fujikasane", x: 270, y: 240, fp: "Episode 4" },
      { id: "p4", name: "Northwest Town", x: 280, y: 135, fp: "Episode 6" },
      { id: "p5", name: "Asakusa", x: 415, y: 305, fp: "Episode 7" },
      { id: "p6", name: "Tsuzumi Mansion", x: 150, y: 160, fp: "Episode 11" },
      { id: "p7", name: "Mount Natagumo", x: 330, y: 220, fp: "Episode 15" },
      { id: "U", name: "Ubuyashiki Mansion", x: 410, y: 250, fp: "Episode 22" },
      { id: "B", name: "Butterfly Mansion", x: 480, y: 180, fp: "Episode 23" },
      { id: "p8", name: "Mugen Train (Wreckage)", x: 390, y: 195, fp: "Episode 26" },
      { id: "p9", name: "Yoshiwara District", x: 560, y: 230, fp: "Episode 35" },
      { id: "p10", name: "Swordsmith Village", x: 610, y: 300, fp: "Episode 45" },
      { id: "p11", name: "Hashira Training", x: 460, y: 232, fp: "Episode 57" },
      { id: "I", name: "Infinity Castle", x: 600, y: 470, fp: "Episode 26" }
    ];

    this.labelGroup = this.svg.append("g").attr("id", "label-group");
    this.initMap();
    this.drawPoints();
    this.drawLabels();
    this.labelGroup.raise();
    this.currentCharacters = [];
    this.injectUIControls(); 
    this.csvCache = null; // for caching CSV
    this.characterData = {}; // Store the current character's elements (image, trails, etc.)
  }

  initMap() {
    this.svg.append("image")
      .attr("xlink:href", this.imagePath)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .style("width", "100%")
      .style("height", "100%");
  }

  injectUIControls() {
    // Select the parent element containing the SVG
    const container = d3.select(this.svg.node().parentNode);
  
    // Insert a controls div before the SVG so that it appears at the top
    const controlDiv = container
      .insert("div", () => this.svg.node())
      .attr("id", "map-controls")
      .style("position", "relative")
      .style("width", "100%")
      .style("display", "flex")
      .style("justify-content", "space-between")
      .style("align-items", "center")
      .style("margin-bottom", "5px");
  
    // ---- Info Icon & Tooltip on the left ----
    const infoContainer = controlDiv.append("div")
      .attr("id", "infoIcon")
      .style("margin-left", "10px")
      .style("position", "relative");
  
    const info = infoContainer.append("i")
      .attr("class", "bi bi-info-circle-fill")
      .style("color", "#666")
      .style("cursor", "help");
  
    const infoTooltip = infoContainer.append("div")
      .attr("id", "infoTooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("box-shadow", "0 0 5px rgba(0,0,0,0.2)")
      .style("width", "450px")
      .style("font-size", "12px")
      .style("display", "none")
      .style("z-index", "1000")
      .style("text-align", "justify");
  
    const trieInfo = "The character locations on the map are based on the script and may not be exact for every character.<br>Characters appearing only at the Infinity Castle or eventually ending up there is intentional and serves as an Easter egg referencing a key event that occurs at the end of the series.";
  
    info.on("mouseover", function(event) {
        infoTooltip.html(trieInfo)
            .style("display", "block")
            .style("left", `${event.offsetX + 10}px`)
            .style("top", `${event.offsetY + 10}px`);
      })
      .on("mousemove", function(event) {
        infoTooltip
            .style("left", `${event.offsetX + 10}px`)
            .style("top", `${event.offsetY + 10}px`);
      })
      .on("mouseout", function() {
        infoTooltip.style("display", "none");
      });
  
    // ---- Replay Button on the right ----
    controlDiv.append("button")
      .attr("id", "replayBtn")
      .attr("class", "btn btn-primary")
      .style("margin-right", "10px")
      .text("Replay")
      .on("click", () => this.replayAnimation());
  }

  drawPoints() {
    this.svg.selectAll("circle")
      .data(this.points)
      .enter()
      .append("circle")
      .attr("class", "point-circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 3)
      .attr("fill", "#DC143C")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .on("mouseover", (event, d) => {
        this.tooltip1.style("display", "block")
          .html(`<strong>First Appearance: ${d.fp}</strong>`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY) + "px");
      })
      .on("mouseout", () => {
        this.tooltip1.style("display", "none");
      });
  }

  drawLabels() {
    this.labelGroup.selectAll("text")
      .data(this.points)
      .enter()
      .append("text")
      .attr("class", "point-label")
      .attr("x", d => d.x + 5)
      .attr("y", d => d.y - 5)
      .text(d => d.name)
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .each(function () {
        d3.select(this).raise(); // move each label to top
      });
  }

  replayAnimation() {
    if (this.currentCharacters && this.currentCharacters.length > 0) {
      this.moveCharacters(this.currentCharacters);
    }
  }

  moveCharacters(characterNames) {
    const self = this;
    // console.log("Character Names:", characterNames);
    // console.log("this.points:", this.points);
    // Ensure all values are strings
    characterNames = characterNames.map(name => String(name).trim());
  
    // Remove previous characters no longer selected
    for (const charName in this.characterData) {
      if (!characterNames.includes(charName)) {
        const data = this.characterData[charName];
        self.svg.select(`#character-image-${charName}`).remove();
        self.svg.select(`#character-circle-${charName}`).remove();
        self.svg.selectAll(`.trail-segment-${charName}`).remove();
      }
    }
  
    // Load CSV once
    const process = (csvData) => {
      const formatted = csvData.map(row => {
        const newRow = {};
        for (const key in row) {
          newRow[key.toLowerCase()] = row[key];
        }
        return newRow;
      });
  
      characterNames.forEach(characterName => {
        const nameLower = characterName.charAt(0).toUpperCase() + characterName.slice(1).toLowerCase();
  
        const characterData = formatted.find(d => d.speaker === nameLower);
        if (!characterData) {
          console.log(`Character not found in CSV: ${nameLower}`);
          return;
        }
  
        const visitedPointIds = Object.keys(characterData)
          .filter(key => key !== "speaker" && characterData[key] === "1");
  
        const visitedPoints = visitedPointIds
          .map(id => this.points.find(p => p.id.toLowerCase() === id))
          .filter(Boolean);
  
        if (visitedPoints.length === 0) return;
  
        // Clean up before redraw
        self.svg.select(`#character-image-${nameLower}`).remove();
        self.svg.select(`#movement-trail-${nameLower}`).remove();
        self.svg.select(`#character-circle-${nameLower}`).remove();
        self.svg.selectAll(`.trail-segment-${nameLower}`).remove();
  
        const segmentColors = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4"];
  
        for (let i = 0; i < visitedPoints.length - 1; i++) {
          const start = visitedPoints[i];
          const end = visitedPoints[i + 1];
          const color = segmentColors[i % segmentColors.length];
  
          self.svg.append("line")
            .attr("class", `trail-segment-${nameLower}`)
            .attr("x1", start.x)
            .attr("y1", start.y)
            .attr("x2", end.x)
            .attr("y2", end.y)
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4 2");
        }
  
        self.drawLabels();
  
        // Try image animation
        const imgPath = `image/pfp/${nameLower}.png`;
        let characterNode;
  
        const animateImage = () => {
          let i = 1;
          const moveNext = () => {
            if (i >= visitedPoints.length) return;
            characterNode.transition()
              .duration(1200)
              .attr("x", visitedPoints[i].x - 25)
              .attr("y", visitedPoints[i].y - 25)
              .on("end", () => {
                i++;
                moveNext();
              });
          };
          moveNext();
          self.labelGroup.raise();
        };
  
        const img = self.svg.append("image")
          .attr("id", `character-image-${nameLower}`)
          .attr("class", "char-imgs")
          .attr("xlink:href", imgPath)
          .attr("x", visitedPoints[0].x - 25)
          .attr("y", visitedPoints[0].y - 25)
          .attr("width", 50)
          .attr("height", 50)
          .on("error", function () {
            d3.select(this).remove();
            characterNode = self.svg.append("circle")
              .attr("id", `character-circle-${nameLower}`)
              .attr("cx", visitedPoints[0].x)
              .attr("cy", visitedPoints[0].y)
              .attr("r", 10)
              .attr("fill", "blue")
              .attr("opacity", 0.5);
  
            let i = 1;
            const moveNext = () => {
              if (i >= visitedPoints.length) return;
              characterNode.transition()
                .duration(2000)
                .attr("cx", visitedPoints[i].x)
                .attr("cy", visitedPoints[i].y)
                .on("end", () => {
                  i++;
                  moveNext();
                });
            };
            moveNext();
          })
          .on("load", function () {
            characterNode = d3.select(this);
            animateImage();
          });
  
        self.characterData[nameLower] = { image: img, trail: visitedPoints };
      });
    };
    this.currentCharacters = characterNames;
    if (self.csvCache) {
      process(self.csvCache);
    } else {
      d3.csv('./data/maptravel.csv').then(csv => {
        self.csvCache = csv;
        process(csv);
      });
    }
  } }

export default CharMap;