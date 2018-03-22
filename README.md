Thrust v0.2.0
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

## Novidades

* v.0.2.0 - Release inicial do *thrust*

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
* @code loadToGlobal('db', {teste: 1})
* @code print(db.teste) //Saída: 1
*/
function loadToGlobal(name, obj)

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
```

## Parâmetros de configuração
As propriedades abaixo devem ser configuradas no arquivo *config.json* (distribuído juntamente com o ThrustJS):

``` javascript
/* Os valores abaixo representam os valores default*/
{
  "loadToGlobal": [],/*String/Array Bitcodes que devem ser carregados globalmente*/
  "developmentMode": false, /*Determina se o ambiente é de desenvolviment ou não (desabilita cache dp require)*/
  "cacheScript": false, /*Liga ou desliga o cache do require*/
}
```

---
## What's new

**v0.4.0** - Feature: Versionamento de bitcodes
Agora é possível versionar os seus bitcodes instalados, você pode instalar novamente informando a versão ou modificar diretamente em seu brief.json e rodando o install novamente.

Ex:
```
thrust install http@0.1.8 //Baixará a tag 0.1.8 do repositório do http
thrust install http //Baixará a master do repositório do http, visando retrocompatibilidade
```
O brief.json sempre é atualizado com a versão que está sendo instalada, caso já houvesse um "http" ele seria trocado por "http@0.1.8", caso esteja sendo instalado sem versão, a versão será removida do brief.

---

Visite também o nosso [GitBook] para uma documentação completa do *thrust*.

[thrust]: https://github.com/Thrustjs/thrust/releases
[thrust-seeds/web-complete]: https://github.com/thrust-seeds/web-complete
[GitBook]: https://thrustjs.gitbooks.io/thrustjs/
[Softbox]: http://www.softbox.com.br/
