# TPM 0.1.0 - Thrust Package Management

O *tpm* é o programa de linha de comando de **CLI** do *thrust*.

Considerando que o *thrust* esteja instalado em sua máquina, confirme se o *tpm* esteja disponível em sua linha de comando. Por exemplo, confirme a versão do *tpm*:

```sh
tpm -version
```

Caso o comando não seja encontrado, revise a instalação do *thrust* e as variáveis de seu ambiente que informam o caminho para o *thrust*.

## Inicialização de um projeto

Para inicializar um projeto *thrust* dentro de um diretório vazio, utilize o comando:

```sh
tpm init
```

Com este comando, você estará criando um projeto *thrust* no diretório atual em que você está. O *tpm* espera que o diretório seja vazio.

O comando irá criar os seguintes arquivos:

- `brief.json`: Arquivo com dados e configuração para o projeto *thrust*.
- `src/index.js`: Um JS com um "`Hello`".

Você também pode informar o nome do diretório vazio do projeto que será criado, com o parâmetro "`-p`". Por exemplo:

```sh
tpm init -p projeto01
```

Neste comando, você está criando um projeto *thrust* dentro do diretório `projeto01`, a partir do diretório corrente. Se o diretório não existe, o *tpm* o cria.

E neste exemplo:

```sh
tpm init -p /opt/projetos/projeto01
```

É criado um projeto inicial do *thrust* no diretório `/opt/projetos/projeto01`.

## Arquivo brief.json

O arquivo `brief.json` adicionado ao projeto é utilizado pelo *tpm* para gerenciar e instalar recursos ao projeto *thrust*.

Um arquivo `brief.json`:

- Informa o nome do projeto.
- Listas as dependências do projeto.
  - As dependências podem ser **bitcodes** ou pacotes **.jar**.
- Informa os arquivos a serem publicados por um **bitcode**.

### Campos do brief.json

No arquivo `brief.json` encontramos o campo **name** que contém o nome do projeto. E  o campo **version** que informa a versão do projeto.

O campo **dependencies** contém um *array* das dependências do projeto, que podem ser ou um *bitcode* ou um pacote *.jar*.

Se a dependência for um *bitcode*, ela tem a seguinte notação:

```git
[<proprietário>/]<nome-do-bitcode>[@versão]
```

São exemplos de nomes de *bitcodes*:

```text
thrust-bitcodes/database
filesytem@0.1.0
leonardodelfino/thrustjs-mustache
```

É digno de nota que os *bitcodes* que não informam o proprietário, o *tpm* considera que eles são *nativos* do *thrust-bitcodes*. Logo, do exemplo acima, o *bitcode* `filesystem@0.1.0` é o mesmo que `thrust-bitcodes/filesystem@0.1.0`.

Todos os *bitcodes* acima são encontrados no [GitHub](http://www.github.com). Podemos ter *bitcodes* também no [GitLab](http://gitlab.com). Se este for o caso, adicione o prefixo "`gitlab://`". Por exemplo, segue um exemplo de um *bitcode* do GitLab, que é utilizado em um de nossos [testes](./src/test/java/br/com/softbox/thrust/test/InstallHappyPathTest.java):

```url
gitlab://ozairjr/sample-bitcode-01
```

E, se a dependência for um pacote *.jar*, ela tem a mesma notação original do [Gradle](https://www.gradle.org):

```text
<proprietário>:<pacote>:<versão>
```

Por exemplo:

```gradle
commons-collections:commons-collections:3.2.2
org.postgresql:postgresql:42.2.0
```

Por enquanto, o *tpm* utiliza o [repositório do Maven](https://mvnrepository.com/) para a busca e instalação de pacotes *.jar*.

Segue um exemplo de `brief.json`:

```json
{
    "name": "projeto01",
    "version": "1.0.0",
    "dependencies": [
        "org.postgresql:postgresql:42.2.0",
        "database"
    ]
}
```

## Instalação de dependências

Para instalar um *bitcode* ou um pacote *.jar* utilize o comando `tpm install` seguido do nome da dependência:

```sh
tpm install <dependência>
```

O comando deverá ser informado no diretório raiz do projeto *thrust*; caso seja executado externamente ao projeto deve-se informar o diretório raiz do projeto após o parâmetro `-p` (Mais adiante veremos um exemplo).

### Instalação de bitcodes

Para instalar um *bitcode* informe o comando de instalação seguido do nome do *bitcode* desejado. Por exemplo, o comando:

```sh
tpm install filesystem
```

Instala o *bitcode* **thrust-bitcodes/filesystem** localizado no [GitHub](https://github.com/thrust-bitcodes/filesystem). A versão instalada é a contida na *branch* **master** do repositório.

Podemos informar a versão/*release* desejada por adicionar o sufixo "`@<release>`". Por exemplo:

```sh
tpm install filesystem@0.1.1
```

Instala o mesmo *bitcode* **thrust-bitcodes/filesystem**; só que a versão instalada é a contida na *tag* [0.1.1](https://github.com/thrust-bitcodes/filesystem/releases/tag/0.1.1).

Podemos instalar *bitcodes* de terceiros, tal como este:

```sh
tpm install leonardodelfino/thrustjs-mustache
```

Este *bitcode* está localizado também no [Github](https://github.com/leonardodelfino/thrustjs-mustache).

Já este aqui:

```sh
tpm install gitlab://ozairjr/sample-bitcode-01@0.0.2
```

É um *bitcode* localizado no [Gitlab](https://gitlab.com/ozairjr/sample-bitcode-01).

Os bitcodes são instalados localmente no diretório do projeto sob o diretório `.lib/bitcodes`.

### Instalação de pacotes .jar

Para instalar um pacote .jar, informe o comando seguido da *localização do repositório Maven* do pacote.

Por exemplo, para instalar o pacote .jar do driver do Postgresql na versão 42.2.0, nós executamos o comando:

```sh
tpm install org.postgresql:postgresql:42.2.0
```

Assim, o *tpm* instala o pacote .jar e suas dependências no diretório corrente do projeto *thrust* sob o diretório `.lib/jars`.

Caso o seu projeto possua um pacote *.jar* local, **não** o copie diretamente para o diretório `.lib/jars`. Separe-o em algum diretório e instale-o via *tpm*.

Por exemplo, dentro da raiz do meu projeto *thrust*, eu copiei o arquivo `algumjar.jar`, que é utilizado pelo projeto. A instalação deste é feita da seguinte forma:

```sh
tpm install :algumjar.jar:
```

E se o *.jar* está em outro diretório, posso informar o caminho absoluto.
Por exemplo, se tenho o seguinte *.jar* `/opt/jars/outrojar.jar`, posso instalá-lo da seguinte forma:

```sh
tpm install :/opt/jars/outrojar.jar:
```

### Diretório cache das dependências

Por padrão, o *tpm* possui um diretório *cache global* como forma de *backup* das dependências solicitadas pelos projetos *thrust*; que é localizado no diretório `${HOME}/.thrust-cache`.

Você pode utilizar um diretório alternativo para instalar e manter como *repositório* de dependências; isto é feito por se informar o parâmetro `-cp` seguido do diretório.

Veja o seguinte comando:

```sh
tpm install filesystem -cp /opt/thrust-cache
```

Neste exemplo, nós estamos instalando o *bitcode* **thrust-bitcodes/filesystem** no projeto corrente; e estamos utilizando como repositório *cache* de dependências o diretório `/opt/thrust/cache`.

Em alguns ambientes, pode ser necessário não ter um repositório *cache*; logo, adicione o parâmetro `-nc` ao comando de instalação.

Assim, o comando:

```sh
tpm install filesystem -cp /opt/thrust-cache
```

está instalando o *bitcode* no projeto; mas sem salvar uma cópia no repositório ou diretório *cache*.

### Atualização de dependências

Em projetos em que já temos dependências informadas no arquivo `brief.json`, o comando:

```sh
tpm install
````

é utilizado para executar o *tpm* com a finalidade de revisar e atualizar as dependências do projeto corrente.

Em um projeto inicial, considere o seguinte arquivo `brief.json`:

```json
{
    "name": "projeto01",
    "version": "1.0.0",
    "dependencies": []
}
```

Neste, nós não temos nenhuma dependência. Ao excutarmos o comando:

```sh
tpm install filesystem
```

O *tpm* instala localmente no projeto o *bitcode* **thrust-bitcodes/filesystem** localizado no [GitHub](https://github.com/thrust-bitcodes/filesystem), que está na *branch* **master**. O *bitcode* é instalado no diretório `.lib/bitcodes/thrust-bitcodes/filesystem`. E o arquivo `brief.json` é atualizado:

```json
{
    "name": "projeto01",
    "version": "1.0.0",
    "dependencies": [
        "filesystem"
    ]
}
```

Se executarmos o comando de instalação sem nenhum argumento:

```sh
tpm install
```

O *tpm* irá varrer o arquivo `brief.json` e atualizar localmente no projeto as dependências encontradas.

Em nosso exemplo, o *tpm* verificará que há o *bitcode* **thrust-bitcodes/filesystem**, sem uma versão numérica; logo, isto implica em novamente buscar e atualizar os arquivos do *bitcode* para o projeto corrente.

Continuando com este mesmo exemplo; mas, se você digitar agora o comando:

```sh
tpm install filesystem@0.1.1
```

O *tpm* irá atualizar o *bitcode* **thrust-bitcodes/filesystem** com a versão informada; e o arquivo `brief.json` será atualizado informando para nós o *bitcode* com a versão:

```json
{
    "name": "projeto01",
    "version": "1.0.0",
    "dependencies": [
        "filesystem@0.1.1"
    ]
}
```

### Instalação/Atualização fora do diretório raiz

Se porventura desejar instalar ou atualizar as dependências de um projeto *thrust*, fora de seu diretório raiz, informe a raiz do projeto após o parâmetro `-p`.

Por exemplo:

```sh
tpm install filesystem -p /opt/thrust-app/projet01
```

Estamos instalando o *bitcode* **thrust-bitcodes/filesystem** no diretório `/opt/thrust-app/projet01`, que já deve ser um diretório que contenha o arquivo `brief.json`.

## Execução do projeto

Podemos executar uma aplicação *trhust* com o comando:

```sh
tpm run <parâmetro>
```

Você pode informar o caminho relativo ou do *script* a ser executado. Por exemplo:

```sh
tpm run src/index.js
```

Aqui estamos informando ao *tpm* executar o *script* `src/index.js` que está localizado sob o diretório corrente.

Quanto a este comando:

```sh
tpm run src
```

Aqui também estamos informando ao *tpm* executar o *script* `src/index.js` que está localizado sob o diretório corrente.
Logo, ao informar apenas um diretório, o *tpm* irá procurar pelo arquivo `index.js` dentro deste diretório.

Ao informar nenhum parâmetro:

```sh
tpm run
```

O *tpm* procura pelo arquivo que está informado pela propriedade `main` do arquivo `brief.json`.

## Ajuda

O *tpm* possui uma ajuda rápida, através do comando:

```sh
tpm help
```

Isto irá apresentar de forma resumida os possíveis comandos do *tpm*.

E para cada comando há também uma ajuda rápida; para isto, você deverá informar o comando desejado seguido do parâmetro `-h`.

Por exemplo, se você chamar

```sh
tpm init -h
```

Será apresentada a ajuda bem resumida do comando `tpm init`, e em inglês ;-)
