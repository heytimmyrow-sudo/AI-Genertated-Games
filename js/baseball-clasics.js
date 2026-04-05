(function () {
  const TEAMS_URL = "https://statsapi.mlb.com/api/v1/teams?sportId=1";
  const ROSTER_URL = (teamId) => "https://statsapi.mlb.com/api/v1/teams/" + teamId + "/roster?rosterType=active";
  const fallbackData = window.BASEBALL_CLASICS_FALLBACK || { teams: [], rosters: {} };
  const CURRENT_SEASON = new Date().getFullYear();
  const PRIOR_SEASON = CURRENT_SEASON - 1;
  const STAR_BOOSTS = {
    "Aaron Judge": { offense: 1.45 },
    "Juan Soto": { offense: 1.38 },
    "Shohei Ohtani": { offense: 1.42, pitching: 1.1 },
    "Mookie Betts": { offense: 1.32 },
    "Freddie Freeman": { offense: 1.3 },
    "Yordan Alvarez": { offense: 1.28 },
    "Bryce Harper": { offense: 1.26 },
    "Ronald Acuna Jr.": { offense: 1.34 },
    "Bobby Witt Jr.": { offense: 1.24, speed: 1.18 },
    "Gunnar Henderson": { offense: 1.22 },
    "Francisco Lindor": { offense: 1.18, speed: 1.08 },
    "Jose Ramirez": { offense: 1.22, speed: 1.08 },
    "Ketel Marte": { offense: 1.18 },
    "Corey Seager": { offense: 1.22 },
    "Fernando Tatis Jr.": { offense: 1.22, speed: 1.08 },
    "Julio Rodriguez": { offense: 1.18, speed: 1.1 },
    "Vladimir Guerrero Jr.": { offense: 1.18 },
    "Mike Trout": { offense: 1.2 },
    "Adley Rutschman": { offense: 1.12 },
    "Zack Wheeler": { pitching: 1.34 },
    "Gerrit Cole": { pitching: 1.38 },
    "Framber Valdez": { pitching: 1.24 },
    "Tarik Skubal": { pitching: 1.24 },
    "Cole Ragans": { pitching: 1.22 },
    "Luis Castillo": { pitching: 1.18 },
    "Logan Webb": { pitching: 1.22 },
    "Pablo Lopez": { pitching: 1.18 },
    "Sonny Gray": { pitching: 1.2 },
    "Zac Gallen": { pitching: 1.24 },
    "Freddy Peralta": { pitching: 1.16 },
    "Yoshinobu Yamamoto": { pitching: 1.18 }
  };

  const dom = {
    dataStatus: document.getElementById("dataStatus"),
    builderStatus: document.getElementById("builderStatus"),
    pauseOverlay: document.getElementById("pauseOverlay"),
    resumeButton: document.getElementById("resumeButton"),
    menuButton: document.getElementById("menuButton"),
    simulateGameButton: document.getElementById("simulateGameButton"),
    resetGameButton: document.getElementById("resetGameButton"),
    scoreboardAwayName: document.getElementById("scoreboardAwayName"),
    scoreboardAwayScore: document.getElementById("scoreboardAwayScore"),
    scoreboardHomeName: document.getElementById("scoreboardHomeName"),
    scoreboardHomeScore: document.getElementById("scoreboardHomeScore"),
    scoreboardStatus: document.getElementById("scoreboardStatus"),
    scoreboardMeta: document.getElementById("scoreboardMeta"),
    inningLines: document.getElementById("inningLines"),
    gameLog: document.getElementById("gameLog"),
    summary: {
      homeName: document.getElementById("homeSummaryName"),
      homeMeta: document.getElementById("homeSummaryMeta"),
      awayName: document.getElementById("awaySummaryName"),
      awayMeta: document.getElementById("awaySummaryMeta")
    },
    sides: {
      home: {
        officialPanel: document.getElementById("homeOfficialPanel"),
        customPanel: document.getElementById("homeCustomPanel"),
        teamSelect: document.getElementById("homeTeamSelect"),
        loadOfficial: document.getElementById("homeLoadOfficial"),
        customName: document.getElementById("homeCustomName"),
        sourceTeam: document.getElementById("homeSourceTeam"),
        playerSelect: document.getElementById("homePlayerSelect"),
        addPlayer: document.getElementById("homeAddPlayer"),
        loadBaseTeam: document.getElementById("homeLoadBaseTeam"),
        clearCustom: document.getElementById("homeClearCustom"),
        rosterTitle: document.getElementById("homeRosterTitle"),
        rosterCount: document.getElementById("homeRosterCount"),
        rosterList: document.getElementById("homeRosterList")
      },
      away: {
        officialPanel: document.getElementById("awayOfficialPanel"),
        customPanel: document.getElementById("awayCustomPanel"),
        teamSelect: document.getElementById("awayTeamSelect"),
        loadOfficial: document.getElementById("awayLoadOfficial"),
        customName: document.getElementById("awayCustomName"),
        sourceTeam: document.getElementById("awaySourceTeam"),
        playerSelect: document.getElementById("awayPlayerSelect"),
        addPlayer: document.getElementById("awayAddPlayer"),
        loadBaseTeam: document.getElementById("awayLoadBaseTeam"),
        clearCustom: document.getElementById("awayClearCustom"),
        rosterTitle: document.getElementById("awayRosterTitle"),
        rosterCount: document.getElementById("awayRosterCount"),
        rosterList: document.getElementById("awayRosterList")
      }
    },
    modeButtons: Array.from(document.querySelectorAll(".mode-chip"))
  };

  const state = {
    paused: false,
    teams: [],
    rosters: {},
    playerStats: {},
    sides: {
      home: {
        mode: "official",
        officialTeamId: "",
        sourceTeamId: "",
        customName: "",
        officialRoster: [],
        customRoster: []
      },
      away: {
        mode: "official",
        officialTeamId: "",
        sourceTeamId: "",
        customName: "",
        officialRoster: [],
        customRoster: []
      }
    },
    game: null
  };

  function returnToMenu() {
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../sports-classics/index.html";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }
    return response.json();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toStatNumber(value, fallback = 0) {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getTeamById(teamId) {
    return state.teams.find((team) => String(team.id) === String(teamId));
  }

  function formatPlayer(player) {
    const team = getTeamById(player.teamId);
    return {
      id: player.id,
      name: player.name,
      position: player.position || "Player",
      teamId: player.teamId,
      teamName: team ? team.name : "Current MLB Team"
    };
  }

  async function loadTeams() {
    try {
      const data = await fetchJson(TEAMS_URL);
      state.teams = (data.teams || [])
        .filter((team) => team.active !== false)
        .map((team) => ({
          id: team.id,
          name: team.name,
          abbreviation: team.abbreviation
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      state.teams = fallbackData.teams.slice().sort((a, b) => a.name.localeCompare(b.name));
      throw error;
    }
  }

  async function loadRoster(teamId) {
    if (state.rosters[teamId]) return state.rosters[teamId];
    try {
      const data = await fetchJson(ROSTER_URL(teamId));
      state.rosters[teamId] = (data.roster || []).map((entry) => ({
        id: entry.person.id,
        name: entry.person.fullName,
        position: entry.position ? entry.position.abbreviation : "P",
        teamId: teamId
      }));
    } catch (error) {
      const fallbackRoster = fallbackData.rosters[String(teamId)] || fallbackData.rosters[teamId];
      if (!fallbackRoster) {
        throw error;
      }
      state.rosters[teamId] = fallbackRoster.map((player) => ({
        id: player.id,
        name: player.name,
        position: player.position,
        teamId: player.teamId
      }));
    }
    return state.rosters[teamId];
  }

  async function loadSeasonStatGroup(playerId, group, season) {
    const key = playerId + ":" + group + ":" + season;
    if (state.playerStats[key]) return state.playerStats[key];
    const url = "https://statsapi.mlb.com/api/v1/people/" + playerId + "/stats?stats=season&group=" + group + "&season=" + season;
    const data = await fetchJson(url);
    const split = data.stats && data.stats[0] && data.stats[0].splits && data.stats[0].splits[0];
    state.playerStats[key] = split ? split.stat : null;
    return state.playerStats[key];
  }

  function buildFallbackRatings(player, lineupIndex) {
    const boost = STAR_BOOSTS[player.name] || {};
    const speedBase = ["SS", "2B", "CF", "OF"].some((token) => player.position.includes(token)) ? 0.62 : 0.5;
    const powerBase = ["1B", "3B", "OF", "DH"].some((token) => player.position.includes(token)) ? 0.58 : 0.48;
    const contactBase = player.position === "C" ? 0.5 : 0.54;
    const pitchingBase = player.position === "P" ? 0.66 : 0.35;
    const orderBias = Math.max(0, (6 - lineupIndex) * 0.015);
    return {
      contact: clamp((contactBase + orderBias) * (boost.offense || 1), 0.35, 0.86),
      power: clamp(powerBase * (boost.offense || 1), 0.25, 0.9),
      discipline: clamp((0.5 + orderBias * 0.8) * (boost.offense || 1), 0.3, 0.84),
      speed: clamp(speedBase * (boost.speed || 1), 0.28, 0.92),
      pitching: clamp(pitchingBase * (boost.pitching || 1), 0.25, 0.94),
      source: "fallback"
    };
  }

  async function getPlayerRatings(player, lineupIndex) {
    const cacheKey = "ratings:" + player.id;
    if (state.playerStats[cacheKey]) return state.playerStats[cacheKey];

    try {
      let hitting = await loadSeasonStatGroup(player.id, "hitting", CURRENT_SEASON);
      let pitching = await loadSeasonStatGroup(player.id, "pitching", CURRENT_SEASON);
      if (!hitting && !pitching) {
        hitting = await loadSeasonStatGroup(player.id, "hitting", PRIOR_SEASON);
        pitching = await loadSeasonStatGroup(player.id, "pitching", PRIOR_SEASON);
      }

      const rating = {
        contact: 0.48,
        power: 0.44,
        discipline: 0.45,
        speed: 0.48,
        pitching: 0.38,
        source: "live"
      };

      if (hitting) {
        const avg = toStatNumber(hitting.avg, 0.245);
        const obp = toStatNumber(hitting.obp, avg + 0.055);
        const slg = toStatNumber(hitting.slg, avg + 0.15);
        const steals = toStatNumber(hitting.stolenBases, 0);
        const pa = toStatNumber(hitting.plateAppearances, 180);
        rating.contact = clamp(avg / 0.34, 0.22, 0.92);
        rating.discipline = clamp(obp / 0.46, 0.22, 0.92);
        rating.power = clamp(slg / 0.68, 0.22, 0.96);
        rating.speed = clamp(0.35 + steals / Math.max(pa, 1) * 30, 0.24, 0.9);
      }

      if (pitching) {
        const era = toStatNumber(pitching.era, 4.6);
        const whip = toStatNumber(pitching.whip, 1.35);
        const k9 = toStatNumber(pitching.strikeoutsPer9Inn, 8.0);
        rating.pitching = clamp((1.8 / era) * 0.48 + (1.65 / whip) * 0.32 + (k9 / 12.5) * 0.2, 0.22, 0.96);
      }

      state.playerStats[cacheKey] = rating;
      return rating;
    } catch (error) {
      const fallback = buildFallbackRatings(player, lineupIndex);
      state.playerStats[cacheKey] = fallback;
      return fallback;
    }
  }

  function buildOptions(select, items, getLabel, getValue, placeholder) {
    const options = [];
    if (placeholder) {
      options.push('<option value="">' + escapeHtml(placeholder) + "</option>");
    }
    for (const item of items) {
      options.push(
        '<option value="' + escapeHtml(getValue(item)) + '">' + escapeHtml(getLabel(item)) + "</option>"
      );
    }
    select.innerHTML = options.join("");
  }

  function updateStatus(message, tone) {
    dom.builderStatus.textContent = message;
    dom.builderStatus.parentElement.style.borderColor =
      tone === "warn" ? "rgba(255, 214, 107, 0.24)" : "rgba(125, 227, 255, 0.14)";
  }

  function setMode(side, mode) {
    state.sides[side].mode = mode;
    dom.sides[side].officialPanel.classList.toggle("is-hidden", mode !== "official");
    dom.sides[side].customPanel.classList.toggle("is-hidden", mode !== "custom");
    dom.modeButtons.forEach((button) => {
      button.classList.toggle(
        "is-active",
        button.dataset.side === side && button.dataset.mode === mode
      );
    });
    renderSide(side);
  }

  async function populatePlayerSelect(side) {
    const sourceTeamId = dom.sides[side].sourceTeam.value;
    state.sides[side].sourceTeamId = sourceTeamId;
    if (!sourceTeamId) {
      buildOptions(dom.sides[side].playerSelect, [], () => "", () => "", "Choose a team first");
      return;
    }
    updateStatus("Loading active roster for " + getTeamById(sourceTeamId).name + "...", "info");
    const roster = await loadRoster(sourceTeamId);
    buildOptions(
      dom.sides[side].playerSelect,
      roster,
      (player) => player.name + " - " + player.position,
      (player) => player.id,
      "Choose a player"
    );
    updateStatus("Use current MLB rosters as-is or mix players into custom teams.", "info");
  }

  async function loadOfficialTeam(side) {
    const teamId = dom.sides[side].teamSelect.value;
    if (!teamId) {
      updateStatus("Pick a current MLB team first.", "warn");
      return;
    }
    const team = getTeamById(teamId);
    updateStatus("Loading " + team.name + " active roster...", "info");
    const roster = await loadRoster(teamId);
    state.sides[side].officialTeamId = teamId;
    state.sides[side].officialRoster = roster.map(formatPlayer);
    renderSide(side);
    updateStatus(team.name + " loaded. You can keep it as-is or switch to custom mode and start mixing players.", "info");
  }

  async function loadBaseTeam(side) {
    const teamId = dom.sides[side].sourceTeam.value;
    if (!teamId) {
      updateStatus("Choose a source team before loading a base roster.", "warn");
      return;
    }
    const team = getTeamById(teamId);
    updateStatus("Loading " + team.name + " as the base for your custom roster...", "info");
    const roster = await loadRoster(teamId);
    state.sides[side].customRoster = roster.map(formatPlayer);
    if (!dom.sides[side].customName.value.trim()) {
      dom.sides[side].customName.value = team.name + " Remix";
      state.sides[side].customName = dom.sides[side].customName.value.trim();
    }
    renderSide(side);
    updateStatus("Custom roster started from " + team.name + ". Add or remove real players from there.", "info");
  }

  function addCustomPlayer(side) {
    const sideState = state.sides[side];
    const playerId = dom.sides[side].playerSelect.value;
    const sourceTeamId = dom.sides[side].sourceTeam.value;
    if (!sourceTeamId || !playerId) {
      updateStatus("Choose a source team and player first.", "warn");
      return;
    }
    const roster = state.rosters[sourceTeamId] || [];
    const player = roster.find((entry) => String(entry.id) === String(playerId));
    if (!player) {
      updateStatus("That player is not available right now.", "warn");
      return;
    }
    if (sideState.customRoster.some((entry) => String(entry.id) === String(player.id))) {
      updateStatus(player.name + " is already on this custom team.", "warn");
      return;
    }
    sideState.customRoster.push(formatPlayer(player));
    renderSide(side);
    updateStatus(player.name + " added to the custom roster.", "info");
  }

  function clearCustom(side) {
    state.sides[side].customRoster = [];
    renderSide(side);
    updateStatus("Custom roster cleared.", "info");
  }

  function removeCustomPlayer(side, playerId) {
    state.sides[side].customRoster = state.sides[side].customRoster.filter(
      (player) => String(player.id) !== String(playerId)
    );
    renderSide(side);
    updateStatus("Player removed from the custom roster.", "info");
  }

  function renderRosterList(side, roster) {
    const list = dom.sides[side].rosterList;
    if (!roster.length) {
      list.innerHTML = '<li class="roster-list__empty">No players loaded yet.</li>';
      return;
    }
    list.innerHTML = roster
      .map((player, index) => {
        const removeButton = state.sides[side].mode === "custom"
          ? '<button class="roster-list__remove" type="button" data-side="' + side + '" data-remove-player="' + player.id + '">Remove</button>'
          : "";
        return (
          '<li>' +
            '<span class="roster-list__index">' + (index + 1) + "</span>" +
            '<div class="roster-list__player">' +
              "<strong>" + escapeHtml(player.name) + "</strong>" +
              "<span>" + escapeHtml(player.position + " - " + player.teamName) + "</span>" +
            "</div>" +
            removeButton +
          "</li>"
        );
      })
      .join("");
  }

  function renderSummary() {
    for (const side of ["home", "away"]) {
      const sideState = state.sides[side];
      const summaryName = side === "home" ? dom.summary.homeName : dom.summary.awayName;
      const summaryMeta = side === "home" ? dom.summary.homeMeta : dom.summary.awayMeta;
      if (sideState.mode === "official" && sideState.officialTeamId) {
        const team = getTeamById(sideState.officialTeamId);
        summaryName.textContent = team ? team.name : "Official Team";
        summaryMeta.textContent = sideState.officialRoster.length + " active players loaded";
      } else if (sideState.mode === "custom") {
        const name = sideState.customName || (side === "home" ? "Home Custom Club" : "Away Custom Club");
        summaryName.textContent = name;
        summaryMeta.textContent = sideState.customRoster.length + " selected players";
      } else {
        summaryName.textContent = "Choose a team";
        summaryMeta.textContent = "No roster loaded yet";
      }
    }
  }

  function getSideDisplayName(side) {
    const sideState = state.sides[side];
    if (sideState.mode === "official" && sideState.officialTeamId) {
      const team = getTeamById(sideState.officialTeamId);
      return team ? team.name : "Official Team";
    }
    if (sideState.mode === "custom") {
      return sideState.customName || (side === "home" ? "Home Custom Club" : "Away Custom Club");
    }
    return side === "home" ? "Home Club" : "Away Club";
  }

  function getActiveRoster(side) {
    const sideState = state.sides[side];
    return sideState.mode === "official" ? sideState.officialRoster : sideState.customRoster;
  }

  function renderSide(side) {
    const sideState = state.sides[side];
    const roster = sideState.mode === "official" ? sideState.officialRoster : sideState.customRoster;
    const titleText = sideState.mode === "official"
      ? (side === "home" ? "Home official roster" : "Away official roster")
      : (sideState.customName || (side === "home" ? "Home custom roster" : "Away custom roster"));
    dom.sides[side].rosterTitle.textContent = titleText;
    dom.sides[side].rosterCount.textContent = roster.length + " players";
    renderRosterList(side, roster);
    renderSummary();
  }

  function syncCustomNames() {
    for (const side of ["home", "away"]) {
      state.sides[side].customName = dom.sides[side].customName.value.trim();
      renderSide(side);
    }
  }

  function setPaused(nextPaused) {
    state.paused = nextPaused;
    dom.pauseOverlay.hidden = !nextPaused;
    dom.pauseOverlay.classList.toggle("is-open", nextPaused);
  }

  function renderGame() {
    if (!state.game) {
      dom.scoreboardAwayName.textContent = getSideDisplayName("away");
      dom.scoreboardHomeName.textContent = getSideDisplayName("home");
      dom.scoreboardAwayScore.textContent = "0";
      dom.scoreboardHomeScore.textContent = "0";
      dom.scoreboardStatus.textContent = "No game played yet";
      dom.scoreboardMeta.textContent = "Build both teams, then run the sim.";
      dom.inningLines.innerHTML = "";
      dom.gameLog.innerHTML = '<li class="game-log__empty">The inning-by-inning game log will appear here.</li>';
      return;
    }

    dom.scoreboardAwayName.textContent = state.game.away.name;
    dom.scoreboardHomeName.textContent = state.game.home.name;
    dom.scoreboardAwayScore.textContent = state.game.away.score;
    dom.scoreboardHomeScore.textContent = state.game.home.score;
    dom.scoreboardStatus.textContent = state.game.status;
    dom.scoreboardMeta.textContent = state.game.meta;

    dom.inningLines.innerHTML = state.game.innings.map((inning) =>
      '<div class="inning-line"><strong>Inning ' + inning.number + '</strong><span>' +
      escapeHtml(state.game.away.name + " " + inning.away + " - " + inning.home + " " + state.game.home.name) +
      "</span></div>"
    ).join("");

    dom.gameLog.innerHTML = state.game.log.map((line) => "<li>" + escapeHtml(line) + "</li>").join("");
  }

  function findPitcher(rosterWithRatings) {
    return rosterWithRatings.reduce((best, player) => {
      if (!best || player.ratings.pitching > best.ratings.pitching) return player;
      return best;
    }, null);
  }

  function chooseOutcome(batter, pitcher) {
    const contactEdge = batter.ratings.contact - pitcher.ratings.pitching * 0.45;
    const powerEdge = batter.ratings.power - pitcher.ratings.pitching * 0.26;
    const disciplineEdge = batter.ratings.discipline - pitcher.ratings.pitching * 0.2;
    const walkChance = clamp(0.05 + disciplineEdge * 0.08, 0.03, 0.14);
    const singleChance = clamp(0.13 + contactEdge * 0.17, 0.08, 0.28);
    const doubleChance = clamp(0.032 + powerEdge * 0.05, 0.015, 0.12);
    const tripleChance = clamp(0.006 + batter.ratings.speed * 0.02 + powerEdge * 0.008, 0.002, 0.035);
    const homeRunChance = clamp(0.018 + powerEdge * 0.06, 0.006, 0.16);
    const roll = Math.random();
    const cut1 = walkChance;
    const cut2 = cut1 + singleChance;
    const cut3 = cut2 + doubleChance;
    const cut4 = cut3 + tripleChance;
    const cut5 = cut4 + homeRunChance;
    if (roll < cut1) return "walk";
    if (roll < cut2) return "single";
    if (roll < cut3) return "double";
    if (roll < cut4) return "triple";
    if (roll < cut5) return "homeRun";
    return "out";
  }

  function advanceRunners(bases, outcome, batter) {
    let runs = 0;
    const first = bases[0];
    const second = bases[1];
    const third = bases[2];
    if (outcome === "walk") {
      if (first && second && third) runs += 1;
      bases[2] = third || (first && second ? second : null);
      bases[1] = second || first || null;
      bases[0] = batter;
      return runs;
    }
    if (outcome === "single") {
      if (third) runs += 1;
      bases[2] = null;
      if (second && Math.random() < 0.62 + second.ratings.speed * 0.18) runs += 1;
      else if (second) bases[2] = second;
      bases[1] = first || null;
      bases[0] = batter;
      return runs;
    }
    if (outcome === "double") {
      if (third) runs += 1;
      if (second) runs += 1;
      bases[2] = null;
      if (first && Math.random() < 0.44 + first.ratings.speed * 0.24) runs += 1;
      else if (first) bases[2] = first;
      bases[1] = batter;
      bases[0] = null;
      return runs;
    }
    if (outcome === "triple") {
      if (first) runs += 1;
      if (second) runs += 1;
      if (third) runs += 1;
      bases[0] = null;
      bases[1] = null;
      bases[2] = batter;
      return runs;
    }
    if (outcome === "homeRun") {
      if (bases[0]) runs += 1;
      if (bases[1]) runs += 1;
      if (bases[2]) runs += 1;
      bases[0] = null;
      bases[1] = null;
      bases[2] = null;
      return runs + 1;
    }
    return 0;
  }

  function summarizeOutcome(batter, outcome, runsScored) {
    const resultLabels = {
      walk: "draws a walk",
      single: "lines a single",
      double: "drives a double",
      triple: "legs out a triple",
      homeRun: "launches a home run",
      out: "is retired"
    };
    const suffix = runsScored > 0 ? " and drives in " + runsScored + (runsScored === 1 ? " run" : " runs") : "";
    return batter.name + " " + resultLabels[outcome] + suffix + ".";
  }

  function simulateHalfInning(offense, defense, inningNumber, halfLabel) {
    const pitcher = findPitcher(defense.lineup);
    let outs = 0;
    const bases = [null, null, null];
    let runs = 0;
    const events = [];

    while (outs < 3) {
      const batter = offense.lineup[offense.batterIndex % offense.lineup.length];
      offense.batterIndex += 1;
      const outcome = chooseOutcome(batter, pitcher);
      if (outcome === "out") {
        outs += 1;
        events.push(halfLabel + " " + inningNumber + ": " + batter.name + " is retired. (" + outs + " out" + (outs === 1 ? "" : "s") + ")");
        continue;
      }
      const runsScored = advanceRunners(bases, outcome, batter);
      runs += runsScored;
      events.push(halfLabel + " " + inningNumber + ": " + summarizeOutcome(batter, outcome, runsScored));
    }

    return { runs, events, pitcher: pitcher.name };
  }

  async function buildSimRoster(side) {
    const roster = getActiveRoster(side);
    const lineup = [];
    for (let i = 0; i < roster.length; i += 1) {
      const player = roster[i];
      lineup.push({
        ...player,
        ratings: await getPlayerRatings(player, i)
      });
    }
    return lineup;
  }

  async function simulateGame() {
    const homeRoster = getActiveRoster("home");
    const awayRoster = getActiveRoster("away");
    if (homeRoster.length < 5 || awayRoster.length < 5) {
      updateStatus("Load at least five players for both teams before simulating a game.", "warn");
      return;
    }

    dom.simulateGameButton.disabled = true;
    dom.simulateGameButton.textContent = "Simulating...";
    updateStatus("Loading player stats and running the game...", "info");

    try {
      const [homeLineup, awayLineup] = await Promise.all([
        buildSimRoster("home"),
        buildSimRoster("away")
      ]);

      const home = { name: getSideDisplayName("home"), lineup: homeLineup, batterIndex: 0, score: 0 };
      const away = { name: getSideDisplayName("away"), lineup: awayLineup, batterIndex: 0, score: 0 };
      const innings = [];
      const log = [];

      let liveCount = 0;
      for (const player of homeLineup.concat(awayLineup)) {
        if (player.ratings.source === "live") liveCount += 1;
      }

      let inningNumber = 1;
      while (inningNumber <= 9 || home.score === away.score) {
        const top = simulateHalfInning(away, home, inningNumber, "Top");
        away.score += top.runs;
        log.push(...top.events);

        const bottom = simulateHalfInning(home, away, inningNumber, "Bottom");
        home.score += bottom.runs;
        log.push(...bottom.events);

        innings.push({ number: inningNumber, away: top.runs, home: bottom.runs });
        inningNumber += 1;

        if (inningNumber > 12 && home.score === away.score) {
          const extraRun = Math.random() < 0.5 ? "home" : "away";
          if (extraRun === "home") {
            home.score += 1;
            innings[innings.length - 1].home += 1;
            log.push("Late extra innings: " + home.name + " scratches across the go-ahead run.");
          } else {
            away.score += 1;
            innings[innings.length - 1].away += 1;
            log.push("Late extra innings: " + away.name + " scratches across the go-ahead run.");
          }
        }
      }

      const winner = home.score > away.score ? home.name : away.name;
      state.game = {
        home,
        away,
        innings,
        log,
        status: winner + " win " + (home.score > away.score ? home.score + "-" + away.score : away.score + "-" + home.score),
        meta: liveCount > 0
          ? "Live season stats powered " + liveCount + " players in this matchup. The rest used local estimates."
          : "This matchup used the local stat fallback because live season stats were unavailable."
      };
      renderGame();
      updateStatus("Game complete. " + winner + " take it.", "info");
    } catch (error) {
      console.error(error);
      updateStatus("The game sim could not finish right now. Check the browser console for details if it happens again.", "warn");
    } finally {
      dom.simulateGameButton.disabled = false;
      dom.simulateGameButton.textContent = "Simulate Game";
    }
  }

  function resetGame() {
    state.game = null;
    renderGame();
    updateStatus("Game result cleared. Build another matchup whenever you want.", "info");
  }

  async function initialize() {
    let usedFallbackTeams = false;
    try {
      await loadTeams();
      buildOptions(dom.sides.home.teamSelect, state.teams, (team) => team.name, (team) => team.id, "Choose a team");
      buildOptions(dom.sides.away.teamSelect, state.teams, (team) => team.name, (team) => team.id, "Choose a team");
      buildOptions(dom.sides.home.sourceTeam, state.teams, (team) => team.name, (team) => team.id, "Choose a team");
      buildOptions(dom.sides.away.sourceTeam, state.teams, (team) => team.name, (team) => team.id, "Choose a team");
      buildOptions(dom.sides.home.playerSelect, [], () => "", () => "", "Choose a team first");
      buildOptions(dom.sides.away.playerSelect, [], () => "", () => "", "Choose a team first");
      dom.dataStatus.textContent = "Live MLB teams ready. Load current active rosters or build custom clubs from them.";
      updateStatus("Current MLB teams are ready. Pick official rosters or start building your own clubs.", "info");
      renderSide("home");
      renderSide("away");
      renderGame();
    } catch (error) {
      usedFallbackTeams = true;
      buildOptions(dom.sides.home.teamSelect, state.teams, (team) => team.name, (team) => team.id, "Choose a team");
      buildOptions(dom.sides.away.teamSelect, state.teams, (team) => team.name, (team) => team.id, "Choose a team");
      buildOptions(dom.sides.home.sourceTeam, state.teams, (team) => team.name, (team) => team.id, "Choose a team");
      buildOptions(dom.sides.away.sourceTeam, state.teams, (team) => team.name, (team) => team.id, "Choose a team");
      buildOptions(dom.sides.home.playerSelect, [], () => "", () => "", "Choose a team first");
      buildOptions(dom.sides.away.playerSelect, [], () => "", () => "", "Choose a team first");
      dom.dataStatus.textContent = "Live MLB loading was blocked, so built-in teams and players are ready locally.";
      updateStatus("Using the built-in roster pack so the game works locally. You can still build official-style or custom teams.", "warn");
      renderSide("home");
      renderSide("away");
      renderGame();
      console.warn(error);
    }
  }

  dom.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.side, button.dataset.mode);
    });
  });

  ["home", "away"].forEach((side) => {
    dom.sides[side].loadOfficial.addEventListener("click", () => {
      loadOfficialTeam(side).catch((error) => {
        console.error(error);
        updateStatus("Could not load that team right now.", "warn");
      });
    });

    dom.sides[side].sourceTeam.addEventListener("change", () => {
      populatePlayerSelect(side).catch((error) => {
        console.error(error);
        updateStatus("Could not load players for that source team.", "warn");
      });
    });

    dom.sides[side].addPlayer.addEventListener("click", () => addCustomPlayer(side));
    dom.sides[side].loadBaseTeam.addEventListener("click", () => {
      loadBaseTeam(side).catch((error) => {
        console.error(error);
        updateStatus("Could not load that base team right now.", "warn");
      });
    });
    dom.sides[side].clearCustom.addEventListener("click", () => clearCustom(side));
    dom.sides[side].customName.addEventListener("input", syncCustomNames);
    dom.sides[side].rosterList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-player]");
      if (!button) return;
      removeCustomPlayer(side, button.getAttribute("data-remove-player"));
    });
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "escape") {
      event.preventDefault();
      returnToMenu();
      return;
    }
    if (key === "p") {
      event.preventDefault();
      setPaused(!state.paused);
    }
  });

  dom.resumeButton.addEventListener("click", () => setPaused(false));
  dom.menuButton.addEventListener("click", returnToMenu);
  dom.simulateGameButton.addEventListener("click", () => {
    simulateGame().catch((error) => {
      console.error(error);
      updateStatus("The game sim could not finish right now. Check the browser console for details if it happens again.", "warn");
      dom.simulateGameButton.disabled = false;
      dom.simulateGameButton.textContent = "Simulate Game";
    });
  });
  dom.resetGameButton.addEventListener("click", resetGame);

  renderGame();
  initialize();
})();
