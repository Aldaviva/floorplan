this.yelp = (function(){

	var BUSINESS_ID = 'bluejeans-mountain-view';

	var ACCESS_PARAMS = {
		consumerKey    : "wq6N1ApR2G6CvL1d5IhKFQ",
		consumerSecret : "6_G7aiIJVO4ZugkN4VmE1rkzYN8",
		token          : "EbVtea8l0sAcWn85sFZ1xm_4tpRhv-yf",
		tokenSecret    : "7gtqhRMHYvuAnKfUwLGi5mofBe8"
	};

	var REQ_PARAMS = [
		['callback',               'cb'],
		['oauth_consumer_key',     ACCESS_PARAMS.consumerKey],
		['oauth_consumer_secret',  ACCESS_PARAMS.consumerSecret],
		['oauth_token',            ACCESS_PARAMS.token],
		['oauth_signature_method', 'HMAC-SHA1']
	];

	function _sendRequest(urlTail, method){
		var requestEnvelope = {
			action     : 'http://api.yelp.com/v2/'+urlTail,
			method     : method || 'GET',
			parameters : REQ_PARAMS
		};

		OAuth.setTimestampAndNonce(requestEnvelope);
		OAuth.SignatureMethod.sign(requestEnvelope, {
			consumerSecret : ACCESS_PARAMS.consumerSecret,
			tokenSecret    : ACCESS_PARAMS.tokenSecret
		});

		var parameterMap = OAuth.getParameterMap(requestEnvelope.parameters);
		parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);

		return $.ajax({
			url           : requestEnvelope.action,
			type          : requestEnvelope.method,
			dataType      : 'jsonp',
			data          : parameterMap,
			jsonpCallback : 'cb',
			cache         : true
		});
	}

	function getRating(){
		return _sendRequest('business/'+BUSINESS_ID, 'GET')
			.then(function(data){
				return {
					stars   : data.rating,
					reviews : data.review_count,
					img     : data.rating_img_url
				};
			});
	}

	return {
		getRating: getRating
	};

})();