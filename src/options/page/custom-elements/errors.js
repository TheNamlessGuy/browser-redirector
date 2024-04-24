class ErrorsElement extends HTMLElement {
  _container = null;

  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = `
.container { padding: 5px; }
.container:empty { padding: 0; }

.container > * {
  border-radius: 5px;
  margin-bottom: 5px;
  border: 2px solid var(--background-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.container > * > div {
  display: flex;
  align-items: center;
}

.container > * .symbol {
  margin: 0 5px;
  color: var(--foreground-color);
}

.container > * .x-btn {
  border: none;
  padding: 5px;
  cursor: pointer;
  background: none;
}

.error {
  --background-color: #C00;
  --foreground-color: var(--background-color);
}

.warning {
  --background-color: #C60;
  --foreground-color: var(--background-color);
}
`;

    this._container = document.createElement('div');
    this._container.classList.add('container');

    this.attachShadow({mode: 'closed'}).append(style, this._container);
    this.clear();
  }

  _addChild(symbol, msg, classes) {
    const child = document.createElement('div');
    child.classList.add(...classes);
    this._container.append(child);

    const lhs = document.createElement('div');
    const rhs = document.createElement('div');
    child.append(lhs, rhs);

    const symbolElem = document.createElement('span');
    symbolElem.classList.add('symbol');
    symbolElem.innerText = symbol;
    lhs.append(symbolElem);

    const msgElem = document.createElement('span');
    msgElem.classList.add('msg');
    msgElem.innerText = msg;
    lhs.append(msgElem);

    const button = document.createElement('button');
    button.classList.add('x-btn');
    button.innerText = '⨯';
    button.addEventListener('click', () => child.remove());
    rhs.append(button);
  }

  addError(msg) {
    this._addChild('𐤈︎', msg, ['error']);
  }

  addWarning(msg) {
    this._addChild('⚠', msg, ['warning']);
  }

  clear() {
    while (this._container.children.length > 0) {
      this._container.children[0].remove();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => customElements.define('c-errors', ErrorsElement));