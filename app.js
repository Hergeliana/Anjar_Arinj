const SUPABASE_URL = 'https://bytcderaucwcynzejqnk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dGNkZXJhdWN3Y3luemVqcW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDI0NDUsImV4cCI6MjA5MDk3ODQ0NX0.IMSxyFrSbhVU1ccoVFrLW7iTzLtuh1j8ViP8g3NFGZ0';

document.addEventListener('DOMContentLoaded', () => {
  if (!window.supabase) {
    console.error('Supabase library is missing.');
    alert('Supabase library is missing. Add the Supabase CDN script before app.js');
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const state = {
    players: [],
    games: [],
    mainTab: 'entry',
    rankTab: 'personal'
  };

  const els = {
    mainTabs: [...document.querySelectorAll('[data-main-tab]')],
    mainTabPanels: [...document.querySelectorAll('.main-tab')],
    rankTabs: [...document.querySelectorAll('[data-rank-tab]')],
    rankTabPanels: [...document.querySelectorAll('.rank-tab')],
    selects: [
      document.getElementById('teamAPlayer1'),
      document.getElementById('teamAPlayer2'),
      document.getElementById('teamBPlayer1'),
      document.getElementById('teamBPlayer2')
    ],
    scoreA: document.getElementById('teamAScore'),
    scoreB: document.getElementById('teamBScore'),
    previewScoreA: document.getElementById('previewScoreA'),
    previewScoreB: document.getElementById('previewScoreB'),
    submitGameBtn: document.getElementById('submitGameBtn'),
    entryMessage: document.getElementById('entryMessage'),
    managePlayersBtn: document.getElementById('managePlayersBtn'),
    playerModal: document.getElementById('playerModal'),
    closePlayerModalBtn: document.getElementById('closePlayerModalBtn'),
    addPlayerBtn: document.getElementById('addPlayerBtn'),
    newPlayerName: document.getElementById('newPlayerName'),
    playerList: document.getElementById('playerList'),
    playerMessage: document.getElementById('playerMessage'),
    resetSelectionBtn: document.getElementById('resetSelectionBtn'),
    historyBody: document.getElementById('historyBody'),
    historyEmpty: document.getElementById('historyEmpty'),
    historyFrom: document.getElementById('historyFrom'),
    historyTo: document.getElementById('historyTo'),
    clearHistoryDatesBtn: document.getElementById('clearHistoryDatesBtn'),
    rankingFrom: document.getElementById('rankingFrom'),
    rankingTo: document.getElementById('rankingTo'),
    clearRankingDatesBtn: document.getElementById('clearRankingDatesBtn'),
    personalBody: document.getElementById('personalBody'),
    personalEmpty: document.getElementById('personalEmpty'),
    teamBody: document.getElementById('teamBody'),
    teamEmpty: document.getElementById('teamEmpty')
  };

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('fetchPlayers error:', error);
      return [];
    }

    return data || [];
  }

  async function fetchGames() {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('fetchGames error:', error);
      return [];
    }

    return (data || []).map((game) => ({
      id: game.id,
      date: game.date,
      teamAPlayers: Array.isArray(game.team_a_players) ? game.team_a_players : [],
      teamBPlayers: Array.isArray(game.team_b_players) ? game.team_b_players : [],
      teamAScore: Number(game.team_a_score),
      teamBScore: Number(game.team_b_score),
      winner: game.winner
    }));
  }

  async function addPlayerToSupabase(name) {
    const { error } = await supabase
      .from('players')
      .insert([{ name }]);

    return error;
  }

  async function deletePlayerFromSupabase(id) {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    return error;
  }

  async function addGameToSupabase(game) {
    const { error } = await supabase
      .from('games')
      .insert([{
        date: game.date,
        team_a_players: game.teamAPlayers,
        team_b_players: game.teamBPlayers,
        team_a_score: game.teamAScore,
        team_b_score: game.teamBScore,
        winner: game.winner
      }]);

    return error;
  }

  async function deleteGameFromSupabase(id) {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    return error;
  }

  async function loadAllData() {
    state.players = await fetchPlayers();
    state.games = await fetchGames();
    renderAllData();
  }

  function showMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.className = `message show ${type}`;
  }

  function clearMessage(element) {
    if (!element) return;
    element.textContent = '';
    element.className = 'message';
  }

  function formatDateTime(dateStr) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  }

  function teamName(players) {
    return [...players].sort((a, b) => a.localeCompare(b)).join(' - ');
  }

  function getCup(rank) {
    if (rank === 1) return '<span class="cup gold">🏆</span>';
    if (rank === 2) return '<span class="cup silver">🏆</span>';
    if (rank === 3) return '<span class="cup bronze">🏆</span>';
    return '';
  }

  function getDateOnly(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  function gameInRange(game, from, to) {
    const date = getDateOnly(game.date);
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  }

  function setMainTab(name) {
    state.mainTab = name;
    els.mainTabs.forEach((btn) => btn.classList.toggle('active', btn.dataset.mainTab === name));
    els.mainTabPanels.forEach((panel) => panel.classList.add('hidden'));
    const tab = document.getElementById(`tab-${name}`);
    if (tab) tab.classList.remove('hidden');
  }

  function setRankTab(name) {
    state.rankTab = name;
    els.rankTabs.forEach((btn) => btn.classList.toggle('active', btn.dataset.rankTab === name));
    els.rankTabPanels.forEach((panel) => panel.classList.add('hidden'));
    const tab = document.getElementById(`rank-${name}`);
    if (tab) tab.classList.remove('hidden');
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function renderSelectOptions() {
    const selectedIds = els.selects.map((sel) => (sel ? String(sel.value) : '')).filter(Boolean);

    els.selects.forEach((currentSelect) => {
      if (!currentSelect) return;

      const currentValue = String(currentSelect.value || '');
      currentSelect.innerHTML = '';

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = state.players.length < 4 ? 'Add at least 4 players first' : 'Select player';
      currentSelect.appendChild(placeholder);

      state.players.forEach((player) => {
        const playerId = String(player.id);
        const usedElsewhere = selectedIds.includes(playerId) && playerId !== currentValue;

        const opt = document.createElement('option');
        opt.value = playerId;
        opt.textContent = player.name;
        opt.disabled = usedElsewhere;
        currentSelect.appendChild(opt);
      });

      currentSelect.value = currentValue;
    });
  }

  function renderPlayers() {
    if (!els.playerList) return;

    els.playerList.innerHTML = '';

    if (!state.players.length) {
      els.playerList.innerHTML = '<div class="empty">No players added yet.</div>';
      return;
    }

    const sorted = [...state.players].sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach((player) => {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.innerHTML = `
        <div>${escapeHtml(player.name)}</div>
        <button class="btn danger" data-delete-player="${String(player.id)}">Delete</button>
      `;
      els.playerList.appendChild(row);
    });
  }

  function getSelectedPlayerNames() {
    const ids = els.selects.map((s) => (s ? String(s.value) : ''));
    return ids.map((id) => state.players.find((p) => String(p.id) === String(id))?.name || '');
  }

  function resetForm() {
    els.selects.forEach((s) => {
      if (s) s.value = '';
    });

    if (els.scoreA) els.scoreA.value = '';
    if (els.scoreB) els.scoreB.value = '';
    if (els.previewScoreA) els.previewScoreA.textContent = '0';
    if (els.previewScoreB) els.previewScoreB.textContent = '0';

    clearMessage(els.entryMessage);
    renderSelectOptions();
  }

  function validateGame() {
    if (state.players.length < 4) {
      return 'At least 4 players are required.';
    }

    const ids = els.selects.map((s) => (s ? s.value : ''));
    if (ids.some((id) => !id)) return 'Please select all 4 players.';

    const unique = new Set(ids);
    if (unique.size !== 4) return 'The same player cannot appear twice in the same game.';

    const scoreA = Number(els.scoreA?.value);
    const scoreB = Number(els.scoreB?.value);

    if (Number.isNaN(scoreA) || Number.isNaN(scoreB)) return 'Please enter both scores.';
    if (scoreA < 0 || scoreB < 0) return 'Scores cannot be negative.';
    if (scoreA > 600 || scoreB > 600) return 'Scores cannot be higher than 600.';
    if (scoreA < 323 && scoreB < 323) return 'The scores are not correct. At least one team must score 323 or more.';
    if (scoreA === scoreB) return 'Scores cannot be equal. One team must win and one must lose.';

    return null;
  }

  async function submitGame() {
    const error = validateGame();
    if (error) {
      showMessage(els.entryMessage, error, 'error');
      return;
    }

    const [a1, a2, b1, b2] = getSelectedPlayerNames();
    const teamAScore = Number(els.scoreA.value);
    const teamBScore = Number(els.scoreB.value);
    const winner = teamAScore > teamBScore ? 'A' : 'B';

    const newGame = {
      date: new Date().toISOString(),
      teamAPlayers: [a1, a2],
      teamBPlayers: [b1, b2],
      teamAScore,
      teamBScore,
      winner
    };

    const saveError = await addGameToSupabase(newGame);

    if (saveError) {
      console.error(saveError);
      showMessage(els.entryMessage, 'Could not save game.', 'error');
      return;
    }

    resetForm();
    showMessage(els.entryMessage, 'Score submitted successfully.', 'success');
    await loadAllData();
  }

  async function deleteGame(id) {
    const error = await deleteGameFromSupabase(id);

    if (error) {
      console.error(error);
      alert('Could not delete game.');
      return;
    }

    await loadAllData();
  }

  function renderHistory() {
    if (!els.historyBody || !els.historyEmpty) return;

    const from = els.historyFrom ? els.historyFrom.value : '';
    const to = els.historyTo ? els.historyTo.value : '';
    const games = state.games.filter((g) => gameInRange(g, from, to));

    els.historyBody.innerHTML = '';
    els.historyEmpty.classList.toggle('hidden', games.length > 0);

    games.forEach((game) => {
      const row = document.createElement('tr');
      const aWin = game.winner === 'A';
      const bWin = game.winner === 'B';

      row.innerHTML = `
        <td>${formatDateTime(game.date)}</td>
        <td><span class="${aWin ? 'history-win' : 'history-loss'}">${escapeHtml(game.teamAPlayers.join(' - '))}</span></td>
        <td><span class="${aWin ? 'history-win' : 'history-loss'}">${game.teamAScore}</span></td>
        <td><span class="${bWin ? 'history-win' : 'history-loss'}">${escapeHtml(game.teamBPlayers.join(' - '))}</span></td>
        <td><span class="${bWin ? 'history-win' : 'history-loss'}">${game.teamBScore}</span></td>
        <td><button class="btn danger" data-delete-game="${String(game.id)}">Delete</button></td>
      `;

      els.historyBody.appendChild(row);
    });
  }

  function buildPersonalRanking(games) {
    const stats = new Map();

    games.forEach((game) => {
      const winners = game.winner === 'A' ? game.teamAPlayers : game.teamBPlayers;
      const losers = game.winner === 'A' ? game.teamBPlayers : game.teamAPlayers;

      [...winners, ...losers].forEach((name) => {
        if (!stats.has(name)) {
          stats.set(name, { name, games: 0, wins: 0, losses: 0 });
        }
      });

      winners.forEach((name) => {
        const item = stats.get(name);
        item.games += 1;
        item.wins += 1;
      });

      losers.forEach((name) => {
        const item = stats.get(name);
        item.games += 1;
        item.losses += 1;
      });
    });

    return [...stats.values()]
      .map((item) => ({
        ...item,
        percentage: item.games ? item.wins / item.games : 0
      }))
      .sort((a, b) => b.percentage - a.percentage || b.wins - a.wins || a.name.localeCompare(b.name))
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  function buildTeamRanking(games) {
    const stats = new Map();

    games.forEach((game) => {
      const teamA = teamName(game.teamAPlayers);
      const teamB = teamName(game.teamBPlayers);

      [teamA, teamB].forEach((name) => {
        if (!stats.has(name)) {
          stats.set(name, { name, games: 0, wins: 0, losses: 0 });
        }
      });

      const winnerName = game.winner === 'A' ? teamA : teamB;
      const loserName = game.winner === 'A' ? teamB : teamA;

      const winItem = stats.get(winnerName);
      winItem.games += 1;
      winItem.wins += 1;

      const lossItem = stats.get(loserName);
      lossItem.games += 1;
      lossItem.losses += 1;
    });

    return [...stats.values()]
      .map((item) => ({
        ...item,
        percentage: item.games ? item.wins / item.games : 0
      }))
      .sort((a, b) => b.percentage - a.percentage || b.wins - a.wins || a.name.localeCompare(b.name))
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  function renderRanking() {
    const from = els.rankingFrom ? els.rankingFrom.value : '';
    const to = els.rankingTo ? els.rankingTo.value : '';
    const games = state.games.filter((g) => gameInRange(g, from, to));

    const personal = buildPersonalRanking(games);
    const teams = buildTeamRanking(games);

    if (els.personalBody) els.personalBody.innerHTML = '';
    if (els.teamBody) els.teamBody.innerHTML = '';
    if (els.personalEmpty) els.personalEmpty.classList.toggle('hidden', personal.length > 0);
    if (els.teamEmpty) els.teamEmpty.classList.toggle('hidden', teams.length > 0);

    personal.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.rank}${getCup(row.rank)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${row.games}</td>
        <td>${row.wins}</td>
        <td>${row.losses}</td>
        <td>${(row.percentage * 100).toFixed(1)}%</td>
      `;
      if (els.personalBody) els.personalBody.appendChild(tr);
    });

    teams.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.rank}${getCup(row.rank)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${row.games}</td>
        <td>${row.wins}</td>
        <td>${row.losses}</td>
        <td>${(row.percentage * 100).toFixed(1)}%</td>
      `;
      if (els.teamBody) els.teamBody.appendChild(tr);
    });
  }

  function renderAllData() {
    renderSelectOptions();
    renderPlayers();
    renderHistory();
    renderRanking();
  }

  els.mainTabs.forEach((btn) => {
    btn.addEventListener('click', () => setMainTab(btn.dataset.mainTab));
  });

  els.rankTabs.forEach((btn) => {
    btn.addEventListener('click', () => setRankTab(btn.dataset.rankTab));
  });

  if (els.managePlayersBtn) {
    els.managePlayersBtn.addEventListener('click', () => {
      clearMessage(els.playerMessage);
      if (els.playerModal) els.playerModal.classList.add('show');
      if (els.newPlayerName) els.newPlayerName.focus();
    });
  }

  if (els.closePlayerModalBtn) {
    els.closePlayerModalBtn.addEventListener('click', () => {
      if (els.playerModal) els.playerModal.classList.remove('show');
    });
  }

  if (els.playerModal) {
    els.playerModal.addEventListener('click', (e) => {
      if (e.target === els.playerModal) {
        els.playerModal.classList.remove('show');
      }
    });
  }

  if (els.addPlayerBtn) {
    els.addPlayerBtn.addEventListener('click', async () => {
      const name = (els.newPlayerName ? els.newPlayerName.value : '').trim().replace(/\s+/g, ' ');

      if (!name) {
        showMessage(els.playerMessage, 'Please enter a player name.', 'error');
        return;
      }

      const exists = state.players.some((p) => p.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        showMessage(els.playerMessage, 'This player already exists.', 'error');
        return;
      }

      const error = await addPlayerToSupabase(name);

      if (error) {
        console.error(error);
        showMessage(els.playerMessage, 'Could not save player.', 'error');
        return;
      }

      if (els.newPlayerName) els.newPlayerName.value = '';
      showMessage(els.playerMessage, 'Player added successfully.', 'success');
      await loadAllData();
    });
  }

  if (els.newPlayerName) {
    els.newPlayerName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && els.addPlayerBtn) {
        els.addPlayerBtn.click();
      }
    });
  }

  if (els.playerList) {
    els.playerList.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-delete-player]');
      if (!btn) return;

      const id = btn.dataset.deletePlayer;
      const player = state.players.find((p) => String(p.id) === String(id));
      if (!player) return;

      const usedInGames = state.games.some((game) =>
        [...game.teamAPlayers, ...game.teamBPlayers].includes(player.name)
      );

      const warning = usedInGames
        ? ' This player exists in game history and old records will remain unchanged.'
        : '';

      const ok = confirm(`Delete ${player.name}?${warning}`);
      if (!ok) return;

      const error = await deletePlayerFromSupabase(id);

      if (error) {
        console.error(error);
        showMessage(els.playerMessage, 'Could not delete player.', 'error');
        return;
      }

      els.selects.forEach((select) => {
        if (select && String(select.value) === String(id)) select.value = '';
      });

      showMessage(els.playerMessage, 'Player deleted successfully.', 'success');
      await loadAllData();
    });
  }

  els.selects.forEach((sel) => {
    if (sel) sel.addEventListener('change', renderSelectOptions);
  });

  if (els.scoreA) {
    els.scoreA.addEventListener('input', () => {
      if (els.previewScoreA) els.previewScoreA.textContent = els.scoreA.value || '0';
    });
  }

  if (els.scoreB) {
    els.scoreB.addEventListener('input', () => {
      if (els.previewScoreB) els.previewScoreB.textContent = els.scoreB.value || '0';
    });
  }

  if (els.submitGameBtn) {
    els.submitGameBtn.addEventListener('click', submitGame);
  }

  if (els.resetSelectionBtn) {
    els.resetSelectionBtn.addEventListener('click', resetForm);
  }

  if (els.historyBody) {
    els.historyBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-delete-game]');
      if (!btn) return;

      if (confirm('Delete this game?')) {
        await deleteGame(btn.dataset.deleteGame);
      }
    });
  }

  [els.historyFrom, els.historyTo].forEach((el) => {
    if (el) el.addEventListener('change', renderHistory);
  });

  [els.rankingFrom, els.rankingTo].forEach((el) => {
    if (el) el.addEventListener('change', renderRanking);
  });

  if (els.clearHistoryDatesBtn) {
    els.clearHistoryDatesBtn.addEventListener('click', () => {
      if (els.historyFrom) els.historyFrom.value = '';
      if (els.historyTo) els.historyTo.value = '';
      renderHistory();
    });
  }

  if (els.clearRankingDatesBtn) {
    els.clearRankingDatesBtn.addEventListener('click', () => {
      if (els.rankingFrom) els.rankingFrom.value = '';
      if (els.rankingTo) els.rankingTo.value = '';
      renderRanking();
    });
  }

  loadAllData().catch((error) => {
    console.error('Application startup error:', error);
    alert('Could not load data. Check Supabase tables, RLS policies, and internet connection.');
  });
});
