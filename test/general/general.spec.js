exports = function exec(describe, it, beforeEach, afterEach, expect, should, assert) {
    describe('Testes gerais', function() {
        it('getConfig should be frozen', function() {
            // expect(function() {
            //     let cfg = getConfig();
            //     cfg.a = 1;
            // }).to.throw()
            let cfg = getConfig()
            cfg.a = 1

            expect(cfg.a).to.equals(undefined)
        });
    });
}
