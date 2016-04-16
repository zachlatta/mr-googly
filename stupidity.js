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

    detectStuff(im, "haarcascade_frontalface_alt.xml", function (parentCoors) {
      detectStuff(im, "haarcascade_mcs_lefteye.xml", undefined, function (eye) {
        let flag = false;
        for (let k in parentCoors) {
          let coordinates = parentCoors[k];
          if (eye.x > coordinates.x-coordinates.width/2 &&
              eye.y > coordinates.y-coordinates.height/2 &&
              eye.x+eye.width < coordinates.x+coordinates.width/2 &&
              eye.y+eye.height < coordinates.y+coordinates.height/2) {
            flag = true;
          }
        }
        return flag;
      }, face, callback);
    }, undefined, face);
  });
}

function detectStuff(im, dataToUse, callback, check, face, finalCallback) {
  im.detectObject(dataToUse, {}, function (err, found) {
    if (err) {
      throw err;
    }

    let foundCoors = [];
    for (let i = 0; i < found.length; i++) {
      let aFound = found[i];
      if (!check || check(aFound)) { // either no check or check was true
        foundCoors.push(makeCoorsObj(aFound));
      }
    }
    if (callback) {
      callback(foundCoors);
    }
    else {
      drawEyesSon(foundCoors, face, finalCallback);
    }
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
function drawEyesSon(coordinates, face, finalCallback) {
  for (let x in coordinates) {
    let eye = coordinates[x];
    face.fill("#ffffff")
      .drawEllipse(eye.x, eye.y, eye.width/2, eye.height/2, 0, 360)
      .fill("#000000")
      .drawCircle(eye.x, eye.y, eye.x+eye.width/4, eye.y+eye.height/4);
  }
  face.write(face.source, function (err) {
    if (!err) {
      finalCallback();
    }
  });
}

module.exports = go;
