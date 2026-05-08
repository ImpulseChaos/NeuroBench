const Router = (() => {
  let current  = 'dashboard';
  let activeTest = null;

  const tests = {
    reaction: ReactionTest,
    typing:   TypingTest,
    aim:      AimTest,
    sequence: SequenceTest
  };

  function go(screenId) {
    if (activeTest && tests[activeTest]) {
      tests[activeTest].destroy();
      tests[activeTest] = null;
      tests.reaction = ReactionTest;
      tests.typing   = TypingTest;
      tests.aim      = AimTest;
      tests.sequence = SequenceTest;
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    const el = document.getElementById(screenId);
    if (!el) return;
    el.classList.add('active');
    current = screenId;

    if (screenId !== 'dashboard' && tests[screenId]) {
      activeTest = screenId;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tests[screenId].init();
        });
      });
    } else {
      activeTest = null;
      GameState.updateDashboard();
    }
  }

  return { go, current: () => current };
})();

document.addEventListener('DOMContentLoaded', () => {
  Router.go('dashboard');

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const cur = Router.current();
      if (cur !== 'dashboard') Router.go('dashboard');
    }
  });
});
