Thrust
[![Build Status](https://travis-ci.org/Thrustjs/thrust.svg?branch=master)](https://travis-ci.org/Thrustjs/thrust) [![GitHub release](https://img.shields.io/github/release/thrustjs/thrust.svg)](https://github.com/Thrustjs/thrust/releases) [![GitHub downloads](https://img.shields.io/github/downloads/thrustjs/thrust/total.svg)](https://github.com/Thrustjs/thrust/releases)
===============

Esta versão do [thrust](https://github.com/Thrustjs/thrust) dispensa a necessidade de um jar, sendo que o mesmo é executado diretamente via jjs.

Obs: Work in progress.

# Principais vantagens

1 - Não temos um fonte fragmentado entre Javascript e Java, agora temos apenas Javascript.

2 - Como não temos um artefato Java segurando a JVM (thrust.jar) então podemos modificar qualquer arquivo do thrust em runtime, por exemplo para criar um ```thrust upgrade``` que poderia atualizar ele mesmo.

3 - Até o momento não precisamos de quebrar a interface da plataforma, ou seja, qualquer aplicação rodando com o thrust v0.3.0 poderá ter o thrust substituído.

# Utilização

Clonar o repositório.

Instalar as dependências com 

```bash
{PROJECT_DIR}/scripts/thrust-local install
```

Para executar os testes

```bash
{PROJECT_DIR}/scripts/thrust-local ./test/test.js
```
Você pode criar projetos e utilizar usando

```bash
cd /home/user/ # posicionar onde será criado
{PROJECT_DIR}/scripts/thrust-local init appThrust # criar com o nome desejado
cd /home/user/appThrust # entrar na pasta criada
{PROJECT_DIR}/scripts/thrust-local startup.js # iniciar o app
```

# Debug no VSCode

Para realizar o debug do thrust siga os seguintes passos:

1 -Baixe o seguinte projeto, extraria e o coloque sua pasta `bin` no path de seu SO: [NCDbg](https://github.com/provegard/ncdbg/releases/tag/0.8.0)

2 - No Visual Studio Code, instale a extensão [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) e reinicie o mesmo.

3 - Adicione o arquivo de configuração de execução do VSCode, em `.vscode/launch.json`. (Copie o deste repositório)

4 - Coloque as instruções de `debugger;` em seu código.

5 - Inicie sua aplicação com `thrust --debug arquivo.js`

6 - A execução ficará aguardando conexão do debug para prosseguir, então na aba `Debug` do VSCode, inicie a execução de `Attach to NCDbg`