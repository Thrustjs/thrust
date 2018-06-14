Thrust
[![Build Status](https://travis-ci.org/Thrustjs/thrust.svg?branch=master)](https://travis-ci.org/Thrustjs/thrust) [![GitHub release](https://img.shields.io/github/release/thrustjs/thrust.svg)](https://github.com/Thrustjs/thrust/releases) [![GitHub downloads](https://img.shields.io/github/downloads/thrustjs/thrust/total.svg)](https://github.com/Thrustjs/thrust/releases)
===============

O *thrust* (ou *thrustjs*) é uma plataforma de execução/interpretação JavaScript, ou seja, é um Server-side JavaScript (SSJS). Ele permite a escrita de código em JavaScript a ser executado sobre a Java Virtual Machine (JVM).
Desenvolvida pela [Softbox], empresa inovadora na área de soluções em TI, a plataforma foi concebida visando, principalmente:
 - Ser concisa e eficiente, com foco em alta performance;
 - Ter, nativamente, poucas APIs, diminuindo assim drasticamente a curva de aprendizagem;
 - Trabalhar fortemente o conceito de Definition Over Configuration, trazendo uma série de configurações padrões bem definidas, mas permitindo ao utilizador customiza-las à qualquer momento.

 O *thrust* dispõe de um CLI que permite a inicialização de projetos com scaffolding, instalação de dependências e execução dos apps *thrust*.

 A plataforma é completamente gratuita e disponibilizada para uso segundo as políticas de licenciamento MIT.


## Bitcodes

Bitcodes são equivalentes a um módulo em outras linguagens. Um bitcode é um namespace que agrupa funcionalidades afins.
Um exemplo é o bitcode [filesystem](https://github.com/thrust-bitcodes/filesystem) que possui várias funções ou API's que manipulam o sistema de arquivos do computador, como por exemplo leitura de arquivos, verificação da existência de um diretório ou arquivo etc.

O **thrust** já possui em sua versão inicial vários bitcodes que enriquecem a plataforma e auxiliam no desenvolvimento de soluções. Você pode ver cada um deles no nosso [repositório oficial](https://github.com/thrust-bitcodes).

Você também pode criar os seus próprios bitcodes e utilizá-los em seus *thrust* apps.

## Como usar?

 1 - Realize o download do [thrust] e instale.

 2 - O cli ```thrust``` agora estará disponível em seu terminal.

Agora, você poderá usar ```thrust init [/home/user/projects/thrust-test]``` para inicializar um novo app Thrust no diretório corrente ou no que foi passado como argumento.

Você pode passar uma opção para init chamada ```-t|-template```, para iniciar o seu projeto com um *seed* específico, o padrão no caso em que a opção não é passada é **[thrust-seeds/web-complete]**.

Você também pode criar os seus próprios seeds e utilizá-los em seus *thrust* apps.

## API

Em uma aplicação *thrust* disponibilizamos algumas funções e variáveis globais para utilização, vamos conhecer as principais delas:

```javascript
/**
 * Path base da aplicação que está rodando
 * */
const rootPath:String

/**
* Usado para carregar um módulo, que pode ser um arquivo ou bitcode
* @param   {String} fileName - Nome do recurso a ser carregado.
*   Caso seja passado um caminho relativo (./ ou ../) o módulo será carregado
*   com caminho relativo ao script que originou a chamada.
*
*   Caso seja passado um caminho iniciando com '/', consideramos o require
*   a partir do diretório root
*
*   Caso seja passado um nome, assumimos que é um require de bitcode,
*   sendo assim pesquisamos pelos bitcodes instalados.
*   O require de bitcodes, é feito com 'owner/bitcode', sendo que owner
*   é opcional e caso não informado será carregado um bitcode oficial,
*   'thrust-bitcodes/bitcode'
*
*   O algoritmo de require sempre pesquisa por 'NomeDoModulo/index.js'
*   ou 'NomeDoModulo.js', nesta ordem.
*
* @returns {Object} Retorna o modulo carregado
* @code require('database')
* @code require('ownerNaoOficial/database')
* @code require('./teste')
*/
function require(fileName)

/**
* Usado para carregar um jar para o Classpath da aplicação.
* @param {String} jarName - Nome do jar a ser carregado.
*   Caso seja passado um caminho relativo (./ ou ../) o módulo será carregado
*   com caminho relativo ao script que originou a chamada.
*
*   Caso seja passado um nome, assumimos que é um require de dependencia de um bitcode,
*   sendo assim pesquisamos pelos jars dos bitcodes instalados.
*
* @code loadJar('./vendor/meuJar.jar')
*/
function loadJar(jarName)

/**
* Usado para carregar um objeto para o contexto global
* @param {String} name - Nome que será colocado no contexto global.
* @param {String} name - Objeto que será colocado no contexto global.
*
* @code dangerouslyLoadToGlobal('db', {teste: 1})
* @code print(db.teste) //Saída: 1
*/
function dangerouslyLoadToGlobal(name, obj)

/**
* Usado para pegar o JSON de configuração (config.json)
* @code getConfig().minhaVar
*/
function getConfig()

/**
* Usado para pegar um getter de configuração
* O getter tem a assinatura (property:String,appId:String).
* É possível passar como 'property' um path do JSON, que
* irá navegar no mesmo e buscar uma configuração.
*
* Caso seja passado um appId como parâmetro, então
* o getter tentará buscar uma configuração com 'property'
* e adicionará o appId como ultimo parâmetro para tentar
* achar uma configuração específica deste app, se não encontrar,
* retorna apenas o valor do 'property', que representa o global
* para todas as possíveis aplicações.
*
*
* @returns {function} Usado para pegar configurações
*
* @code let dbConfig = getBitcodeConfig('database')
* @code dbConfig('path.de.uma.config')
* @code dbConfig('path.de.uma.config', 'MeuApp')
*/
function getBitcodeConfig(bitcode)

/**
* Usado para ler uma variável de ambiente do SO.
* Se não informado nenhum parametro, é retornado um objeto com todas as variáveis.
* @param {String} name - Nome da variável.
* @param {Object} defaultValue - Opcional, valor default que será utilizado caso a variável seja nula.
*
* @code env('PORT', 8778)
*/
function env(name, defaultValue)
```

## Parâmetros de configuração
As propriedades abaixo devem ser configuradas no arquivo *config.json* (distribuído juntamente com o ThrustJS):

``` javascript
/* Os valores abaixo representam os valores default*/
{
  "loadToGlobal": [], /*String/Array Bitcodes que devem ser carregados globalmente*/
  "cacheScript": false, /*Liga ou desliga o cache de require*/
}
```

# Debug no VSCode

Para realizar o debug do thrust siga os seguintes passos:

1 -Baixe o seguinte projeto, extraria e o coloque sua pasta `bin` no path de seu SO: [NCDbg](https://github.com/provegard/ncdbg/releases/tag/0.8.0)

2 - No Visual Studio Code, instale a extensão [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) e reinicie o mesmo.

3 - Adicione o arquivo de configuração de execução do VSCode, em `.vscode/launch.json`. (Copie o deste repositório)

4 - Coloque as instruções de `debugger;` em seu código.

5 - Inicie sua aplicação com `thrust arquivo.js --debug`

6 - A execução ficará aguardando conexão do debug para prosseguir, então na aba `Debug` do VSCode, inicie a execução de `Attach to NCDbg`

---

## What's new

**v0.5.1**
  - Criado novo comando "upgrade" no CLI, que realiza a atualização do thrust para uma versão específica.

  Ex:
  ```
  thrust upgrade //Baixará o thrust que está na master.
  thrust upgrade 0.5.1 //Baixará a tag 0.5.1 to thrust
  ```
**Obs:** 
 - O comando precisa de privilégios para atualizar a pasta de instalação, portanto, rode como administrador ou com `sudo`.
 - Só é possível alterar para versões 0.5.1 e acima.

 **v0.5.0**
 - Alteramos o core do thrust para que o mesmo seja executado diretamente pelo jjs, agora contamos um código 100% Javascript.
 - Diversas melhorias no sistema de CLI, incluindo help geral e de todos os comandos.
 - Inclusão do modo debug, vide README para mais detalhes.
 - Incorporado bitcode 'fs' dentro do core, agora não é necessário instalar a dependência 'filesystem'.
 - Novo método env, para carga de configurações do environment, argumentos da linha de comando e config.json
 - Diversas melhorias no sistema de require
 - Função de monitoria nos retornos do require

**Quebras de API**
 - Função `loadToGlobal` teve seu nome alterado para `dangerouslyLoadToGlobal`.
 - Função require agora lança exceção caso o arquivo solicitado não seja encontrado.
 - Função readJson foi movida para o bitcode 'fs', que está embarcado no thrust.
 - `getConfig()` antes retornava um objeto que podia ser modificado, agora, modificar este objeto lancará um erro.

**v0.4.0**
  - Feature: Versionamento de bitcodes
Agora é possível versionar os seus bitcodes instalados, você pode instalar novamente informando a versão ou modificar diretamente em seu brief.json e rodando o install novamente.

  Ex:
  ```
  thrust install http@0.1.8 //Baixará a tag 0.1.8 do repositório do http
  thrust install http //Baixará a master do repositório do http, visando retrocompatibilidade
  ```
  O brief.json sempre é atualizado com a versão que está sendo instalada, caso já houvesse um "http" ele seria trocado por "http@0.1.8", caso esteja sendo instalado sem versão, a versão será removida do brief.

**v.0.3.0**
  Nesta versão alteramos a maneira em que o thrust realiza os downloads de seed e bitcodes GitHub, antes baixavamos arquivo por arquivo com o intuito de ser mais simples e rápido, porém isso fazia com que o github limitasse a quantidade de downloads por hora. Agora baixamos o zip completo e extraimos o que precisamos para execução, não tendo mais problemas com limites.

**v.0.2.0** 
  - Release inicial do *thrust*

---

Visite também o nosso [GitBook] para uma documentação completa do *thrust*.

[thrust]: https://github.com/Thrustjs/thrust/releases
[thrust-seeds/web-complete]: https://github.com/thrust-seeds/web-complete
[GitBook]: https://thrustjs.gitbooks.io/thrustjs/
[Softbox]: http://www.softbox.com.br/