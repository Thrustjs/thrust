exports = function exec (describe, it, beforeEach, afterEach, expect, should, assert) {
  var cli = require('../src/cli/cli').processCLI;

  describe('Teste do processador de CLI', function () {
    describe('init', function () {
      it('init simples', function () {
        var commandInfo = cli('init');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'init',
          'args.path': undefined,
          'options.template': 'web-complete',
          'options.force': false
        });
      });

      it('init path, template e force', function () {
        var commandInfo = cli('init teste -f -t owner/repo');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'init',
          'args.path': 'teste',
          'options.template': 'owner/repo',
          'options.force': true
        });
      });
    });

    describe('install', function () {
      it('install sem argumentos', function () {
        var commandInfo = cli('install');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'install',
          'args.resource': undefined
        });
      });

      it('install com argumento', function () {
        var commandInfo = cli('install database');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'install',
          'args.resource': 'database'
        });
      });
    });

    describe('upgrade', function () {
      it('upgrade', function () {
        var commandInfo = cli('upgrade');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'upgrade',
          'args.version': undefined
        });
      });

      it('upgrade com versão', function () {
        var commandInfo = cli('upgrade 5.0');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'upgrade',
          'args.version': '5.0'
        });
      });
    });

    describe('help', function () {
      it('help', function () {
        var commandInfo = cli('help');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'help'
        });
      });

      it('help com -h', function () {
        var commandInfo = cli('-h');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'help'
        });
      });

      it('help de um comando', function () {
        var commandInfo = cli('init -h');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'help',
          'args.cmd': 'init'
        });
      });

      it('help default', function () {
        var commandInfo = cli('');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'help'
        });
      });

      it('help comando que não existe', function () {
        var commandInfo = cli('comandoquenaoexistenocli');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'help'
        });
      });
    });

    describe('version', function () {
      it('version', function () {
        var commandInfo = cli('version');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'version'
        });
      });

      it('version com -v', function () {
        var commandInfo = cli('-v');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'version'
        });
      });
    });
  });
}