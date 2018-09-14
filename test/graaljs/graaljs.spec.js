exports = function exec(describe, it, beforeEach, afterEach, expect, should, assert) {
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
    });
}