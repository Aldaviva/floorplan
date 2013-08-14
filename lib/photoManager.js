var crp       = require('crp');
var fs        = require('fs');
var imageinfo = require('imageinfo');
var path      = require('path');
var Q         = require('q');
var verror    = require('verror');

var PHOTO_DIR = './public/images/photos/';

exports.importPhoto = function(originPath, destinationFilename){
	return validateFile(originPath)
		.then(function(imgInfo){
			var destinationPath = path.join(PHOTO_DIR, destinationFilename);
			imgInfo.path = path.resolve(destinationPath);
			
			var moveOrTranscodePromise;
			if((imgInfo.format != 'JPG') || (imgInfo.width != imgInfo.height)){
				moveOrTranscodePromise = cropToSquare(originPath, destinationPath, Math.min(imgInfo.width, imgInfo.height));
			} else {
				moveOrTranscodePromise = Q.nfcall(fs.rename, originPath, destinationPath);
			}

			return moveOrTranscodePromise
				.then(function(){
					return imgInfo;
				});
		})
		.fail(function(err){
			throw new verror.VError(err, "unable to import photo");
		});
};

function validateFile(imagePath){
	var buffer;
	return Q.nfcall(fs.readFile, imagePath)
		.then(function(buffer_){
			buffer = buffer_;
			return buffer;
		})
		.then(imageinfo)
		.then(function(image){

			if(!image.format){
				throw new verror.VError("file is not a supported image, should be JPEG");

			} else {
				return {
					size   : buffer.length,
					width  : image.width,
					height : image.height,
					format : image.format,
					path   : imagePath
				};
			}
		});
}

function cropToSquare(originPath, destinationPath, width){
	var cropOptions = {
		width: width,
		height: width,
		type: 'jpeg',
		quality: 50
	};
	return Q.nfcall(crp, originPath, cropOptions, destinationPath);
}

function getAspectRatio(width, height){
	var divisor = gcd(width, height);
	return [width/divisor, height/divisor].join(':');
}

/**
 * GCD (Greatest Common Divisor)
 * @author Nattawut Phetmak (neizod)
 * https://gist.github.com/neizod/1257856
 */
function gcd(){
	var a=arguments,b=a[0],c=a[1]|0;if(!a[2])return c?g(c,b%c):b;for(var i=1;i<a.length;b=g(b,a[i++]));return b
}