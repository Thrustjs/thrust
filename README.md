Thrust v5
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