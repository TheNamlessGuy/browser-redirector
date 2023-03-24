let BackgroundPage;
let Redirects;

const Template = {
  redirect: null,

  init: function(template) {
    return template.content.firstElementChild.cloneNode(true)
  },
};

const Container = {
  redirects: null,
};

function addRedirect(from, to, internal) {
  const elem = Template.init(Template.redirect);

  elem.getElementsByClassName('from-input')[0].value = from;

  const internalElem = elem.getElementsByClassName('internal-checkbox')[0];
  internalElem.checked = internal;
  internalElem.addEventListener('change', () => {
    const oldTo = elem.getElementsByClassName(!internalElem.checked ? 'to-select' : 'to-input')[0];
    oldTo.classList.add('hidden');

    const newTo = elem.getElementsByClassName(internalElem.checked ? 'to-select' : 'to-input')[0];
    newTo.classList.remove('hidden');
  });

  const toElem = elem.getElementsByClassName(internal ? 'to-select' : 'to-input')[0];
  toElem.value = to;
  toElem.classList.remove('hidden');

  elem.getElementsByClassName('remove-btn')[0].addEventListener('click', () => {
    Container.redirects.removeChild(elem);
  });

  Container.redirects.appendChild(elem);
}

async function save() {
  const opts = await Redirects.getOptions();
  opts.redirects = [];

  const redirects = document.getElementsByClassName('redirect');

  for (const redirect of redirects) {
    const data = {
      from: {
        url: redirect.getElementsByClassName('from-input')[0].value,
      },
      to: {
        internal: redirect.getElementsByClassName('internal-checkbox')[0].checked,
        url: null,
      },
    };
    data.to.url = redirect.getElementsByClassName(data.to.internal ? 'to-select' : 'to-input')[0].value;

    opts.redirects.push(data);
  }

  await Redirects.setOptions(opts);
  await Redirects.generateRedirects();
}

window.addEventListener('DOMContentLoaded', async () => {
  BackgroundPage = await browser.runtime.getBackgroundPage();
  Redirects = await BackgroundPage.getRedirects();

  Template.redirect = document.getElementById('redirect-template');
  Container.redirects = document.getElementById('redirects-container');

  const opts = await Redirects.getOptions();
  if ('redirects' in opts) {
    for (const redirect of opts.redirects) {
      addRedirect(redirect.from.url, redirect.to.url, redirect.to.internal);
    }
  }

  document.getElementById('save-btn').addEventListener('click', save);
  document.getElementById('add-new-btn').addEventListener('click', () => addRedirect('', '', false));
});