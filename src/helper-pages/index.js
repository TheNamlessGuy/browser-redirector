window.addEventListener('DOMContentLoaded', () => {
  new URL(window.location.href).searchParams.forEach((value, key) => {
    const elem = document.getElementById(key)
    if (elem != null) {
      elem.innerText = value;
      elem.classList.add('filled');
    }
  });
});