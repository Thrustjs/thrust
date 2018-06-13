/**
 * Na versão anterior do thrust ao chamar a função 'equals'
 * passando o mesmo objeto nos dois parametros, o retorno era false.
 * Depois da reformulação do thrust o erro parou,
 * então criamos este caso de teste para que não volte a acontecer
 */
exports = function equals(x, y) {
    return x === y
}