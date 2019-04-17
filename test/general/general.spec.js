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

        it('Teste com encoding bytes utilizando StandardCharsets', function () {
            const javaString = 'teste';
            const StandardCharsets = Java.type('java.nio.charset.StandardCharsets');

            const javaByteArray = StandardCharsets.UTF_8.encode(javaString).array();
            expect(javaByteArray.length).to.equals(5);
        });
    });
}
