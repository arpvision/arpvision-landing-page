export function setupTabs(root: HTMLElement, selector: string, activate: (index: number) => void) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>(selector)];
  const select = (index: number) => {
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    const panel = document.getElementById(buttons[index].getAttribute('aria-controls')!);
    panel?.setAttribute('aria-labelledby', buttons[index].id);
    activate(index);
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      select(next);
      buttons[next].focus();
    });
  });
}
