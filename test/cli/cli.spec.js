exports = function exec (describe, it, beforeEach, afterEach, expect, should, assert) {
  let cli = require('../src/cli/cli').processCLI;

  describe('Teste do processador de CLI', function () {
    describe('init', function () {
      it('init simples', function () {
        let commandInfo = cli('init');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'init',
          'args.path': undefined,
          'options.template': 'web-complete',
          'options.force': false
        });
      });

      it('init path, template e force', function () {
        let commandInfo = cli('init teste -f -t owner/repo');

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
        let commandInfo = cli('install');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'install',
          'args.resource': undefined
        });
      });

      it('install com argumento', function () {
        let commandInfo = cli('install database');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'install',
          'args.resource': 'database'
        });
      });
    });

    describe('update', function () {
      it('update', function () {
        let commandInfo = cli('update');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'update',
          'args.version': undefined
        });
      });

      it('update com versão', function () {
        let commandInfo = cli('update 5.0');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'update',
          'args.version': '5.0'
        });
      });
    });

    describe('help', function () {
      it('help', function () {
        let commandInfo = cli('help');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'help'
        });
      });

      it('help com -h', function () {
        let commandInfo = cli('-h');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'help'
        });
      });

      it('help de um comando', function () {
        let commandInfo = cli('init -h');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'help',
          'args.cmd': 'init'
        });
      });

      it('help default', function () {
        let commandInfo = cli('');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'help'
        });
      });

      it('help comando que não existe', function () {
        let commandInfo = cli('comandoquenaoexistenocli');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'help'
        });
      });
    });

    describe('version', function () {
      it('version', function () {
        let commandInfo = cli('version');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'version'
        });
      });

      it('version com -v', function () {
        let commandInfo = cli('-v');

        expect(commandInfo).to.be.an('object');
        expect(commandInfo.argsMD).to.nested.include({
          'name': 'version'
        });
      });
    });
  });
}