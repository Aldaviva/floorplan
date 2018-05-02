import msgpack from 'msgpack5'
import BufferList from 'bl'
import got from 'got'
import setImmediate from 'setimmediate' // needed by "got"

export default class Data {
  // Use this to provide data from the NodeJS instance
  static nodeData () {
    return got.get(window.location.protocol + '/dataMP', {'Content-Type': 'application/msgpack'})
      .then(BufferList(function (err, data) {
        if (err) window.console.log(err.stack)
        return msgpack().decode(data) // returned format is stdContext in lib/services.js
      }))
  }
}
