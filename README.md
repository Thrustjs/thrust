# Thrust

[![Build Status](https://travis-ci.org/Thrustjs/thrust.svg?branch=master)](https://travis-ci.org/Thrustjs/thrust) [![GitHub release](https://img.shields.io/github/release/thrustjs/thrust.svg)](https://github.com/Thrustjs/thrust/releases) [![GitHub downloads](https://img.shields.io/github/downloads/thrustjs/thrust/total.svg)](https://github.com/Thrustjs/thrust/releases)

O *thrust* (ou *thrustjs*) é uma plataforma de execução/interpretação JavaScript, ou seja, é um Server-Side JavaScript (SSJS). Ele permite a escrita de código em JavaScript a ser executado sobre a Java Virtual Machine (JVM).
Desenvolvida pela [Softbox](http://www.softbox.com.br), empresa inovadora na área de soluções em TI, a plataforma foi concebida visando principalmente:

- Ser concisa e eficiente, com foco em alta performance.
- Ter nativamente poucas APIs, diminuindo assim drasticamente a curva de aprendizagem.
- Trabalhar fortemente o conceito de *Definition Over Configuration*, trazendo uma série de configurações padrões bem definidas; mas, permitindo ao utilizador customiza-las a qualquer momento.

O *thrust* dispõe de um CLI (*Command Line Interface*) que permite a inicialização de projetos com scaffolding, instalação de dependências e execução dos apps *thrust*.

A plataforma é completamente gratuita e disponibilizada para uso segundo as políticas de licenciamento MIT.

## Bitcodes

**Bitcodes** são equivalentes a um pacote em outras linguagens. Um *bitcode* é um *namespace* que agrupa funcionalidades afins.

Um exemplo é o bitcode [filesystem](https://github.com/thrust-bitcodes/filesystem) que possui várias funções ou APIs que manipulam o sistema de arquivos do computador, como por exemplo leitura de arquivos, verificação da existência de um diretório ou arquivo.

O *thrust* já possui em sua versão inicial vários bitcodes que enriquecem a plataforma e auxiliam no desenvolvimento de soluções. Você pode ver cada um deles no nosso [repositório oficial](https://github.com/thrust-bitcodes).

Você também pode criar os seus próprios bitcodes e utilizá-los em seus *thrust* apps.

## GraalVM

A partir da versão **0.6.0**, o *thrust* deu suporte a utilização da [GraalVM](https://www.graalvm.org/).

Utilizando a `GraalVM`, o interpretador deixa de ser o `Nashorn` e passa a ser o `GraalJS`, que é compatível com `ES8`.

Temos algumas quebras de API entre um interpretador e outro,
o *migration* guide, disponibilizado pelo próprio `GraalJS`, pode ser acessado em [NashornMigrationGuide.md](https://github.com/graalvm/graaljs/blob/master/docs/user/NashornMigrationGuide.md)

E na versão **0.8.0**, o *thrust* foi totalamente reescrito para utlizar o GraalJS como interpretador padrão. Logo, já esperamos que alguns *bitcodes* e códigos das versões anteriores deixem de funcionar devido a algumas incompatibilidades.

## Instalação

Você pode instalar o *thrust* a partir deste repositório. Segue um guia rápido para isto em uma máquina Linux:

- Baixe este repositório em sua máquina.
- Confirme se há instalado o [curl](https://curl.haxx.se/) ou o [wget](https://www.gnu.org/software/wget/).
- Acesse pelo terminal o diretório em que está o repositório do fonte do Thrust:
- Execute o comando script [install-thrust-from-here.sh](install-thrust-from-here.sh):

```sh
sh ./install-thrust-from-here.sh
```

- Aguarde a execução deste, que irá instalar o *thrust* em `/opt/thrust`.
  - Se desejar instalar o *thrust* em outro diretório, informe o diretório após o parâmetro `-d`. Por exemplo:

```sh
sh ./install-thrust-from-here.sh -d /opt/app/thrust-vx
```

Neste caso, estaremos instalando o *thrust* no diretório `/opt/app/thrust-vx`.

Após instalar o *thrust* é necessário adicionar o caminho dele em seu *shell*. Por exemplo, com base na instalação padrão,
se você utiliza o [bash](https://www.gnu.org/software/bash/), você pode adicionar a seguinte linha em `~/.bashrc`:

```bash
export PATH=/opt/thrust:$PATH
```

Confirme se o *thrust* foi instalado corretamente por executar o comando:

```sh
thrust -v
```

que irá apresentar a versão corrente do *thrust*.

Mais detalhes do *thrust* veja a documentação dele em [README.md](./thrust-core/README.md).

### Imagem docker do thrust

Fornecemos aqui o arquivo [Dockerfile](./Dockerfile), para você criar uma imagem [Docker](https://www.docker.com) com *thrust* instalado.

Por exemplo, se há o Docker instalado em sua máquina; por exemplo, crie a imagem com o seguinte comando:

```sh
# Sim temos um ponto aqui no fim do comando
docker build -t thrust-image .
```

Aqui estamos criando uma imagem local com o nome `thrust-image` (Você pode escolher o nome da imagem que você desejar ;-) ). Com a imagem criada, você pode executar os comandos do *thrust* e do *tpm*.

Por exemplo, suponha que você está dentro da raiz de um projeto *thrust*; e que há o *script* `src/index.js`; com base na imagem que montei acima, eu posso executar:

```sh
docker run -it --rm -v $(pwd):/thrust-project thrust-image thrust /thrust-project/src
```

## TPM

A partir da versão **0.8.0**, o CLI do *thrust* foi separado de seu [core](./thrust/core),
e passou a ser chamado de **TPM** (*Thrust Package Management*).
Mais detalhes, veja aqui na documentação contida no arquivo [README.md](./tpm/README.md), que nos apresenta
os principais comandos do *tpm*.

## Novidades

- **v0.8.0**
  - Reescrita do **core** do *thrust* para o GraalVM.
  - Separação do **core** do *thrust* do **CLI**.
    - **CLI** tornou-se uma aplicação à parte, o **tpm** (*Thrust Package Management*).
  - Documentação separada para:
    - O [*thrust*](./thrust-core/README.md), que é o **core**.
    - O [*tpm*](./tpm/README.md), que é o **CLI**.
      - Apresenta os detalhes para inicialização, instalação de pacotes para o projeto.
      - Apresenta o arquivo `brief.json`.

- **v0.5.3**
  - Adição do método addInterceptor ao require, para que seja possível interceptar o load do código

- **v0.5.2**
  - Ajuste no CLI de init que impedia a inicialização de uma nova aplicação thrust

- **v0.5.1**
  - Criado novo comando "upgrade" no CLI, que realiza a atualização do thrust para uma versão específica.

Ex:

```sh
thrust upgrade //Baixará o thrust que está na master.
thrust upgrade 0.5.1 //Baixará a tag 0.5.1 to thrust
```

- Observações:
  - O comando precisa de privilégios para atualizar a pasta de instalação, portanto, rode como administrador ou com `sudo`.
  - Só é possível alterar para versões 0.5.1 e acima.

- **v0.5.0**
  - Alteramos o core do thrust para que o mesmo seja executado diretamente pelo jjs, agora contamos um código 100% Javascript.
  - Diversas melhorias no sistema de CLI, incluindo help geral e de todos os comandos.
  - Inclusão do modo debug, vide README para mais detalhes.
  - Incorporado bitcode 'fs' dentro do core, agora não é necessário instalar a dependência 'filesystem'.
  - Novo método env, para carga de configurações do environment, argumentos da linha de comando e config.json
  - Diversas melhorias no sistema de require
  - Função de monitoria nos retornos do require
  - Quebras de API:
    - Função `loadToGlobal` teve seu nome alterado para `dangerouslyLoadToGlobal`.
    - Função require agora lança exceção caso o arquivo solicitado não seja encontrado.
    - Função readJson foi movida para o bitcode 'fs', que está embarcado no thrust.
    - `getConfig()` antes retornava um objeto que podia ser modificado, agora, modificar este objeto lancará um erro.

- **v0.4.0**
  - Feature: Versionamento de bitcodes.
  Agora é possível versionar os seus bitcodes instalados, você pode instalar novamente informando a versão ou modificar diretamente em seu brief.json e rodando o install novamente.

Ex:

```sh
thrust install http@0.1.8 //Baixará a tag 0.1.8 do repositório do http
thrust install http //Baixará a master do repositório do http, visando retrocompatibilidade
```

- O brief.json sempre é atualizado com a versão que está sendo instalada, caso já houvesse um "http" ele seria trocado por "http@0.1.8", caso esteja sendo instalado sem versão, a versão será removida do brief.

- **v.0.3.0**
  - Nesta versão alteramos a maneira em que o thrust realiza os downloads de seed e bitcodes GitHub, antes baixavamos arquivo por arquivo com o intuito de ser mais simples e rápido, porém isso fazia com que o github limitasse a quantidade de downloads por hora. Agora baixamos o zip completo e extraimos o que precisamos para execução, não tendo mais problemas com limites.

- **v.0.2.0**
  - Release inicial do *thrust*

## Mais informações

Visite também o nosso `GitBook` para uma documentação completa do *thrust*.

- thrust: [https://github.com/Thrustjs/thrust/releases](https://github.com/Thrustjs/thrust/releases)
- thrust-seeds/web-complete: [https://github.com/thrust-seeds/web-complete](https://github.com/thrust-seeds/web-complete)
- GitBook: [https://thrustjs.gitbooks.io/thrustjs/](https://thrustjs.gitbooks.io/thrustjs/)
- Softbox: [http://www.softbox.com.br/](http://www.softbox.com.br/)
