import commands from '../../commands';
import Command, { CommandOption, CommandValidate, CommandError } from '../../../../Command';
import * as sinon from 'sinon';
import appInsights from '../../../../appInsights';
import auth, { Site } from '../../SpoAuth';
const command: Command = require('./app-upgrade');
import * as assert from 'assert';
import request from '../../../../request';
import Utils from '../../../../Utils';

describe(commands.APP_UPGRADE, () => {
  let vorpal: Vorpal;
  let log: string[];
  let cmdInstance: any;
  let trackEvent: any;
  let telemetry: any;
  let requests: any[];

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(auth, 'getAccessToken').callsFake(() => Promise.resolve('ABC')); 
    trackEvent = sinon.stub(appInsights, 'trackEvent').callsFake((t) => {
      telemetry = t;
    });
  });

  beforeEach(() => {
    vorpal = require('../../../../vorpal-init');
    log = [];
    cmdInstance = {
      log: (msg: string) => {
        log.push(msg);
      }
    };
    auth.site = new Site();
    telemetry = null;
    requests = [];
  });

  afterEach(() => {
    Utils.restore(vorpal.find);
  });

  after(() => {
    Utils.restore([
      appInsights.trackEvent,
      auth.ensureAccessToken,
      auth.getAccessToken,
      auth.restoreAuth,
      request.get
    ]);
  });

  it('has correct name', () => {
    assert.equal(command.name.startsWith(commands.APP_UPGRADE), true);
  });

  it('has a description', () => {
    assert.notEqual(command.description, null);
  });

  it('calls telemetry', (done) => {
    cmdInstance.action = command.action();
    cmdInstance.action({ options: {} }, () => {
      try {
        assert(trackEvent.called);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('logs correct telemetry event', (done) => {
    cmdInstance.action = command.action();
    cmdInstance.action({ options: {} }, () => {
      try {
        assert.equal(telemetry.name, commands.APP_UPGRADE);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('aborts when not logged in to a SharePoint site', (done) => {
    auth.site = new Site();
    auth.site.connected = false;
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: true } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('Log in to a SharePoint Online site first')));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('upgrades the app in the specified site (debug)', (done) => {
    sinon.stub(request, 'post').callsFake((opts) => {
      requests.push(opts);

      if (opts.url.indexOf('/common/oauth2/token') > -1) {
        return Promise.resolve('abc');
      }

      if (opts.url.indexOf(`/_api/web/tenantappcatalog/AvailableApps/GetById('b2307a39-e878-458b-bc90-03bc578531d6')/upgrade`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve();
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso.sharepoint.com';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: true, id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com' } }, () => {
      let correctRequestIssued = false;
      requests.forEach(r => {
        if (r.url.indexOf(`/_api/web/tenantappcatalog/AvailableApps/GetById('b2307a39-e878-458b-bc90-03bc578531d6')/upgrade`) > -1 &&
          r.headers.authorization &&
          r.headers.authorization.indexOf('Bearer ') === 0 &&
          r.headers.accept &&
          r.headers.accept.indexOf('application/json') === 0) {
          correctRequestIssued = true;
        }
      });
      try {
        assert(correctRequestIssued);
        done();
      }
      catch (e) {
        done(e);
      }
      finally {
        Utils.restore(request.post);
      }
    });
  });

  it('upgrades app in the specified site', (done) => {
    sinon.stub(request, 'post').callsFake((opts) => {
      requests.push(opts);

      if (opts.url.indexOf('/common/oauth2/token') > -1) {
        return Promise.resolve('abc');
      }

      if (opts.url.indexOf(`/_api/web/tenantappcatalog/AvailableApps/GetById('b2307a39-e878-458b-bc90-03bc578531d6')/upgrade`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve();
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso.sharepoint.com';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com' } }, () => {
      let correctRequestIssued = false;
      requests.forEach(r => {
        if (r.url.indexOf(`/_api/web/tenantappcatalog/AvailableApps/GetById('b2307a39-e878-458b-bc90-03bc578531d6')/upgrade`) > -1 &&
          r.headers.authorization &&
          r.headers.authorization.indexOf('Bearer ') === 0 &&
          r.headers.accept &&
          r.headers.accept.indexOf('application/json') === 0) {
          correctRequestIssued = true;
        }
      });
      try {
        assert(correctRequestIssued);
        done();
      }
      catch (e) {
        done(e);
      }
      finally {
        Utils.restore(request.post);
      }
    });
  });

  it('upgrades app in the specified site installed from site collection app catalog', (done) => {
    sinon.stub(request, 'post').callsFake((opts) => {
      requests.push(opts);

      if (opts.url.indexOf('/common/oauth2/token') > -1) {
        return Promise.resolve('abc');
      }

      if (opts.url.indexOf(`/_api/web/sitecollectionappcatalog/AvailableApps/GetById('b2307a39-e878-458b-bc90-03bc578531d6')/upgrade`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve();
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso.sharepoint.com';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com', scope: 'sitecollection' } }, () => {
      let correctRequestIssued = false;
      requests.forEach(r => {
        if (r.url.indexOf(`/_api/web/sitecollectionappcatalog/AvailableApps/GetById('b2307a39-e878-458b-bc90-03bc578531d6')/upgrade`) > -1 &&
          r.headers.authorization &&
          r.headers.authorization.indexOf('Bearer ') === 0 &&
          r.headers.accept &&
          r.headers.accept.indexOf('application/json') === 0) {
          correctRequestIssued = true;
        }
      });
      try {
        assert(correctRequestIssued);
        done();
      }
      catch (e) {
        done(e);
      }
      finally {
        Utils.restore(request.post);
      }
    });
  });

  it('correctly handles failure when app not found in app catalog', (done) => {
    sinon.stub(request, 'post').callsFake((opts) => {
      requests.push(opts);

      if (opts.url.indexOf('/common/oauth2/token') > -1) {
        return Promise.resolve('abc');
      }

      if (opts.url.indexOf(`/_api/web/tenantappcatalog/AvailableApps/GetById('b2307a39-e878-458b-bc90-03bc578531d6')/upgrade`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.reject({
            error: JSON.stringify({
              'odata.error': {
                code: '-1, Microsoft.SharePoint.Client.ResourceNotFoundException',
                message: {
                  lang: "en-US",
                  value: "Exception of type 'Microsoft.SharePoint.Client.ResourceNotFoundException' was thrown."
                }
              }
            })
          });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso.sharepoint.com';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com' } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError("Exception of type 'Microsoft.SharePoint.Client.ResourceNotFoundException' was thrown.")));
        done();
      }
      catch (e) {
        done(e);
      }
      finally {
        Utils.restore(request.post);
      }
    });
  });

  it('correctly handles random API error', (done) => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.url.indexOf('/common/oauth2/token') > -1) {
        return Promise.resolve('abc');
      }

      if (opts.url.indexOf(`/_api/web/tenantappcatalog/AvailableApps/GetById('b2307a39-e878-458b-bc90-03bc578531d6')/upgrade`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.reject({ error: 'An error has occurred' });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso-admin.sharepoint.com';
    auth.site.tenantId = 'abc';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com' } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('An error has occurred')));
        done();
      }
      catch (e) {
        done(e);
      }
      finally {
        Utils.restore(request.post);
      }
    });
  });

  it('correctly handles random API error (error message is not ODataError)', (done) => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.url.indexOf('/common/oauth2/token') > -1) {
        return Promise.resolve('abc');
      }

      if (opts.url.indexOf(`/_api/web/tenantappcatalog/AvailableApps/GetById('b2307a39-e878-458b-bc90-03bc578531d6')/upgrade`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.reject({ error: JSON.stringify({ message: 'An error has occurred' }) });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso-admin.sharepoint.com';
    auth.site.tenantId = 'abc';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com' } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('{"message":"An error has occurred"}')));
        done();
      }
      catch (e) {
        done(e);
      }
      finally {
        Utils.restore(request.post);
      }
    });
  });

  it('correctly handles API OData error', (done) => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.url.indexOf('/common/oauth2/token') > -1) {
        return Promise.resolve('abc');
      }

      if (opts.url.indexOf(`/_api/web/tenantappcatalog/AvailableApps/GetById('b2307a39-e878-458b-bc90-03bc578531d6')/upgrade`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.reject({
            error: JSON.stringify({
              'odata.error': {
                code: '-1, Microsoft.SharePoint.Client.InvalidOperationException',
                message: {
                  value: 'An error has occurred'
                }
              }
            })
          });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso-admin.sharepoint.com';
    auth.site.tenantId = 'abc';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com' } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('An error has occurred')));
        done();
      }
      catch (e) {
        done(e);
      }
      finally {
        Utils.restore(request.post);
      }
    });
  });

  it('fails validation if the id option not specified', () => {
    const actual = (command.validate() as CommandValidate)({ options: {} });
    assert.notEqual(actual, true);
  });

  it('fails validation if the siteUrl option not specified', () => {
    const actual = (command.validate() as CommandValidate)({ options: { id: 'b2307a39-e878-458b-bc90-03bc578531d6' } });
    assert.notEqual(actual, true);
  });

  it('fails validation when the id is not a valid GUID', () => {
    const actual = (command.validate() as CommandValidate)({ options: { id: '123', siteUrl: 'https://contoso.sharepoint.com' } });
    assert.notEqual(actual, true);
  });

  it('fails validation if the siteUrl option is not a valid SharePoint site URL', () => {
    const actual = (command.validate() as CommandValidate)({ options: { id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'foo' } });
    assert.notEqual(actual, true);
  });

  it('fails validation when the scope is not \'tenant\' nor \'sitecollection\'', () => {
    const actual = (command.validate() as CommandValidate)({ options: { id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com', scope: 'abc' } });
    assert.notEqual(actual, true);
  });

  it('passes validation when the id and siteUrl options are specified', () => {
    const actual = (command.validate() as CommandValidate)({ options: { id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com' } });
    assert.equal(actual, true);
  });

  it('passes validation when valid id and site url', () => {
    const actual = (command.validate() as CommandValidate)({ options: { id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com' } });
    assert.equal(actual, true);
  });

  it('passes validation when the scope is \'sitecollection\'', () => {
    const actual = (command.validate() as CommandValidate)({ options: { id: 'b2307a39-e878-458b-bc90-03bc578531d6', siteUrl: 'https://contoso.sharepoint.com', scope: 'sitecollection' } });
    assert.equal(actual, true);
  });

  it('supports debug mode', () => {
    const options = (command.options() as CommandOption[]);
    let containsdebugOption = false;
    options.forEach(o => {
      if (o.option === '--debug') {
        containsdebugOption = true;
      }
    });
    assert(containsdebugOption);
  });

  it('has help referring to the right command', () => {
    const cmd: any = {
      log: (msg: string) => {},
      prompt: () => {},
      helpInformation: () => {}
    };
    const find = sinon.stub(vorpal, 'find').callsFake(() => cmd);
    cmd.help = command.help();
    cmd.help({}, () => {});
    assert(find.calledWith(commands.APP_UPGRADE));
  });

  it('has help with examples', () => {
    const _log: string[] = [];
    const cmd: any = {
      log: (msg: string) => {
        _log.push(msg);
      },
      prompt: () => {},
      helpInformation: () => {}
    };
    sinon.stub(vorpal, 'find').callsFake(() => cmd);
    cmd.help = command.help();
    cmd.help({}, () => {});
    let containsExamples: boolean = false;
    _log.forEach(l => {
      if (l && l.indexOf('Examples:') > -1) {
        containsExamples = true;
      }
    });
    Utils.restore(vorpal.find);
    assert(containsExamples);
  });

  it('correctly handles lack of valid access token', (done) => {
    Utils.restore(auth.getAccessToken);
    sinon.stub(auth, 'getAccessToken').callsFake(() => { return Promise.reject(new Error('Error getting access token')); });
    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso.sharepoint.com';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: true, id: '123', siteUrl: 'https://contoso.sharepoint.com' } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('Error getting access token')));
        done();
      }
      catch (e) {
        done(e);
      }
      finally {
        Utils.restore(auth.getAccessToken);
      }
    });
  });
});