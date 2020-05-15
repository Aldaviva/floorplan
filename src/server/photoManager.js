const _ = require('lodash')
const fs = require('fs')
const gm = require('gm')
const path = require('path')
const verror = require('verror')

const MAX_PHOTO_EDGE_LENGTH = 618
const QUALITY = 85 // 0 to 100 (best)

function importPhoto (originPath, destinationFilename) {
  return getImageInfo(originPath)
    .then(imageInfo => {
      if (isProcessingRequired(imageInfo)) {
        return processImage(originPath, imageInfo)
          .then(processedImage => {
            return saveProcessedImage(processedImage, destinationFilename)
          })
      }
      return moveUnprocessedImage(originPath, destinationFilename)
    })
    .then(() => {
      return { path: getDestinationPath(destinationFilename) }
    })
    .fail(err => {
      throw new verror.VError(err, 'unable to import photo')
    })
}

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
function getImageInfo (originPath) {
  const image = gm(originPath)
  return Promise.all([
    Promise.resolve(image, 'identify', '{ "width": %w, "height": %h, "format": "%m" }'),
    Promise.resolve(image, 'identify', '%[EXIF:Orientation]')
  ])
    .spread((rawInfo, orientation) => {
      let result
      try {
        result = JSON.parse(rawInfo)
      } catch (err) {
        throw new verror.VError(err, `gm.identify returned invalid JSON: ${rawInfo}`)
      }
      result.orientation = parseInt(orientation, 10) || undefined
      return result
    })
}

async function saveProcessedImage (processedImage, destinationFilename) {
  processedImage.quality(QUALITY) // 0 to 100 (best)
  processedImage.noProfile()
  await (processedImage, 'write', getDestinationPath(destinationFilename))
}

function isProcessingRequired (imageInfo) {
  return !isSquare(imageInfo) || !isJpeg(imageInfo) || !isStandardOrientation(imageInfo)
}

function isSquare (imageInfo) {
  return imageInfo.width === imageInfo.height
}

function isJpeg (imageInfo) {
  return imageInfo.format === 'JPEG'
}

/**
* @see EXIF orientation codes: http://sylvana.net/jpegcrop/exif_orientation.html
*/
function isStandardOrientation (imageInfo) {
  return !(imageInfo.orientation > 1) // standard := TopRight (1) or undefined
}

function processImage (originPath, imageInfo) {
  const image = gm(originPath)

  // Apply orientation from flag
  if (!isStandardOrientation(imageInfo)) {
    image.autoOrient()

    // We can't call size() to read these, because gm is a builder that queues all changes to be applied later.
    // size() would just return the stale original data because we haven't written yet.
    if (imageInfo.orientation >= 5) {
      _.extend(imageInfo, {
        width: imageInfo.height,
        height: imageInfo.width
      })
    }

    imageInfo.orientation = 1
  }

  // Crop to center square
  if (!isSquare(imageInfo)) {
    const inWidth = imageInfo.width
    const inHeight = imageInfo.height
    const outWidth = Math.min(inWidth, inHeight)
    const outHeight = outWidth
    const halfDimensionDifference = Math.abs((inWidth - inHeight) / 2)
    const x = (inWidth > inHeight) ? halfDimensionDifference : 0
    const y = (inHeight > inWidth) ? halfDimensionDifference : 0
    imageInfo.width = imageInfo.height = outWidth
    image.crop(outWidth, outHeight, x, y)
  }

  // Resize to <= max size
  if (Math.min(imageInfo.width, imageInfo.height) > MAX_PHOTO_EDGE_LENGTH) { image.resize(MAX_PHOTO_EDGE_LENGTH) }

  return Promise.resolve(image)
}

async function moveUnprocessedImage (originPath, destinationFilename) {
  await (fs.rename, originPath, getDestinationPath(destinationFilename))
}

function getDestinationPath (destinationFilename) {
  return path.join(global.dirPhotos, destinationFilename)
}

module.exports = { importPhoto }
