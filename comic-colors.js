/**
 * Color constants for the Othello board
 * Edit these values to customize the appearance
 */

const OTHELLO_COLORS = {
    // Board colors
    boardBorder: '#a8a5a2',      // Border/gap between cells
    cellBackground: '#f5ecdc',   // Normal cell background
    cellHover: '#c9b896',        // Cell on hover

    // Legal move highlight
    legalMove: 'rgba(0, 255, 0, 0.35)',
    legalMoveHover: 'rgba(0, 255, 0, 0.5)',

    // NTP classification colors
    ntpUseful: '#81b8e6',        // Green for well-represented
    ntpUseless: '#888888',       // Grey for poorly-represented

    // Highlight mode: false = border only, true = fill cell background
    highlightFull: true,

    // Piece colors (gradients defined in CSS)
    blackPieceLight: '#444',
    blackPieceDark: '#111',
    whitePieceLight: '#fff',
    whitePieceDark: '#ddd',
    whitePieceBorder: '#999'
};

// Apply colors to CSS custom properties
function applyOthelloColors() {
    const root = document.documentElement;
    root.style.setProperty('--board-border', OTHELLO_COLORS.boardBorder);
    root.style.setProperty('--cell-bg', OTHELLO_COLORS.cellBackground);
    root.style.setProperty('--cell-hover', OTHELLO_COLORS.cellHover);
    root.style.setProperty('--legal-move', OTHELLO_COLORS.legalMove);
    root.style.setProperty('--legal-move-hover', OTHELLO_COLORS.legalMoveHover);
    root.style.setProperty('--ntp-useful', OTHELLO_COLORS.ntpUseful);
    root.style.setProperty('--ntp-useless', OTHELLO_COLORS.ntpUseless);
    root.style.setProperty('--black-piece-light', OTHELLO_COLORS.blackPieceLight);
    root.style.setProperty('--black-piece-dark', OTHELLO_COLORS.blackPieceDark);
    root.style.setProperty('--white-piece-light', OTHELLO_COLORS.whitePieceLight);
    root.style.setProperty('--white-piece-dark', OTHELLO_COLORS.whitePieceDark);
    root.style.setProperty('--white-piece-border', OTHELLO_COLORS.whitePieceBorder);

    // Apply highlight mode class
    if (OTHELLO_COLORS.highlightFull) {
        document.body.classList.add('highlight-full');
    } else {
        document.body.classList.remove('highlight-full');
    }
}

// Apply on load
document.addEventListener('DOMContentLoaded', applyOthelloColors);
