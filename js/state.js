const TYPING_TEXTS = [
  "The neural pathways of the human brain form a complex network capable of processing information at speeds that modern computers still struggle to match in any meaningful way.",
  "Precision and speed are the hallmarks of a skilled programmer who understands that clean code is not written but rather crafted through iteration and careful refinement over time.",
  "Technology has transformed the way we communicate interact and perceive the world around us bringing both unprecedented opportunities and genuinely complex challenges to navigate.",
  "In the deep silence of the server room ancient machines stand as witnesses to decades of computation their circuits humming quietly with the weight of accumulated data.",
  "Quantum mechanics reveals a universe fundamentally stranger than classical physics ever imagined where particles exist in superposition until the moment of observation collapses them.",
  "The cursor blinks patiently awaiting instruction as the developer stares at the screen searching for the elegant solution hidden somewhere within the complexity of the problem."
];

const GameState = {
  scores: { reaction: [], typing: [], aim: [], sequence: [] },

  add(test, score) {
    this.scores[test].push(score);
    this.updateDashboard();
  },

  getBest(test) {
    const s = this.scores[test];
    if (!s.length) return null;
    // Reaction: lower is better; typing/aim/sequence: higher is better
    return test === 'reaction' ? Math.min(...s) : Math.max(...s);
  },

  getAvg(test) {
    const s = this.scores[test];
    if (!s.length) return null;
    return Math.round(s.reduce((a, b) => a + b, 0) / s.length);
  },

  updateDashboard() {
    const fmt = (v, suffix) => v !== null ? v + (suffix||'') : '—';

    const rb = this.getBest('reaction');
    document.getElementById('dash-reaction-best').textContent = rb !== null ? rb : '—';
    document.getElementById('dash-reaction-avg').textContent  = fmt(this.getAvg('reaction'), 'ms');

    const tb = this.getBest('typing');
    document.getElementById('dash-typing-best').textContent  = tb !== null ? tb : '—';
    document.getElementById('dash-typing-avg').textContent   = fmt(this.getAvg('typing'));

    document.getElementById('dash-aim-best').textContent     = fmt(this.getBest('aim'));
    document.getElementById('dash-aim-count').textContent    = this.scores.aim.length;

    const sb = this.getBest('sequence');
    document.getElementById('dash-sequence-best').textContent = sb !== null ? sb : '—';
    document.getElementById('dash-sequence-max').textContent  = sb !== null ? sb : '—';
  }
};
