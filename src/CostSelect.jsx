import React, { useEffect, useId, useRef, useState } from 'react';

export default function CostSelect({ label, value, options, onChange }) {
  const id = useId();
  const root = useRef(null);
  const trigger = useRef(null);
  const search = useRef({ text: '', at: 0 });
  const selected = Math.max(0, options.findIndex(option => option.value === value));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selected);

  useEffect(() => {
    if (!open) return;
    const dismiss = event => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  useEffect(() => {
    if (open) root.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = index => {
    onChange(options[index].value);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  const onKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      setActive(previous => event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : !open ? selected : (previous + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(active);
      else { setActive(selected); setOpen(true); }
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const text = (now - search.current.at < 600 ? search.current.text : '') + event.key.toLowerCase();
      search.current = { text, at: now };
      const match = options.findIndex(option => option.label.toLowerCase().startsWith(text));
      if (match !== -1) { event.preventDefault(); setActive(match); setOpen(true); }
    }
  };

  return <span className={`cost-select${open ? ' is-open' : ''}`} ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="cost-select-trigger" role="combobox" aria-label={`${label}: ${options[selected].label}`} aria-expanded={open} aria-haspopup="listbox" aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-${active}` : undefined} onKeyDown={onKeyDown} onClick={() => { setActive(selected); setOpen(previous => !previous); }}>
      <span>{options[selected].label}</span><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.25"/></svg>
    </button>
    <span className="cost-select-panel" aria-hidden={!open} inert={!open}>
      <span className="cost-select-clip"><span className="cost-select-options" id={`${id}-list`} role="listbox" aria-label={label}>
        {options.map((option, index) => <span role="option" id={`${id}-${index}`} key={option.value} aria-selected={value === option.value} data-active={active === index} onMouseDown={event => event.preventDefault()} onPointerMove={() => setActive(index)} onClick={() => choose(index)}>
          <span>{option.label}</span><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.3"/></svg>
        </span>)}
      </span></span>
    </span>
  </span>;
}
