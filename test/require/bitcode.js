/*
 Esse caso foi criado pois foi encontrado um erro em que
 caso um arquivo com um nome x faça require de um bitcode chamado x
 o thrust entrava em loop e dava stackoverflow
 */
var value = require('bitcode').value;

exports = {
    value: value
}