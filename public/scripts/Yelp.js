import * as OAuth from './lib/oauth.js'
import * as $ from './lib/jquery-min.js'

export default class Yelp {
  constructor () {
    this.ACCESS_PARAMS = {
      consumerKey: 'wq6N1ApR2G6CvL1d5IhKFQ',
      consumerSecret: '6_G7aiIJVO4ZugkN4VmE1rkzYN8',
      token: 'EbVtea8l0sAcWn85sFZ1xm_4tpRhv-yf',
      tokenSecret: '7gtqhRMHYvuAnKfUwLGi5mofBe8'
    }

    this.REQ_PARAMS = [
      ['callback', 'cb'],
      ['oauth_consumer_key', this.ACCESS_PARAMS.consumerKey],
      ['oauth_consumer_secret', this.ACCESS_PARAMS.consumerSecret],
      ['oauth_token', this.ACCESS_PARAMS.token],
      ['oauth_signature_method', 'HMAC-SHA1']
    ]
  }

  _sendRequest (urlTail, method) {
    var requestEnvelope = {
      action: 'http://api.yelp.com/v2/' + urlTail,
      method: method || 'GET',
      parameters: this.REQ_PARAMS
    }

    OAuth.setTimestampAndNonce(requestEnvelope)
    OAuth.SignatureMethod.sign(requestEnvelope, {
      consumerSecret: this.ACCESS_PARAMS.consumerSecret,
      tokenSecret: this.ACCESS_PARAMS.tokenSecret
    })

    var parameterMap = OAuth.getParameterMap(requestEnvelope.parameters)
    parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)

    return $.ajax({
      url: requestEnvelope.action,
      type: requestEnvelope.method,
      dataType: 'jsonp',
      data: parameterMap,
      jsonpCallback: 'cb',
      cache: true
    })
  }

  getRating (yelpId) {
    return this._sendRequest('business/' + yelpId, 'GET')
      .then(function (data) {
        return {
          stars: data.rating,
          reviews: data.review_count,
          img: data.rating_img_url
        }
      })
  }
}
