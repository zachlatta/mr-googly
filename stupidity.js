'use strict';

let cv = require('opencv');
let gm = require('gm').subClass({imageMagick: true});

function go(picture, callback) {
  let face = gm(picture);
  cv.readImage(picture, function (err, im){
    if (err) {
      throw err;
    }

    if (im.width() < 1 || im.height() < 1) {
      throw new Error('Image has no size');
    }

    detectStuff(im, "haarcascade_mcs_lefteye.xml", face, callback);
  });
}

function detectStuff(im, dataToUse, face, callback) {
  im.detectObject(dataToUse, {}, function (err, found) {
    if (err) {
      throw err;
    }

    let foundCoors = [];
    for (let i = 0; i < found.length; i++) {
      let aFound = found[i];
      foundCoors.push(makeCoorsObj(aFound));
    }
    drawEyesSon(foundCoors, face, callback);
  });
}

function makeCoorsObj(detected) {
  return {
    x: detected.x+(detected.width/2),
    y: detected.y+(detected.height/2),
    width: detected.width,
    height: detected.height
  };
}

/*
  face is a gm([picture of a face])
  coordinates is an array of objects shaped like this
  {
    x: xcor of center of eye
   ,y: ycor of center of eye
   ,width: width of eye
   ,height: height of eye
  }
*/
function drawEyesSon(coordinates, face, callback) {
  for (let x in coordinates) {
    let eye = coordinates[x];
    face.fill("#ffffff")
      .drawEllipse(eye.x, eye.y, eye.width/2, eye.height/2, 0, 360)
      .fill("#000000")
      .drawCircle(eye.x, eye.y, eye.x+eye.width/4, eye.y+eye.height/4);
  }
  face.write(face.source, function (err) {
    if (!err) {
      callback();
    }
  });
}

module.exports = go;
