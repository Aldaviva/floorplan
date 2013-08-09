var fs         = require('fs');
var imageinfo = require('imageinfo');
var path       = require('path');
var Q          = require('q');
var verror     = require('verror');

var PHOTO_DIR = './public/images/photos/';

exports.importPhoto = function(originPath, destinationFilename){
	return validateFile(originPath)
		.then(function(){
			var destinationPath = path.join(PHOTO_DIR, destinationFilename);
			console.log("mv %s %s", originPath, destinationPath);
			return Q.nfcall(fs.rename, originPath, destinationPath);
		})
		.fail(function(err){
			throw new verror.VError(err, "unable to import photo");
		});
};

function validateFile(path){
	return Q.nfcall(fs.readFile, path)
		.then(imageinfo)
		.then(function(image){

			if(!image.format){
				throw new verror.VError("file is not a supported image, should be JPEG");

			} else if(image.format != 'JPG'){
				throw new verror.VError("image is in %s format, should be JPEG", image.format);

			} else if(image.width != image.height){
				var aspectRatio = getAspectRatio(image.width, image.height);
				throw new verror.VError("image has an aspect ratio of %s, should be 1:1 (square)", aspectRatio);

			} else {
				return true;
			}
		});
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