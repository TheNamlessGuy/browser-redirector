window.addEventListener('DOMContentLoaded', async () => {
  const BackgroundPage = await browser.runtime.getBackgroundPage();
  const Background = await BackgroundPage.getBackground();

  const url = new URL(window.location.href);

  url.searchParams.forEach((value, key) => {
    const elem = document.getElementById(key);
    if (elem != null) {
      elem.innerText = value;
      elem.classList.add('filled');
    }
  });

  document.getElementById('reload-url-btn')?.addEventListener('click', () => {
    Background.moveCurrentTabTo(url.searchParams.get('url'));
  });

  document.getElementById('add-exception-btn')?.addEventListener('click', () => {
    Background.addException(url.searchParams.get('url'), url.searchParams.get('idx'));
  });
});