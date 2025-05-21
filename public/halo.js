document.addEventListener('DOMContentLoaded', () => {
  const elementos = document.querySelectorAll('.animado');

  const mostrarElemento = () => {
    const trigger = window.innerHeight * 0.85;
    elementos.forEach(el => {
      const top = el.getBoundingClientRect().top;
      if (top < trigger) {
        el.classList.add('visible');
      }
    });
  };

  window.addEventListener('scroll', mostrarElemento);
  mostrarElemento(); // ejecuta al cargar
});