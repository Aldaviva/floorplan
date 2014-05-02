var _      = require('lodash');
var fs     = require('fs');
var gm     = require('gm');
var path   = require('path');
var Q      = require('q');
var verror = require('verror');

var PHOTO_DIR = './data/photos/';
var MAX_PHOTO_EDGE_LENGTH = 618;
var QUALITY = 75; //0 to 100 (best)

exports.importPhoto = function(originPath, destinationFilename){
	return getImageInfo(originPath)
		.then(function(imageInfo){
			if(isProcessingRequired(imageInfo)){
				return processImage(originPath, imageInfo)
					.then(function(processedImage){
						return saveProcessedImage(processedImage, destinationFilename);
					});
			} else {
				return moveUnprocessedImage(originPath, destinationFilename);
			}
		})
		.then(function(){
			return {
				path: getDestinationPath(destinationFilename)
			};
		})
		.fail(function(err){
			throw new verror.VError(err, "unable to import photo");
		});
};

/**
 * @see Identify format: http://www.graphicsmagick.org/1.1/www/GraphicsMagick.html#details-format
 *
 * Sometimes the Orientation field is present multiple times in the image EXIF, such as 
Orientation=1
Orientation=1
 * This results in JSON of the form 
{ orientation: "1
1" }
 * (that line break between 1 and 1 is the problem)
 *
 * This causes the JSON parser to fail because you can't just stick a line break in the middle 
 * of a string without escaping it.
 *
 * To solve this problem, request the orientation value separately from any JSON processing, and 
 * just pass it straight to parseInt, which handles the line breaks gracefully and returns the 
 * first number it sees. Once that's done, combine the parsed orientation value with the other 
 * JSON metadata.
 */
function getImageInfo(originPath){
	var image = gm(originPath);
	return Q.all([
			Q.ninvoke(image, 'identify', '{ "width": %w, "height": %h, "format": "%m" }'),
			Q.ninvoke(image, 'identify', '%[EXIF:Orientation]')
		])
		.spread(function(rawInfo, orientation){
			var result;
			try {
				result = JSON.parse(rawInfo);
			} catch(err){
				throw new verror.VError(err, "gm.identify returned invalid JSON: "+rawInfo);
			}
			result.orientation = parseInt(orientation, 10) || undefined;
			return result;
		});
}

function saveProcessedImage(processedImage, destinationFilename){
	processedImage.quality(QUALITY); //0 to 100 (best)
	processedImage.noProfile();
	return Q.ninvoke(processedImage, 'write', getDestinationPath(destinationFilename));
}

function isProcessingRequired(imageInfo){
	return !isSquare(imageInfo) || !isJpeg(imageInfo) || !isStandardOrientation(imageInfo);
}

function isSquare(imageInfo){
	return imageInfo.width === imageInfo.height;
}

function isJpeg(imageInfo){
	return imageInfo.format === 'JPEG';
}

/**
 * @see EXIF orientation codes: http://sylvana.net/jpegcrop/exif_orientation.html
 */
function isStandardOrientation(imageInfo){
	return !(imageInfo.orientation > 1); //standard := TopRight (1) or undefined
}

function processImage(originPath, imageInfo){
	var image = gm(originPath);

	// Apply orientation from flag
	if(!isStandardOrientation(imageInfo)){
		image.autoOrient();

		//We can't call size() to read these, because gm is a builder that queues all changes to be applied later.
		//size() would just return the stale original data because we haven't written yet.
		if(imageInfo.orientation >= 5){
			_.extend(imageInfo, {
				width: imageInfo.height,
				height: imageInfo.width
			});
		}

		imageInfo.orientation = 1;
	}

	// Crop to center square
	if(!isSquare(imageInfo)){
		var inWidth = imageInfo.width;
		var inHeight = imageInfo.height;
		var outWidth = Math.min(inWidth, inHeight);
		var outHeight = outWidth;
		var halfDimensionDifference = Math.abs((inWidth-inHeight)/2);
		var x = (inWidth > inHeight) ? halfDimensionDifference : 0;
		var y = (inHeight > inWidth) ? halfDimensionDifference : 0;

		imageInfo.width = imageInfo.height = outWidth;
		image.crop(outWidth, outHeight, x, y);
	}

	// Resize to <= max size
	if(Math.min(imageInfo.width, imageInfo.height) > MAX_PHOTO_EDGE_LENGTH){
		image.resize(MAX_PHOTO_EDGE_LENGTH);
	}

	return Q.resolve(image);
}

function moveUnprocessedImage(originPath, destinationFilename){
	return Q.nfcall(fs.rename, originPath, getDestinationPath(destinationFilename));
}

function getDestinationPath(destinationFilename){
	return path.join(PHOTO_DIR, destinationFilename);
}