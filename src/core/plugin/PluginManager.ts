import Module from 'module'
import PluginApi from './PluginApi'
import { IRendevozPluginApi } from '~/typings'

class PluginManager {
  plugins: IRendevozPluginApi[]
  constructor() {
    this.plugins = []
  }
  public registerPlugin = (module: unknown) => {
    const api = new PluginApi()
    if (typeof module === 'function') {
      module(api)
      this.plugins.push(api)
      return
    }
    if ('exports' in module) {
      const m = module as Module
      const defaultExport = m.exports.default
      if (typeof defaultExport === 'function') {
        defaultExport(api)
        this.plugins.push(api)
        return
      }
    }
    const defaultExport = module.default
    if (typeof defaultExport === 'function') {
      defaultExport(api)
      this.plugins.push(api)
    }
  }
}

export default PluginManager
