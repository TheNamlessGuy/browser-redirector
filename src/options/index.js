let BackgroundPage;
let Redirects;
let RedirectTypes;

const Template = {
  init: function(template) {
    return template.content.firstElementChild.cloneNode(true)
  },
};

const Errors = {
  element: null,

  init: function() {
    Errors.element = document.getElementById('errors');
  },

  show: function(msg) {
    Errors.element.classList.remove('hidden');
    Errors.element.innerText = msg;
  },

  hide: function() {
    Errors.element.classList.add('hidden');
    Errors.element.innerText = '';
  }
};

const Area = {
  container: null,
  template: null,

  init: function() {
    Area.template = document.getElementById('template-area');
    Area.container = document.getElementById('area-container');
  },

  add: function(name) {
    const area = Template.init(Area.template);

    const title = area.getElementsByClassName('area-title')[0];
    title.innerText = (name == null || name === '' ? 'No area name' : `Area: ${name}`);
    title.addEventListener('click', () => {
      area.getElementsByClassName('content')[0].classList.toggle('hidden');
      area.getElementsByClassName('content-hidden')[0].classList.toggle('hidden');
    });

    const nameInput = area.getElementsByClassName('area-name')[0];
    nameInput.value = name;
    nameInput.addEventListener('input', () => {
      title.innerText = (nameInput.value == null || nameInput.value === '' ? 'No area name' : `Area: ${nameInput.value}`);
    });

    area.getElementsByClassName('remove-btn')[0].addEventListener('click', () => Area.remove(area));
    area.getElementsByClassName('add-redirect-btn')[0].addEventListener('click', () => Redirect.add(area));

    Area.container.appendChild(area);

    Area._areas.push({name: name, element: area});
    return area;
  },

  _areas: [],
  get: function(name) {
    for (const area of Area._areas) {
      if (area.name === name) {
        return area.element;
      }
    }

    return Area.add(name);
  },

  remove: function(area) {
    const idx = Area._areas.findIndex((x) => x.element === area);
    Area._areas[idx].element.remove();
    Area._areas.splice(idx, 1);
  },
};

const Redirect = {
  template: null,

  init: function() {
    Redirect.template = document.getElementById('template-redirect');
  },

  add: function(area, data = {}) {
    const redirect = Template.init(Redirect.template);

    redirect.getElementsByClassName('from-input')[0].value = data.from?.url ?? null;

    const type = redirect.getElementsByClassName('type')[0];
    type.value = data.to?.type ?? RedirectTypes.REGEX;
    Redirect._showType(redirect, type.value);
    type.addEventListener('change', () => Redirect._showType(redirect, type.value));
    if (type.value === RedirectTypes.REGEX) {
      redirect.getElementsByClassName('type-regex-input')[0].value = data.to?.url ?? null;
    } else if (type.value === RedirectTypes.INTERNAL) {
      redirect.getElementsByClassName('type-internal-select')[0].value = data.to?.url ?? null;
    }

    const activeContainer = redirect.getElementsByClassName('active-container')[0];
    const active = activeContainer.getElementsByClassName('active')[0];
    active.checked = data.active ?? true;
    activeContainer.addEventListener('click', () => active.checked = !active.checked);
    active.addEventListener('click', () => active.checked = !active.checked);

    redirect.getElementsByClassName('remove-btn')[0].addEventListener('click', () => redirect.parentNode.removeChild(redirect));

    area.getElementsByClassName('redirect-container')[0].appendChild(redirect);
    return redirect;
  },

  _showType: function(redirect, type) {
    Array.from(redirect.querySelectorAll('[class*=type--]')).forEach((x) => x.classList.add('hidden'));
    redirect.getElementsByClassName(`type--${type}`)[0].classList.remove('hidden');
  },

  save: async function() {
    Errors.hide();

    const opts = await Redirects.getOptions();
    opts.redirects = [];

    const areaNames = [];
    const areas = document.getElementsByClassName('area');
    for (const area of areas) {
      let areaName = area.getElementsByClassName('area-name')[0].value;
      if (areaName === '') { areaName = null; }
      if (areaNames.includes(areaName)) {
        Errors.show(`Cannot have two areas with the same name. Hint: duplicate name is '${areaName ?? ''}'`);
        return;
      }
      areaNames.push(areaName);

      const redirects = area.getElementsByClassName('redirect');

      for (const redirect of redirects) {
        const data = {
          area: areaName,
          active: redirect.getElementsByClassName('active')[0].checked,
          from: {url: redirect.getElementsByClassName('from-input')[0].value},
          to: {
            type: redirect.getElementsByClassName('type')[0].value,
            url: null,
          },
        };

        if (data.to.type === RedirectTypes.REGEX) {
          data.to.url = redirect.getElementsByClassName('type-regex-input')[0].value;
        } else if (data.to.type === RedirectTypes.INTERNAL) {
          data.to.url = redirect.getElementsByClassName('type-internal-select')[0].value;
        }

        if (data.from.url.length === 0) {
          Errors.show(`The 'from' field cannot be empty. Hint: area name is '${areaName ?? ''}'`);
          return;
        } else if (data.to.url.length === 0) {
          Errors.show(`The 'to' field cannot be empty. Hint: area name is '${areaName ?? ''}'`);
          return;
        }

        opts.redirects.push(data);
      }
    }

    await Redirects.setOptions(opts);
    await Redirects.generateRedirects();
  },
};

window.addEventListener('DOMContentLoaded', async () => {
  BackgroundPage = await browser.runtime.getBackgroundPage();
  Redirects = await BackgroundPage.getRedirects();
  RedirectTypes = await BackgroundPage.getRedirectTypes();

  Errors.init();
  Area.init();
  Redirect.init();

  const opts = await Redirects.getOptions();
  for (const redirect of opts.redirects) {
    Redirect.add(Area.get(redirect.area), redirect);
  }

  document.getElementById('save-btn').addEventListener('click', Redirect.save);
  document.getElementById('add-new-area-btn').addEventListener('click', () => Area.add(null));
});