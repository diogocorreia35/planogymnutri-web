// sessao.js: trata da sessão em todas as páginas.
//  1) pergunta ao servidor se há sessão iniciada (rota /api/auth/eu)
//  2) mostra a barra do topo certa: "Entrar / Criar conta"  OU  "Olá, nome / O meu perfil / Sair"
//  3) liga o formulário de login (o modal da página inicial) ao servidor
(function () {
  const barra = document.getElementById('nav-actions') || document.querySelector('.nav-actions');
  const overlay = document.getElementById('overlay-login') || document.querySelector('.overlay');
  const formLogin = document.getElementById('form-login') || (overlay && overlay.querySelector('form'));

  // Usam as funções do index.html, se existirem; senão mexem na classe "ativo" do overlay
  function abrirLogin() {
    if (typeof abrirModal === 'function') abrirModal();
    else if (overlay) overlay.classList.add('ativo');
  }

  function fecharLogin() {
    if (typeof fecharModal === 'function') fecharModal();
    else if (overlay) overlay.classList.remove('ativo');
  }

  // Troca "Entrar / Criar conta" por "Olá, nome / O meu perfil / Sair"
  function mostrarSessaoIniciada(utilizador) {
    if (!barra) return;

    const ola = document.createElement('span');
    ola.className = 'texto-ola';
    ola.textContent = 'Olá, ' + utilizador.nome; // textContent: o nome nunca é tratado como HTML

    const perfil = document.createElement('a');
    perfil.href = '/perfil.html';
    perfil.className = 'btn btn-outline';
    perfil.textContent = 'O meu perfil';

    const sair = document.createElement('button');
    sair.type = 'button';
    sair.className = 'btn btn-primary';
    sair.textContent = 'Sair';
    sair.addEventListener('click', terminarSessao);

    barra.textContent = ''; // limpa os botões antigos
    barra.append(ola, perfil, sair);
  }

  // Botão "Sair": avisa o servidor e volta à página inicial
  async function terminarSessao() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (erro) {
      // mesmo sem resposta do servidor, volta à página inicial
    }
    window.location.href = '/index.html';
  }

  // Formulário de login (o do modal da página inicial)
  if (formLogin) {
    const campoEmail = formLogin.querySelector('input[type="email"]');
    const campoPassword = formLogin.querySelector('input[type="password"]');
    const botao = formLogin.querySelector('button[type="submit"]');

    // Linha para mostrar erros (é criada aqui se a página ainda não tiver uma)
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
      e.preventDefault(); // impede a página de recarregar
      erro.hidden = true;

      if (!campoEmail.value.trim() || !campoPassword.value) {
        erro.textContent = 'Preenche o email e a palavra-passe.';
        erro.hidden = false;
        return;
      }

      if (botao) botao.disabled = true; // evita cliques repetidos enquanto espera
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

  // Ao abrir a página: pergunta ao servidor quem está com sessão iniciada
  async function iniciar() {
    // Esconde a barra por instantes, para quem já tem sessão não ver "Entrar" a piscar
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
      // sem servidor: a página fica como está
    }
    if (barra) barra.style.visibility = '';

    // Vindo do registo ("Fazer login"), o endereço traz ?login=1 e o modal abre sozinho
    const pedirLogin = new URLSearchParams(window.location.search).get('login') === '1';
    if (pedirLogin && !logado) abrirLogin();
  }

  iniciar();
})();
