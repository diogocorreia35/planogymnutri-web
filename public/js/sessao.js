// Partilha o estado de autenticação e o login entre as páginas do site.
(function () {
  const barra = document.getElementById('nav-actions') || document.querySelector('.nav-actions');
  const overlay = document.getElementById('overlay-login') || document.querySelector('.overlay');
  const formLogin = document.getElementById('form-login') || (overlay && overlay.querySelector('form'));

  // Reutiliza as funções da página inicial ou altera o modal diretamente nas outras páginas.
  function abrirLogin() {
    if (typeof abrirModal === 'function') abrirModal();
    else if (overlay) overlay.classList.add('ativo');
  }

  function fecharLogin() {
    if (typeof fecharModal === 'function') fecharModal();
    else if (overlay) overlay.classList.remove('ativo');
  }

  function mostrarSessaoIniciada(utilizador) {
    if (!barra) return;

    const ola = document.createElement('span');
    ola.className = 'texto-ola';
    ola.textContent = 'Olá, ' + utilizador.nome;

    const perfil = document.createElement('a');
    perfil.href = '/perfil.html';
    perfil.className = 'btn btn-outline';
    perfil.textContent = 'O meu perfil';

    const sair = document.createElement('button');
    sair.type = 'button';
    sair.className = 'btn btn-primary';
    sair.textContent = 'Sair';
    sair.addEventListener('click', terminarSessao);

    barra.textContent = '';
    barra.append(ola, perfil, sair);
  }

  async function terminarSessao() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (erro) {
      // A navegação para o início prossegue mesmo se o servidor não responder.
    }
    window.location.href = '/index.html';
  }

  if (formLogin) {
    const campoEmail = formLogin.querySelector('input[type="email"]');
    const campoPassword = formLogin.querySelector('input[type="password"]');
    const botao = formLogin.querySelector('button[type="submit"]');

    let erro = formLogin.querySelector('.erro-login');
    if (!erro) {
      erro = document.createElement('p');
      erro.className = 'erro-login';
      erro.setAttribute('role', 'alert');
      erro.hidden = true;
      erro.style.cssText = 'color:#b00020;font-size:0.9rem;margin:8px 0 0;';
      if (botao && botao.parentNode) botao.parentNode.insertBefore(erro, botao);
      else formLogin.append(erro);
    }

    formLogin.addEventListener('submit', async function (e) {
      e.preventDefault();
      erro.hidden = true;

      if (!campoEmail.value.trim() || !campoPassword.value) {
        erro.textContent = 'Preenche o email e a palavra-passe.';
        erro.hidden = false;
        return;
      }

      if (botao) botao.disabled = true;
      try {
        const resposta = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: campoEmail.value, password: campoPassword.value })
        });
        const dados = await resposta.json().catch(function () { return {}; });

        if (resposta.ok) {
          campoPassword.value = '';
          fecharLogin();
          mostrarSessaoIniciada(dados.utilizador);
        } else {
          erro.textContent = dados.erro || 'Não foi possível iniciar sessão. Tenta outra vez.';
          erro.hidden = false;
        }
      } catch (falha) {
        erro.textContent = 'Não consegui falar com o servidor. Confirma que ele está a correr.';
        erro.hidden = false;
      } finally {
        if (botao) botao.disabled = false;
      }
    });
  }

  async function iniciar() {
    // Evita mostrar por instantes os controlos de utilizador não autenticado.
    if (barra) barra.style.visibility = 'hidden';

    let logado = false;
    try {
      const resposta = await fetch('/api/auth/eu');
      const dados = await resposta.json();
      if (dados.logado) {
        logado = true;
        mostrarSessaoIniciada(dados.utilizador);
      }
    } catch (falha) {
      // Sem resposta, mantém os controlos de autenticação já renderizados.
    }
    if (barra) barra.style.visibility = '';

    const pedirLogin = new URLSearchParams(window.location.search).get('login') === '1';
    if (pedirLogin && !logado) abrirLogin();
  }

  iniciar();
})();
