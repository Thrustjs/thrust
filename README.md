Thrust v0.2.0
===============

O Thrust (ou ThrustJS) é uma plataforma de execução/interpretação JavaScript, ou seja, é um Server-side JavaScript (SSJS). Ele permite a escrita de código em JavaScript a ser executado sobre a Java Virtual Machine (JVM).
Desenvolvida pela [Softbox], empresa inovadora na área de soluções em TI, a plataforma foi concebida visando, principalmente:
 - Ser concisa e eficiente, com foco em alta performance;
 - Ter, nativamente, poucas APIs, diminuindo assim drasticamente a curva de aprendizagem;
 - Trabalhar fortemente o conceito de Definition Over Configuration, trazendo uma série de configurações padrões bem definidas, mas permitindo ao utilizador customiza-las à qualquer momento.

 O Thrust dispõe de um CLI que permite a inicialização de projetos com scaffolding, instalação de dependências e execução dos apps Thrust.

 A plataforma é completamente gratuita e disponibilizada para uso segundo as políticas de licenciamento MIT.


## Bitcodes

Bitcodes são equivalentes a um módulo em outras linguagens. Um bitcode é um namespace que agrupa funcionalidades afins.
Um exemplo é o bitcode [filesystem](https://github.com/thrust-bitcodes/filesystem) que possui várias funções ou API's que manipulam o sistema de arquivos do computador, como por exemplo leitura de arquivos, verificação da existência de um diretório ou arquivo etc.

O Thrust já possui em sua versão inicial vários bitcodes que enriquecem a plataforma e auxiliam no desenvolvimento de soluções. Você pode ver cada um deles no nosso [repositório oficial](https://github.com/thrust-bitcodes).

Você também pode criar os seus próprios bitcodes e utilizá-los em seus Thrust apps.

## Novidades

* v.0.2.0 - Release inicial do Thrust

## Como usar?

 1 - Realize o download do [Thrust release] e instale.
 
 2 - O cli "thrust" agora estará disponível em seu terminal.

Agora, você poderá usar ```thrust init [/home/user/projects/thrust-test]``` para inicializar um novo app Thrust no diretório corrente ou no que foi passado como argumento.

Você pode passar uma opção para init chamada ```-t|-template```, para iniciar o seu projeto com um *seed* específico, o padrão no caso em que a opção não é passada é **[thrust-seeds/web-complete]**.

Você também pode criar os seus próprios seeds e utilizá-los em seus Thrust apps.

Visite também o nosso [GitBook] para uma documentação completa do Thrust.

[Thrust release]: https://github.com/Thrustjs/thrust/releases
[thrust-seeds/web-complete]: https://github.com/thrust-seeds/web-complete
[GitBook]: https://thrustjs.gitbooks.io/thrustjs/
[Softbox]: http://www.softbox.com.br/
