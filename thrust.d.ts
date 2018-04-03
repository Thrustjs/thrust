/**
 * @project Thrust
 * @author Nery
 */

/**
* Path base de onde a aplicação está rodando, análogo ao __dirname do NodeJS
*/
declare var rootPath: string;

/**
* Carrega um módulo Javascript disponibilizando no contexto somente as
* vari&aacute;veis e funções que foram exportadas.
* @param {string} modulePath O nome do arquivo (módulo) a ser importado.
* @returns {Object}
*/
declare function require(modulePath: string): object;

/**
* Printa a informação passada no console
* @param {Object} obj Informação a ser escrita no console.
*/
declare function print(obj: Object): void;

/**
* Printa a informação passada no console, realizando stringify para arrays e objetos
* @param {Object} obj Informação a ser escrita no console.
*/
declare function show(obj: Object): void;
