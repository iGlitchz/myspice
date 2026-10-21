import React from 'react';

export default function Wordmark({titleCase=false}) {
  return <span className="wordmark" aria-label="MySpice"><strong>{titleCase?'My':'MY'}</strong><em>{titleCase?'Spice':'spice'}</em><span className="brand-period" aria-hidden="true">.</span></span>;
}
