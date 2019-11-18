# thrust

O núcleo do *thrust* executa os códigos JavaScript sob uma JVM (*Java Virtual Machine*) do [GraalVM](https://www.graalvm.org/).

Importe pacotes *.jar* ou *Bitcodes* [oficiais](https://github.com/thrust-bitcodes) ou de terceiros e escreva sua aplicação *trhust*.

## Programando com o thrustjs

Programe com *thrustjs* em Javascript [V8](https://v8.dev/).

Segue um guia bem rápido para você desenvolver suas aplicações *thrust*; vamos nos basear neste projeto [config-sample](./src/test/js/config-sample).

Para iniciar um projeto novo e adicionar recursos, veja a documentação do [tpm](../tpm/README.md).

Somente para ajudar, o projeto **config-sample** pode ser criado em um diretório vazio:

```sh
tpm init
```

E depois adicionamos o *bitcode* [filesystem](https://github.com/thrust-bitcodes/filesystem).

```sh
tpm install filesystem@0.1.1
```

### Função *require()*

Você pode importar os *bitcodes* com a função `require()`, e também importar os códigos JavaScript com esta função.

Repare no seguinte trecho de código de [config.js](./src/test/js/config-sample/src/config.js):

```js
const filesystem = require('filesystem')
```

Quando você informar à função `require()` um argumento que inicia com uma *string* sem um caminho absoluto ou relativo (Uma *string* que não inicia com "`/`" ou não inicia com "`.`"), você está dizendo ao *thrust* para carregar um *bitcode*.

Neste exemplo, estamos carregando o *bitcode* `thrust-bitcode/filesystem`, que foi adicionado ao arquivo [brief.json](./src/test/js/config-sample/brief.json) no comando
*tpm* que apresentamos, e que deve estar instalado sob o diretório `.lib/bitcodes` do projeto (Arquivos .jar que são dependências, são instalados sob o diretório `.lib/jars`).

Com o *bitcode* carregado em seu código, você pode utilizar os seus objetos e funções.

Também, podemos *importar* objetos e funções de módulos/arquivos contidos em nosso projeto.
Por exemplo, no arquivo [index.js](./src/test/js/config-sample/src/index.js) temos a seguinte linha:

```sh
const config = require('./config')
```

Neste caso, estamos importando o arquivo [config.js](./src/test/js/config-sample/src/config.js) que está sob o mesmo diretório do arquivo [index.json](./src/test/js/config-sample/src/index.js).

## A exportação do módulo

Você pode montar um pacote ou módulo para conter funções e objetos, que poderão
ser utilizados por outros módulos/arquivos de seu projeto. A funções e objetos são expostos pelo *objeto* `exports`.

Por exemplo, no arquivo [config.js](./src/test/js/config-sample/src/config.js), temos as função `getConfig()` que é exportada:

```js
exports = {
    getConfig
}
```

E esta que é utilizada no arquivo [index.js](./src/test/js/config-sample/src/index.js):

```js
// Importando o módule/arquivo config.js
const config = require('./config')
// Referência para função exportada
const getConfig = config.getConfig
// Chamando a função
const databaseUrl = getConfig().database.sqlite.urlConnection
```

## Função *Java.type()*

Importe classes Java com a função `Java.type()`, por informar o caminho completo da classe.

Por exemplo, no arquivo
[config.js](./src/test/js/config-sample/src/config.js), nós importamos a classe Java
[Paths](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Paths.html):

```js
const Paths = Java.type('java.nio.file.Paths')
```

Classes Java de arquivos .jar que foram instalados como dependência via `tpm install` também podem ser *importados*.

## Variáveis globais do *thrust*

O *thrust* possui duas variáveis gloabais *visíveis* em seu código JavaScript:

1. `__ROOT_DIR__`: Diretório raiz do projeto/aplicação *thrust*.
2. `__THRUST_VERSION__`: Versão corrente do *thrust*.

No arquivo [config.js](./src/test/js/config-sample/src/config.js) temos um exemplo de utilização da variável global `__ROOT_DIR__` para localizar *corretament* o arquivo
[config.json](./src/test/js/config-sample/config.json) dentro do projeto:

```js
// Utilizando __ROOT_DIR__ com a class java.nio.file.Paths para
// determinar a localização do arquivo 'config.json' que está
// na raiz do projeto.
const pathFile = Paths.get(__ROOT_DIR__, 'config.json').toString()
```

## Executando aplicação *thrust*

Para executar sua aplicação *thrust* no Linux, chame o *script* [thrust](./scripts/thrust); que deve estar referenciado pelo *PATH*, depois de sua instalação do *thrust* (de acordo com o documento [README.md](../README.md) base).

Logo, da raiz de seu projeto, você pode chamar:

```sh
thrust <*meu script.js*>
```

ou

```sh
thrust <*diretório raiz que contém um arquivo 'index.js'>
```

Por exemplo, considerando que o nosso projeto seja semelhante ao projeto exemplo [config-sample](./src/test/js/config-sample). A estrutura de diretórios seria:

```sh
.
|____ brief.json
|____ config.json
|____ *src*
        |____ index.js
        |____ config.js
```

A partir do diretório raiz do projeto, podemos executar a aplicação *thrust* por executar:

```sh
thrust src/index.js
```

ou

```sh
thrust src
```

Também podemos utilizar o *tpm*:

```sh
tpm run src/index.js
```

ou

```sh
tpm run src
```

Você pode informar o diretório absoluto ou relativo desde que você desejar executar o *script* `index.js`; tanto para o *tpm* como para o *thrust*. Caso contrário, você deve informar o nome do *script*.

Por exemplo, se for o *script* `config.js`, você **deve** informar o seu nome:

```sh
thrust src/config.js
```

ou

```sh
tpm run src/config.js
```

No *tpm*, se na propriedade `main` do  arquivo [brief.json](./src/test/js/config-sample/brief.json), informar o nome do *script* principal; nós podemos executar da seguinte forma:

```sh
tpm run
```

### Executando o *thrust* com o Java

É digno de nota que tanto o *script thrust* como o *tpm* irão tentar executar o Java da GraalVM.

Primeiro, irão procurá-lo no diretório de instalação do *thrust*. Por exemplo, se o *thrust* estiver instalado em `/opt/thrust`, estaremos procurando o GraalVM dentro de `/opt/thrust/graalvm`.

Mas, se a variável de ambiente `GRAALVM_HOME` estiver definida; então, tanto o *thrust* como o *tpm* irão utilizar o *java* que estiver dentro do diretório `${GRAALVM_HOME}/bin`.

## Threads versus GraalVM

Aplicações *thrust* não aceitam nativamente *multi-thread*, por conta da forma que o GraalVM implementa o JS interno no Java.

Se você escrever um código *thrust* que utiliza uma **Thread** do Java, tal como este exemplo que está em  [no-thread.js](./src/test/js/general/no-thread.js),
e que contém o seguinte código:

```js
const Thread = Java.type('java.lang.Thread')
const call = () => console.log('Hello from thread')
try {
  const t = new Thread(call)
  t.start()
  t.join()
  console.log('Success')
} catch (e) {
  console.log('Error: ' + e.message)
}
```

Ao chamar:

```sh
thrust no-thread.js
```

A função `call()` não será executada. Mas o *resto* do código será executado com sucesso, sem *notificar* o erro.

Veja a saída com sucesso:

```sh
$ thrust no-thread.js 2> /dev/null
Sucesss
```

E depois a de erro:

```sh
$ thrust no-thread.js > /dev/null
Exception in thread "Thread-5" java.lang.IllegalStateException: Multi threaded access requested by thread Thread[Thread-5,5,main] but is not allowed for language(s) js.
        at com.oracle.truffle.polyglot.PolyglotContextImpl.throwDeniedThreadAccess(PolyglotContextImpl.java:649)
        at com.oracle.truffle.polyglot.PolyglotContextImpl.checkAllThreadAccesses(PolyglotContextImpl.java:567)
        at com.oracle.truffle.polyglot.PolyglotContextImpl.enterThreadChanged(PolyglotContextImpl.java:486)
```

A GraalVM informa que ao tentar executar uma nova *thread*, a VM não permite *multi-threads* dentro do JavaScript.

Se sua aplicação precisa trabalhar com *multi-thread*, há o pacote [br.com.softbox.thrust.api.thread](./src/main/java/br/com/softbox/thrust/api/thread) o qual temos um API **Thread** para o  *thrust*
que lhe permite criar um *pool* de *Threads* para carregar arquivos JS em contextos separados. O exemplo de teste [worker01](src/test/js/worker01) apresenta um caso de um simples
agendador de tarefas. E o *bitcode* **http-fast2** foi criado utilizando este recurso.

Vale a pena ressaltar que finalizada a executação do *script* principal, a aplicação *thrust* é finalizada; mesmo que você tenha *Promises* ou *Threads* em execução.
