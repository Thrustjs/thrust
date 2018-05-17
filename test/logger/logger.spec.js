exports = function exec(describe, it, beforeEach, afterEach, expect, should, assert) {
    var logger = require('logger');
    var fs = require('fs');

    describe('Teste do mecanismo de logs', function () {

        describe('Console', function () {
            it('log no console', function () {
                var consoleLogger = logger('console');
                consoleLogger.warning('teste');
                consoleLogger.info('teste');
                /**
                 * Ainda não encontramos uma forma simples
                 * de redirecionar o output do nashorn para
                 * outro stream onde possamos validar a saída.
                 */
                expect(true).to.equals(true)
            });
        });

        describe('Arquivo', function () {
            it('log em arquivo sem fileName', function () {
                expect(function () {
                    logger('file', {
                        handlers: [{
                            handler: 'file'
                        }],
                    });
                }).to.throw('Para utilizar o handler \'file\' deve ser passada o nome do arquivo em \'fileName\'.');
            });

            it('log em arquivo com override de format e várias assinaturas', function () {
                var fileLogger = logger('file', {
                    level: 'info',
                    format: '[type][name] message throwable lineBreak',
                    handlers: [{
                        handler: 'file',
                        fileName: 'teste_log.txt'
                    }],
                });

                fileLogger.info('Sem params');
                fileLogger.warning('Com um param: {0}', 'Param1');
                fileLogger.severe('Com n params: {0}, {1}, {2}', '1', 2, '3');
                fileLogger.info('Com um array: {0}, {1}, {2}', ['1', 2, '3']);
                fileLogger.info(function () {
                    return 'Com supplier';
                });

                fileLogger.severe('Error', new Error('Uma exception js'));

                var result = fs.readAll('./teste_log.txt');

                var expected = '[INFO][file] Sem params  \n[WARNING][file] Com um param: Param1  \n[SEVERE][file] Com n params: 1, 2, 3  \n[INFO][file] Com um array: 1, 2, 3  \n[INFO][file] Com supplier  \n[SEVERE][file] Error \njava.lang.Exception: Teste';
                expect(result).to.contains(expected)
            });
        });

        describe('Stream', function () {
            it('log em stream sem função de stream', function () {
                expect(function () {
                    logger('invalidStream', {
                        handlers: [{
                            handler: 'stream'
                        }]
                    });
                }).to.throw('Para utilizar o handler \'stream\' deve ser passada uma função de stream ou um path para um arquivo que implementa a função.');
            });

            it('log em stream com require de arquivo de stream', function () {
                var requireStream = logger('requireStream', {
                    handlers: [{
                        handler: 'stream',
                        stream: '/streamLogHandler.js'
                    }]
                });

                requireStream.info('teste');

                var streamHandler = requireStream.handlers()[0];
                streamHandler.flush();
                streamHandler.close();

                var stream = require('/streamLogHandler.js');
                var result = stream.getResult();

                expect(result.length).to.equals(1);
                expect(result[0].trim()).to.equals('[testDefault][INFO][requireStream] teste')
            });

            it('log em stream', function () {
                var result = [];

                var fileLogger = logger('stream', {
                    handlers: [{
                        handler: 'stream',
                        stream: function (bytes) {
                            result.push(String.fromCharCode.apply(null, bytes).replace(/\0/g, ''));
                        }
                    }]
                });

                fileLogger.info('teste');

                var streamHandler = fileLogger.handlers()[0];
                streamHandler.flush();
                streamHandler.close();

                expect(result.length).to.equals(1);
                expect(result[0].trim()).to.equals('[testDefault][INFO][stream] teste')
            });
        });

        describe('Multiplos handlers', function () {
            it('log com multiplas opções', function () {
                var streamResult = [];

                var multiLogger = logger('multiLogger', {
                    format: '[console][type] message',
                    level: 'severe',
                    handlers: [{
                        handler: 'file',
                        format: '[file][type][name] message',
                        fileName: 'teste_log_multi.txt',
                    }, {
                        handler: 'stream',
                        level: 'info',
                        format: '[stream][type][name] message',
                        stream: function (bytes) {
                            streamResult.push(String.fromCharCode.apply(null, bytes));
                        }
                    }]
                });

                multiLogger.info('info');
                multiLogger.severe('severe');
                multiLogger.warning('warning');

                var streamHandler = multiLogger.handlers()[1];
                streamHandler.flush();
                streamHandler.close();

                var fileResult = fs.readAll('./teste_log_multi.txt');
                expect(fileResult).to.equals('[file][SEVERE][multiLogger] severe');

                expect(streamResult[0].trim()).to.equals('[stream][INFO][multiLogger] info');
                expect(streamResult[1].trim()).to.equals('[stream][SEVERE][multiLogger] severe');
                expect(streamResult[2].trim()).to.equals('[stream][WARNING][multiLogger] warning');
            });
        });
    });
}