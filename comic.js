/**
 * Comic-style Othello Game for XKCD explainer
 */

class ComicOthello {
    constructor() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1; // 1 = Black, 2 = White
        this.directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        this.setupInitialPosition();
    }

    createEmptyBoard() {
        return Array(8).fill(null).map(() => Array(8).fill(0));
    }

    setupInitialPosition() {
        this.board[3][3] = 2; // White
        this.board[3][4] = 1; // Black
        this.board[4][3] = 1; // Black
        this.board[4][4] = 2; // White
    }

    reset() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1;
        this.setupInitialPosition();
    }

    clone() {
        const copy = new ComicOthello();
        copy.board = this.board.map(row => [...row]);
        copy.currentPlayer = this.currentPlayer;
        return copy;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    getOpponent(player) {
        return player === 1 ? 2 : 1;
    }

    getFlippedPieces(row, col, player) {
        if (this.board[row][col] !== 0) return [];

        const opponent = this.getOpponent(player);
        const allFlipped = [];

        for (const [dr, dc] of this.directions) {
            const flipped = [];
            let r = row + dr;
            let c = col + dc;

            while (this.isValidPosition(r, c) && this.board[r][c] === opponent) {
                flipped.push([r, c]);
                r += dr;
                c += dc;
            }

            if (flipped.length > 0 && this.isValidPosition(r, c) && this.board[r][c] === player) {
                allFlipped.push(...flipped);
            }
        }

        return allFlipped;
    }

    isValidMove(row, col, player = this.currentPlayer) {
        return this.getFlippedPieces(row, col, player).length > 0;
    }

    getLegalMoves(player = this.currentPlayer) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(row, col, player)) {
                    moves.push([row, col]);
                }
            }
        }
        return moves;
    }

    makeMove(row, col) {
        const flipped = this.getFlippedPieces(row, col, this.currentPlayer);
        if (flipped.length === 0) return false;

        this.board[row][col] = this.currentPlayer;
        for (const [r, c] of flipped) {
            this.board[r][c] = this.currentPlayer;
        }

        this.currentPlayer = this.getOpponent(this.currentPlayer);

        // Skip turn if no legal moves
        if (this.getLegalMoves().length === 0) {
            this.currentPlayer = this.getOpponent(this.currentPlayer);
        }

        return true;
    }

    isGameOver() {
        return this.getLegalMoves(1).length === 0 && this.getLegalMoves(2).length === 0;
    }

    getScore() {
        let black = 0, white = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === 1) black++;
                else if (this.board[row][col] === 2) white++;
            }
        }
        return { black, white };
    }

    // Check if a piece affects legal moves (NTP-useful)
    isNTPUseful(row, col) {
        const piece = this.board[row][col];
        if (piece === 0) return null;

        const currentMoves = new Set(this.getLegalMoves().map(([r, c]) => `${r},${c}`));

        // Clone and flip the piece
        const testGame = this.clone();
        testGame.board[row][col] = this.getOpponent(piece);
        const newMoves = new Set(testGame.getLegalMoves().map(([r, c]) => `${r},${c}`));

        if (currentMoves.size !== newMoves.size) return true;

        for (const move of currentMoves) {
            if (!newMoves.has(move)) return true;
        }

        return false;
    }

    getNTPClassification() {
        const useful = [];
        const useless = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] !== 0) {
                    if (this.isNTPUseful(row, col)) {
                        useful.push([row, col]);
                    } else {
                        useless.push([row, col]);
                    }
                }
            }
        }

        return { useful, useless };
    }

    playRandomMoves(count) {
        for (let i = 0; i < count; i++) {
            const moves = this.getLegalMoves();
            if (moves.length === 0) break;
            const [row, col] = moves[Math.floor(Math.random() * moves.length)];
            this.makeMove(row, col);
        }
    }

    // Play random moves until we have enough useless squares
    // Always end with black's turn
    playToInterestingPosition() {
        this.reset();
        // Play 25-40 random moves to get a more advanced position
        let numMoves = 25 + Math.floor(Math.random() * 15);

        // Make sure we play an even number so it's black's turn
        if (numMoves % 2 !== 0) {
            numMoves++;
        }

        this.playRandomMoves(numMoves);

        // Try to ensure we have some useless squares
        let classification = this.getNTPClassification();
        let attempts = 0;
        while (classification.useless.length < 3 && attempts < 10 && !this.isGameOver()) {
            const moves = this.getLegalMoves();
            if (moves.length === 0) break;
            const [row, col] = moves[Math.floor(Math.random() * moves.length)];
            this.makeMove(row, col);
            classification = this.getNTPClassification();
            attempts++;
        }

        // If we ended on white's turn, play one more move to get back to black
        if (this.currentPlayer === 2 && !this.isGameOver()) {
            const moves = this.getLegalMoves();
            if (moves.length > 0) {
                const [row, col] = moves[Math.floor(Math.random() * moves.length)];
                this.makeMove(row, col);
            }
        }
    }
}

/**
 * Interactive Othello UI for the comic
 */
class ComicOthelloUI {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.game = new ComicOthello();
        this.showNTPClassification = options.showNTPClassification || false;
        this.playAgainstBot = options.playAgainstBot !== false;
        this.playerColor = 1; // Player is Black
        this.turnDisplayId = options.turnDisplayId || 'comic-current-player';

        this.render();
    }

    render() {
        this.container.innerHTML = '';

        const legalMoves = new Set(this.game.getLegalMoves().map(([r, c]) => `${r},${c}`));

        let usefulSet = new Set();
        let uselessSet = new Set();

        if (this.showNTPClassification) {
            const { useful, useless } = this.game.getNTPClassification();
            usefulSet = new Set(useful.map(([r, c]) => `${r},${c}`));
            uselessSet = new Set(useless.map(([r, c]) => `${r},${c}`));
        }

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = 'comic-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const key = `${row},${col}`;
                const piece = this.game.board[row][col];

                if (legalMoves.has(key) && this.game.currentPlayer === this.playerColor) {
                    cell.classList.add('legal-move');
                }

                if (this.showNTPClassification) {
                    if (usefulSet.has(key)) {
                        cell.classList.add('ntp-useful');
                    } else if (uselessSet.has(key)) {
                        cell.classList.add('ntp-useless');
                    }
                }

                if (piece !== 0) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `comic-piece ${piece === 1 ? 'black' : 'white'}`;
                    cell.appendChild(pieceEl);
                }

                cell.addEventListener('click', () => this.handleClick(row, col));
                this.container.appendChild(cell);
            }
        }

        this.updateTurnDisplay();
    }

    handleClick(row, col) {
        if (this.game.currentPlayer !== this.playerColor) return;

        if (this.game.makeMove(row, col)) {
            this.render();

            // Bot's turn
            if (this.playAgainstBot && !this.game.isGameOver() && this.game.currentPlayer !== this.playerColor) {
                setTimeout(() => this.botMove(), 500);
            }
        }
    }

    botMove() {
        const moves = this.game.getLegalMoves();
        if (moves.length > 0) {
            const [row, col] = moves[Math.floor(Math.random() * moves.length)];
            this.game.makeMove(row, col);
            this.render();

            // Check if bot needs to move again (player has no moves)
            if (!this.game.isGameOver() && this.game.currentPlayer !== this.playerColor) {
                setTimeout(() => this.botMove(), 500);
            }
        }
    }

    updateTurnDisplay() {
        const playerEl = document.getElementById(this.turnDisplayId);
        if (playerEl) {
            if (this.game.isGameOver()) {
                const score = this.game.getScore();
                if (score.black > score.white) {
                    playerEl.textContent = 'Black wins!';
                } else if (score.white > score.black) {
                    playerEl.textContent = 'White wins!';
                } else {
                    playerEl.textContent = 'Draw!';
                }
            } else {
                playerEl.textContent = this.game.currentPlayer === 1 ? 'Black (You)' : 'White (Bot)';
            }
        }
    }

    reset() {
        this.game.reset();
        this.render();
    }

    randomPosition() {
        this.game.playToInterestingPosition();
        this.render();
    }
}

/**
 * Keyboard navigation for slides
 */
function setupKeyboardNavigation() {
    const screens = document.querySelectorAll('.screen');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            navigateToNextScreen();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateToPrevScreen();
        }
    });

    function getCurrentScreenIndex() {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;

        for (let i = 0; i < screens.length; i++) {
            const rect = screens[i].getBoundingClientRect();
            // If this screen is mostly visible
            if (rect.top >= -windowHeight / 2 && rect.top < windowHeight / 2) {
                return i;
            }
        }
        // Fallback: find by scroll position
        return Math.round(scrollTop / windowHeight);
    }

    function navigateToNextScreen() {
        const currentIndex = getCurrentScreenIndex();
        const nextIndex = Math.min(currentIndex + 1, screens.length - 1);
        screens[nextIndex].scrollIntoView({ behavior: 'smooth' });
    }

    function navigateToPrevScreen() {
        const currentIndex = getCurrentScreenIndex();
        const prevIndex = Math.max(currentIndex - 1, 0);
        screens[prevIndex].scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Setup keyboard navigation
    setupKeyboardNavigation();
    // Interactive game board (plain Othello)
    const gameUI = new ComicOthelloUI('comic-othello-board', {
        showNTPClassification: false,
        playAgainstBot: true,
        turnDisplayId: 'comic-current-player'
    });

    // Reset button for plain game
    const resetBtn = document.getElementById('comic-reset-btn');
    if (resetBtn && gameUI) {
        resetBtn.addEventListener('click', () => gameUI.reset());
    }

    // Riddle board with NTP classification (screen 4)
    const riddleUI = new ComicOthelloUI('riddle-othello-board', {
        showNTPClassification: true,
        playAgainstBot: true,
        turnDisplayId: 'riddle-current-player'
    });

    // Start riddle board at an interesting position
    if (riddleUI && riddleUI.game) {
        riddleUI.game.playToInterestingPosition();
        riddleUI.render();
    }

    // Random position button for riddle board
    const randomBtn = document.getElementById('riddle-random-btn');
    if (randomBtn && riddleUI) {
        randomBtn.addEventListener('click', () => riddleUI.randomPosition());
    }

    // Answer board with NTP classification (screen 5)
    const answerUI = new ComicOthelloUI('answer-othello-board', {
        showNTPClassification: true,
        playAgainstBot: true,
        turnDisplayId: 'answer-current-player'
    });

    // Start answer board at an interesting position
    if (answerUI && answerUI.game) {
        answerUI.game.playToInterestingPosition();
        answerUI.render();
    }

    // Random position button for answer board
    const answerRandomBtn = document.getElementById('answer-random-btn');
    if (answerRandomBtn && answerUI) {
        answerRandomBtn.addEventListener('click', () => answerUI.randomPosition());
    }

    // Gradient Flow Visualization Controls (Screen 7)
    setupGradientVisualization();

    // Feature histogram (Screen 9)
    setupFeatureHistogram();

});

/**
 * Setup interactive gradient flow visualization
 */
function setupGradientVisualization() {
    const directCheckbox = document.getElementById('show-direct');
    const precachedCheckbox = document.getElementById('show-precached');
    const sharedCheckbox = document.getElementById('show-shared');

    const directPaths = document.getElementById('direct-paths');
    const precachedPaths = document.getElementById('precached-paths');
    const sharedPaths = document.getElementById('shared-paths');

    const directExplain = document.getElementById('explain-direct');
    const precachedExplain = document.getElementById('explain-precached');
    const sharedExplain = document.getElementById('explain-shared');

    if (!directCheckbox || !precachedCheckbox || !sharedCheckbox) return;

    function updateVisualization() {
        // Toggle path visibility
        if (directPaths) {
            directPaths.classList.toggle('hidden', !directCheckbox.checked);
        }
        if (precachedPaths) {
            precachedPaths.classList.toggle('hidden', !precachedCheckbox.checked);
        }
        if (sharedPaths) {
            sharedPaths.classList.toggle('hidden', !sharedCheckbox.checked);
        }

        // Toggle explanation visibility
        if (directExplain) {
            directExplain.classList.toggle('hidden', !directCheckbox.checked);
        }
        if (precachedExplain) {
            precachedExplain.classList.toggle('hidden', !precachedCheckbox.checked);
        }
        if (sharedExplain) {
            sharedExplain.classList.toggle('hidden', !sharedCheckbox.checked);
        }
    }

    directCheckbox.addEventListener('change', updateVisualization);
    precachedCheckbox.addEventListener('change', updateVisualization);
    sharedCheckbox.addEventListener('change', updateVisualization);

    // Initial state
    updateVisualization();
}

/**
 * Feature histogram visualization (Screen 9)
 */
function setupFeatureHistogram() {
    const svg = document.getElementById('feature-histogram');
    if (!svg) return;

    if (!window.FEATURES_DATA) return;

    const features = window.FEATURES_DATA.map(([feature_idx, pc_index, desc]) => ({
        feature_idx, pc_index, desc
    }));
    renderHistogram(svg, features);
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const features = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // First two fields are simple (no commas): feature_idx,pc_index
        const firstComma = line.indexOf(',');
        if (firstComma === -1) continue;
        const secondComma = line.indexOf(',', firstComma + 1);
        if (secondComma === -1) continue;

        const feature_idx = parseInt(line.substring(0, firstComma));
        const pc_index = parseFloat(line.substring(firstComma + 1, secondComma));
        let desc = line.substring(secondComma + 1).trim();

        // Remove surrounding quotes and unescape doubled quotes
        if (desc.startsWith('"') && desc.endsWith('"')) {
            desc = desc.slice(1, -1).replace(/""/g, '"');
        }
        desc = desc.trim();

        if (isNaN(pc_index) || pc_index <= 0) continue;
        features.push({ feature_idx, pc_index, desc });
    }
    return features;
}

function renderHistogram(svg, features) {
    const margin = { top: 20, right: 20, bottom: 55, left: 55 };
    // Use fixed dimensions for the viewBox (CSS handles responsive scaling)
    const totalW = 900;
    const totalH = 340;
    const width = totalW - margin.left - margin.right;
    const height = totalH - margin.top - margin.bottom;

    svg.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Compute log10 values - avoid spread on large arrays
    const logValues = features.map(f => Math.log10(f.pc_index));
    let logMinRaw = Infinity, logMaxRaw = -Infinity;
    for (const v of logValues) {
        if (v < logMinRaw) logMinRaw = v;
        if (v > logMaxRaw) logMaxRaw = v;
    }
    const logMin = Math.floor(logMinRaw);
    const logMax = Math.ceil(logMaxRaw);

    // Create bins
    const numBins = 100;
    const binWidth = (logMax - logMin) / numBins;
    const bins = Array.from({ length: numBins }, (_, i) => ({
        logStart: logMin + i * binWidth,
        logEnd: logMin + (i + 1) * binWidth,
        count: 0,
        features: []
    }));

    // Fill bins
    for (const f of features) {
        const logVal = Math.log10(f.pc_index);
        let binIdx = Math.floor((logVal - logMin) / binWidth);
        if (binIdx >= numBins) binIdx = numBins - 1;
        if (binIdx < 0) binIdx = 0;
        bins[binIdx].count++;
        bins[binIdx].features.push(f);
    }

    let maxCount = 0;
    for (const b of bins) {
        if (b.count > maxCount) maxCount = b.count;
    }

    // Clear SVG
    svg.innerHTML = '';

    const ns = 'http://www.w3.org/2000/svg';

    // Create group with margin
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
    svg.appendChild(g);

    // Color gradient from green (direct) to blue (pre-cached)
    const defs = document.createElementNS(ns, 'defs');
    svg.appendChild(defs);

    // Draw bars
    const barGap = 1;
    const barW = Math.max(1, width / numBins - barGap);

    for (let i = 0; i < bins.length; i++) {
        if (bins[i].count === 0) continue;

        const x = (i / numBins) * width;
        const barH = (bins[i].count / maxCount) * height;
        const y = height - barH;

        // Interpolate color: green (#008a0e) -> orange middle -> blue (#1071e5)
        const t = i / (numBins - 1);
        const color = interpolateColor(t);

        const bar = document.createElementNS(ns, 'rect');
        bar.setAttribute('x', x);
        bar.setAttribute('y', y);
        bar.setAttribute('width', barW);
        bar.setAttribute('height', barH);
        bar.setAttribute('fill', color);
        bar.setAttribute('class', 'bar');
        bar.dataset.binIdx = i;

        bar.addEventListener('mouseenter', (e) => showHistogramTooltip(e, bins[i]));
        bar.addEventListener('mousemove', (e) => moveHistogramTooltip(e));
        bar.addEventListener('mouseleave', hideHistogramTooltip);

        g.appendChild(bar);
    }

    // X-axis
    const xAxis = document.createElementNS(ns, 'line');
    xAxis.setAttribute('x1', 0);
    xAxis.setAttribute('y1', height);
    xAxis.setAttribute('x2', width);
    xAxis.setAttribute('y2', height);
    xAxis.setAttribute('stroke', '#000');
    xAxis.setAttribute('stroke-width', 2);
    g.appendChild(xAxis);

    // Y-axis
    const yAxis = document.createElementNS(ns, 'line');
    yAxis.setAttribute('x1', 0);
    yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', 0);
    yAxis.setAttribute('y2', height);
    yAxis.setAttribute('stroke', '#000');
    yAxis.setAttribute('stroke-width', 2);
    g.appendChild(yAxis);

    // X-axis ticks (powers of 10)
    for (let p = logMin; p <= logMax; p++) {
        const x = ((p - logMin) / (logMax - logMin)) * width;
        const tick = document.createElementNS(ns, 'line');
        tick.setAttribute('x1', x);
        tick.setAttribute('y1', height);
        tick.setAttribute('x2', x);
        tick.setAttribute('y2', height + 6);
        tick.setAttribute('stroke', '#000');
        tick.setAttribute('stroke-width', 1.5);
        g.appendChild(tick);

        const label = document.createElementNS(ns, 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', height + 22);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('class', 'tick-label');
        label.textContent = `10${superscript(p)}`;
        g.appendChild(label);

        // Actually use proper superscript with tspan
        label.textContent = '';
        const base = document.createElementNS(ns, 'tspan');
        base.textContent = '10';
        label.appendChild(base);
        const sup = document.createElementNS(ns, 'tspan');
        sup.textContent = p;
        sup.setAttribute('dy', '-6');
        sup.setAttribute('font-size', '10');
        label.appendChild(sup);
    }

    // X-axis label
    const xLabel = document.createElementNS(ns, 'text');
    xLabel.setAttribute('x', width / 2);
    xLabel.setAttribute('y', height + 45);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('class', 'axis-label');
    xLabel.textContent = 'Pre-Caching Degree Q(w)';
    g.appendChild(xLabel);

    // Y-axis ticks
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
        const val = Math.round((maxCount / yTicks) * i);
        const y = height - (val / maxCount) * height;

        const tick = document.createElementNS(ns, 'line');
        tick.setAttribute('x1', -6);
        tick.setAttribute('y1', y);
        tick.setAttribute('x2', 0);
        tick.setAttribute('y2', y);
        tick.setAttribute('stroke', '#000');
        tick.setAttribute('stroke-width', 1.5);
        g.appendChild(tick);

        const label = document.createElementNS(ns, 'text');
        label.setAttribute('x', -10);
        label.setAttribute('y', y + 4);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('class', 'tick-label');
        label.textContent = val;
        g.appendChild(label);
    }

    // Y-axis label
    const yLabel = document.createElementNS(ns, 'text');
    yLabel.setAttribute('transform', `translate(-42,${height / 2}) rotate(-90)`);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('class', 'axis-label');
    yLabel.textContent = 'Count';
    g.appendChild(yLabel);

    // Populate annotation boxes with tail features
    populateAnnotations(features);
}

function interpolateColor(t) {
    // Green (#008a0e) -> warm yellow (#c49a1a) -> Blue (#1071e5)
    let r, g, b;
    if (t < 0.5) {
        const s = t * 2;
        r = Math.round(0 + s * (196 - 0));
        g = Math.round(138 + s * (154 - 138));
        b = Math.round(14 + s * (26 - 14));
    } else {
        const s = (t - 0.5) * 2;
        r = Math.round(196 + s * (16 - 196));
        g = Math.round(154 + s * (113 - 154));
        b = Math.round(26 + s * (229 - 26));
    }
    return `rgb(${r},${g},${b})`;
}

function superscript(n) {
    const map = { '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3', '4': '\u2074',
                  '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079', '-': '\u207B' };
    return String(n).split('').map(c => map[c] || c).join('');
}

function showHistogramTooltip(e, bin) {
    const tooltip = document.getElementById('histogram-tooltip');
    if (!tooltip || bin.count === 0) return;

    const rangeStart = Math.pow(10, bin.logStart).toFixed(bin.logStart < 0 ? 3 : 1);
    const rangeEnd = Math.pow(10, bin.logEnd).toFixed(bin.logEnd < 0 ? 3 : 1);

    let html = `<div class="tooltip-header">Q(w): ${rangeStart} – ${rangeEnd} (${bin.count} features)</div>`;

    // Show up to 5 random features from this bin
    const sample = bin.features.length <= 5 ? bin.features :
        bin.features.sort(() => Math.random() - 0.5).slice(0, 5);

    for (const f of sample) {
        html += `<div class="tooltip-feature">${f.desc} <span class="feature-id">#${f.feature_idx}</span></div>`;
    }

    if (bin.features.length > 5) {
        html += `<div class="tooltip-feature" style="color:#999;font-style:italic">...and ${bin.features.length - 5} more</div>`;
    }

    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    moveHistogramTooltip(e);
}

function moveHistogramTooltip(e) {
    const tooltip = document.getElementById('histogram-tooltip');
    if (!tooltip) return;

    const wrapper = tooltip.parentElement;
    const wrapperRect = wrapper.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let x = e.clientX - wrapperRect.left + 15;
    let y = e.clientY - wrapperRect.top - 10;

    // Keep tooltip in bounds
    if (x + tooltipRect.width > wrapperRect.width - 10) {
        x = e.clientX - wrapperRect.left - tooltipRect.width - 15;
    }
    if (y + tooltipRect.height > wrapperRect.height - 10) {
        y = wrapperRect.height - tooltipRect.height - 10;
    }
    if (y < 5) y = 5;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function hideHistogramTooltip() {
    const tooltip = document.getElementById('histogram-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

function populateAnnotations(features) {
    const rightBox = document.getElementById('annotation-right');
    if (!rightBox) return;

    // Sort by pc_index
    const sorted = [...features].sort((a, b) => a.pc_index - b.pc_index);

    // Top 5 (most pre-cached)
    const top5 = sorted.slice(-5).reverse();
    let rightHTML = '<div class="annotation-title">Most "pre-cached" features:</div><ul>';
    for (const f of top5) {
        rightHTML += `<li>${f.desc}</li>`;
    }
    rightHTML += '</ul>';
    rightBox.innerHTML = rightHTML;
}
