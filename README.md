# NutriFit (planogymnutri-web)

Site de planos de ginásio e nutrição personalizados, desenvolvido de acordo com o objetivo físico de cada pessoa. O utilizador pode indicar o seu objetivo físico e receber um plano de treino e alimentação adaptado às suas necessidades.

**Autores:** Diogo Correia TP1 e Guilherme Carvalho TP2

**Estado:** em desenvolvimento

## Tecnologias

- Site: HTML, CSS e JavaScript
- Servidor: Node.js e Express (sessões com express-session)
- Base de dados: SQLite (better-sqlite3)
- Palavras-passe guardadas com hash (bcrypt)

## Como correr o projeto

Instalar o [Node.js](https://nodejs.org) (versão LTS).
Na pasta do projeto, instalar as bibliotecas: `npm install`
Arrancar o servidor: `npm start`
Abrir no browser: http://localhost:3000

A base de dados (`database.sqlite`) é criada sozinha no primeiro arranque, já com os exercícios e alimentos iniciais.

Durante o desenvolvimento, `npm run dev` reinicia o servidor sempre que um ficheiro é alterado.
