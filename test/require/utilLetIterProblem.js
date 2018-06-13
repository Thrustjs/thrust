/**
 * Na versão anterior do thrust ao chamar a função 'iterar'
 * um erro era lançado sempre na 16º iteração, na linha de declaração
 * da variável 'letVariable', depois da reformulação do thrust o erro parou
 * então criamos este caso de teste para que não volte a acontecer
 */
function iterar() {
    let array = [1];

    for (let i = 0; i < 50; i++) {
        let letVariable = 1;

        array.forEach(function () {
            letVariable++
        })
    }

    return true;
}

exports = {
    iterar: iterar
}