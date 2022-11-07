const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const { nodeColor } = require('../../constants')

class MayaRedCombine extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'maya-red-combine',
        label: 'Combine messages',
        color: nodeColor,
        category: 'Maya Red Flow Primitives',
        isConfig: false,
        fields: {
            key: new fields.Typed({ type: 'str', allowedTypes: ['str', 'msg', 'flow', 'global'], displayName: 'Key', default: 'myKey' }),
            numMsgOverride: new fields.Typed({ type: 'num', allowedTypes: ['num', 'msg', 'flow'], displayName: 'Number of parts to wait for', default: "-1" })
        },

    })

    getNumOfInputWires() {
        let num = 0
        const id = this.redNode.id

        this.RED.nodes.eachNode((node) => {
            const wires = node.wires
            if (!Array.isArray(wires) || wires.length === 0) {
                return
            }

            const outgoingWires = wires[0]
            if (outgoingWires.includes(id)) {
                num += 1
            }
        })

        return num
    }

    onInit() {
        try {
            this.numOfInputWires = this.getNumOfInputWires()
        } catch (e) {
            console.log('error calculating inputs:', e)
        }
    }

    async onMessage(msg, vals) {
        const key = vals.key
        const numOfParts = vals.numMsgOverride > 0 ? vals.numMsgOverride : this.numOfInputWires
        const context = this.redNode.context()

        const msgKey = `${key}_msgs`
        const msgs = context.get(msgKey) || []

        if (msgs.length >= numOfParts - 1) {
            const msgsToSend = msgs.concat(msg)
            context.set(msgKey, undefined)
            return { result: msgsToSend, key: key }
        } else {
            context.set(msgKey, msgs.concat(msg))
        }
    }
}

module.exports = MayaRedCombine