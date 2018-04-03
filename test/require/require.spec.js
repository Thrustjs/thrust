exports = function exec (describe, it, beforeEach, afterEach, expect, should, assert) {
  describe('Teste de require', function () {
    it('Deve ser possível exportar uma função', function () {
      let fn = require('./require/utilFn.js');
      expect(fn()).to.equals('value');
    });

    it('Deve ser possível exportar um primitivo', function () {
      let value = require('./require/utilConst.js');
      expect(value).to.equals('value');
    });

    it('Deve conseguir cachear um require', function () {
      let number = require('./require/utilCached.js').number;
      let secNumber = require('./require/utilCached.js').number;
      expect(number).to.equals(secNumber);
    });

    it('Deve ser possível realizar cadeias de require', function () {
      let fn = require('./require/utilChain');
      expect(fn()).to.equals('value');
    });

    it('Deve conseguir exportar mesmo tendo definições abaixo do exports', function () {
      let util = require('./require/utilexportnotlast')
      expect(util.getValue()).to.equals('value');
    });

    it('Deve lançar um erro quando tentar exportar algo que não existe', function () {
      expect(function () {
        require('./require/utilFnInexistente')
      }).to.throw()
    });

    it('Deve conseguir carregar e requerer bitcodes globais', function () {
      expect(globalBitCode1.getValue()).to.equals('globalBitCode1'); // eslint-disable-line no-undef
    });

    it('Deve conseguir carregar e requerer bitcodes globais dentro de um require', function () {
      expect(require('./require/utilWithGlobal').getValue()).to.equals('globalBitCode2')
    });

    it('Deve possuir isolação de escopos', function () {
      expect(require('./require/utilScopeIsolation1.js')).to.equals('value');
      expect(require('./require/utilScopeIsolation2.js')).to.equals('value2');
    });

    it('Deve possuir isolação de contextos', function () {
      this.name = 'index.js';
      require('./require/utilCtxIsolation')
      expect(this.name).to.equal('index.js')
    });

    // TODO: avaliar
    // it('Deve ser possível atribuir funções no contexto this', function () {
    //   let util = require('./require/utilEcho')
    //   Object.assign(this, util);
    //   expect(echo('MyStr')).to.equal('MyStr')
    // });

    it('Não deve ser possível utilizar globais do thrust.js', function () {
      expect(function () {
        return _thrustDir.getPath(); // eslint-disable-line no-undef
      }).to.throw()
    });
  });
}
