exports = function exec(describe, it, beforeEach, afterEach, expect, should, assert) {
    describe('Testes gerais', function () {
        it('getConfig should be frozen', function () {
            // expect(function() {
            //     let cfg = getConfig();
            //     cfg.a = 1;
            // }).to.throw()
            let cfg = getConfig()
            cfg.a = 1

            expect(cfg.a).to.equals(undefined)
        });
    });

    describe('Testes ES8 da Graal', function () {
        const obj = {
            a: 1
        };

        it('Teste com destrutor', function () {
            const { a } = obj;
            expect(a).to.equals(1);
        });

        it('Teste com arrow function', function () {
            const sum = (x, y) => x + y;
            expect(sum(1, 2)).to.equals(3);
        });

        it('Teste com StringInterpolation', function () {
            const numberOne = 1
            const stringInterpolation = `NumberOne: ${numberOne}`
            expect(stringInterpolation).to.be.equals('NumberOne: 1')
        });

        it('Teste com outboxing não automático do Java para o JS', function () {
            const JString = Java.type('java.lang.String');
            const javaString = new JString('teste');
            const StandardCharsets = Java.type('java.nio.charset.StandardCharsets');

            /**
            * Se o outboxing acontecer automaticamente, dará erro na linha abaixo
            * já que a String do JS não tem o método getBytes
            **/
            const javaByteArray = StandardCharsets.UTF_8.encode(javaString);
            expect(javaByteArray.length).to.equals(5);
        });
    });
}
