(function () {
  window.ZFG = window.ZFG || {};

  ZFG.gate = function (password, onOk) {
    var backdrop = document.createElement('div');
    backdrop.className = 'modal';

    var card = document.createElement('div');
    card.className = 'overlay-card';

    var heading = document.createElement('h2');
    heading.className = 'overlay-card__title';
    heading.textContent = 'Dostęp chroniony';

    var body = document.createElement('div');
    body.className = 'overlay-card__text';

    var label = document.createElement('p');
    label.textContent = 'Podaj hasło, aby wejść:';
    label.style.margin = '0 0 8px';

    var input = document.createElement('input');
    input.className = 'input';
    input.type = 'password';

    var err = document.createElement('p');
    err.style.margin = '8px 0 0';
    err.style.color = '#a80000';
    err.textContent = '';

    body.appendChild(label);
    body.appendChild(input);
    body.appendChild(err);

    var actions = document.createElement('div');
    actions.className = 'overlay-card__actions';

    var ok = document.createElement('button');
    ok.className = 'btn btn--primary';
    ok.type = 'button';
    ok.textContent = 'Wejdź';

    var cancel = document.createElement('button');
    cancel.className = 'btn';
    cancel.type = 'button';
    cancel.textContent = 'Anuluj';

    actions.appendChild(ok);
    actions.appendChild(cancel);
    card.appendChild(heading);
    card.appendChild(body);
    card.appendChild(actions);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    setTimeout(function () { input.focus(); }, 30);

    function submit() {
      if (input.value === password) {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        onOk();
      } else {
        err.textContent = 'Błędne hasło.';
        input.value = '';
        input.focus();
      }
    }

    ok.addEventListener('click', submit);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') submit();
    });
    cancel.addEventListener('click', function () {
      window.location.href = '../../index.html';
    });
  };
})();
