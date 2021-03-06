'use babel'

import {CompositeDisposable} from 'atom'
import {Tester} from './tester'
import TestPanel from './components/test-panel'
import {TestPanelManager} from './test-panel-manager'

export default {
  dependenciesInstalled: null,
  goget: null,
  goconfig: null,
  subscriptions: null,
  tester: null,
  toolCheckComplete: null,
  toolRegistered: null,

  activate () {
    this.subscriptions = new CompositeDisposable()
    require('atom-package-deps').install('tester-go').then(() => {
      this.dependenciesInstalled = true
      return this.dependenciesInstalled
    }).catch((e) => {
      console.log(e)
    })

    this.getTestPanelManager()
    this.getTester()
  },

  deactivate () {
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.goget = null
    this.goconfig = null
    this.tester = null
    this.testPanelManager = null
    this.dependenciesInstalled = null
    this.toolCheckComplete = null
    this.toolRegistered = null
  },

  provide () {
    return this.getTester()
  },

  getTester () {
    if (this.tester) {
      return this.tester
    }
    this.tester = new Tester(() => {
      return this.getGoconfig()
    }, () => {
      return this.getGoget()
    }, () => {
      return this.getTestPanelManager()
    })
    this.subscriptions.add(this.tester)
    return this.tester
  },

  getTestPanelManager () {
    if (this.testPanelManager) {
      return this.testPanelManager
    }
    this.testPanelManager = new TestPanelManager()
    this.subscriptions.add(this.testPanelManager)
    return this.testPanelManager
  },

  getGoconfig () {
    if (this.goconfig) {
      return this.goconfig
    }
    return false
  },

  getGoget () {
    if (this.goget) {
      return this.goget
    }
    return false
  },

  consumeGoconfig (service) {
    this.goconfig = service
    this.checkForTools()
  },

  consumeGoget (service) {
    this.goget = service
    this.checkForTools()
    this.registerTool()
  },

  checkForTools () {
    if (!this.toolCheckComplete && this.goconfig && this.goget) {
      let options = {env: this.goconfig.environment()}
      this.goconfig.locator.findTool('cover', options).then((cmd) => {
        if (!cmd) {
          this.toolCheckComplete = true
          this.goget.get({
            name: 'tester-go',
            packageName: 'cover',
            packagePath: 'golang.org/x/tools/cmd/cover',
            type: 'missing'
          }).then((r) => {
            if (!r.success) {
              console.log('cover is not available and could not be installed via "go get -u golang.org/x/tools/cmd/cover"; please manually install it to enable display of coverage.')
            }
          }).catch((e) => {
            console.log(e)
          })
        }
      })
    }
  },

  registerTool () {
    if (this.toolRegistered || !this.goget) {
      return
    }
    this.subscriptions.add(this.goget.register('golang.org/x/tools/cmd/cover'))
    this.toolRegistered = true
  },

  provideGoPlusView () {
    return {
      view: TestPanel,
      model: this.getTestPanelManager()
    }
  }
}
