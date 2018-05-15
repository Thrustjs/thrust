exports = function exec(describe, it, beforeEach, afterEach, expect, should, assert) {
  describe('Teste de require', function () {
    it('Deve ser possível exportar uma função', function () {
      var fn = require('./require/utilFn.js');
      expect(fn()).to.equals('value');
    });

    it('Deve ser possível exportar um primitivo', function () {
      var value = require('./require/utilConst.js');
      expect(value).to.equals('value');
    });

    it('Deve ser possível exportar um json', function () {
      var json = require('./require/utilJsonFile.json');
      expect(json).to.be.an('object');
      expect(json).to.nested.include({
        'value': 'Test'
      });
    });

    it('Deve ser possível exportar um objeto composto por dois requires', function () {
      var value = require('./require/utilAppendExport.js');
      expect(value).to.be.an('object');
      expect(Object.keys(value)).to.contains.members(['func', 'outroDado']);
      //expect(value).to.have.own.property('func'); Porque não funciona usando own.property?
    });

    it('Deve conseguir cachear um require', function () {
      var number = require('./require/utilCached.js').number;
      var secNumber = require('./require/utilCached.js').number;
      expect(number).to.equals(secNumber);
    });

    it('Deve ser possível realizar cadeias de require', function () {
      var fn = require('./require/utilChain');
      expect(fn()).to.equals('value');
    });

    it('Deve conseguir exportar mesmo tendo definições abaixo do exports', function () {
      var util = require('./require/utilexportnotlast')
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

    it('Deve possuir isolação de contextos', function () {
      this.name = 'index.js';
      require('./require/utilCtxIsolation')
      expect(this.name).to.equal('index.js')
    });

    it('Não deve ser possível utilizar globais do thrust.js', function () {
      expect(function () {
        return _thrustDir.getPath(); // eslint-disable-line no-undef
      }).to.throw()
    });
  });
}
