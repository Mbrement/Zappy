
class EventManager {
    constructor() {

        const ConnectMenu = require('./modules/ConnectMenu')
        this.modules = {
            ConnectMenu: new ConnectMenu()
        }
        this.authorizedFunctions = {
            ConnectMenu: new Set(['connect'])
        }

        this.onClickbind = this.onClick.bind(this)

        this.initEvent()
    }

    initEvent() {
        window.addEventListener('click', this.onClickbind)
    }

    async onClick(event) {
        try {
            const action = event.target.closest('[data-action]')?.dataset.action
            if (!action) {
                return
            }

            const module = event.target.closest('[data-module]')?.dataset.module
            if (!module) {
                return
            }

            const classPointer = this.modules[module]
            if (!classPointer) {
                return
            }

            const isAuthorized = this.authorizedFunctions[module]?.has(action)
            if (!isAuthorized) {
                return
            }

            await classPointer[action](event)
        }
        catch (error) {
            console.error("ERROR in EventManager", error)
        }
    }
}

module.exports = EventManager