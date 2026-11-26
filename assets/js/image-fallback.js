// Define handleAssistantImgError immediately before any <img> elements load
try {
  window.handleAssistantImgError = function handleAssistantImgError(imgEl) {
    if (!imgEl || imgEl.dataset.fallbackApplied === '1') return;
    imgEl.dataset.fallbackApplied = '1';
    imgEl.style.display = 'none';
    const parent = imgEl.parentElement;
    if (parent && !parent.querySelector('.ai-svg-fallback')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', '#22d3ee');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.classList.add('ai-svg-fallback', 'w-4', 'h-4');
      svg.innerHTML = '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>';
      parent.appendChild(svg);
    }
  };
} catch (_err) {
  // No-op if DOM creation is unavailable
}
