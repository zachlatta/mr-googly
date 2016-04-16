'use strict';

let slack = require('@slack/client');
let fetch = require('node-fetch');
let fs = require('fs');
let url = require('url');
let path = require('path');
let processImage = require('./stupidity.js');

let SlackUploadClient = require('node-slack-upload');
let RtmClient = slack.RtmClient;
let WebClient = slack.WebClient;

const RTM_EVENTS = slack.RTM_EVENTS;
const SLACK_TOKEN = process.env.SLACK_API_TOKEN || '';

let rtm = new RtmClient(SLACK_TOKEN, { logLevel: 'info' });
let web = new WebClient(SLACK_TOKEN);
let upload = new SlackUploadClient(SLACK_TOKEN);

// Get our user id so we can ignore messages from us in the future.
let botUserId = '';
web.auth.test()
  .then(resp => {
    botUserId = resp.user_id;

    rtm.start();
  });

rtm.on(RTM_EVENTS.MESSAGE, (msg) => {
  // Ignore if we sent the message
  if (msg.user == botUserId) {
    return;
  }

  // Ignore if the message doesn't have text attached to it
  if (msg.text === undefined) {
    return;
  }

  // Only reply if the user says some variation of "Mr. Googly"
  if (!(msg.text.toLowerCase().indexOf("mr. googly") > -1) &&
      !(msg.text.toLowerCase().indexOf("mr-googly") > -1) &&
      !(msg.text.toLowerCase().indexOf("mr googly") > -1)) {
    return;
  }

  console.log('received message');

  let userId = msg.user;

  web.users.info(userId)
    .then(resp => {
      console.log('got user info');
      let profilePictureUrl = resp.user.profile.image_original;

      // user.profile.image_original isn't set for people using Gravatar. Use
      // image_512 instead.
      if (profilePictureUrl == undefined) {
        profilePictureUrl = resp.user.profile.image_512;
      }

      return fetch(profilePictureUrl);
    })
    .then(resp => {
      console.log('got profile picture');

      let parsedUrl = url.parse(resp.url);
      let fileName = path.basename(parsedUrl.pathname);
      let f = fs.createWriteStream(fileName);

      return new Promise((resolve, reject) => {
        resp.body.pipe(f);

        resp.body.on('end', () => resolve(f));
        f.on('error', err => reject(err));
      });
    })
    .then(file => {
      console.log('wrote file');

      return new Promise((resolve, reject) => {
        processImage(file.path, () => resolve(file.path));
      });
    })
    .then(filePath => {
      console.log('uploading');
      return new Promise((resolve, reject) => {
        upload.uploadFile({
          file: fs.createReadStream(filePath),
          channels: msg.channel
        }, err => {
          if (err != undefined) {
            return reject(err);
          }

          return resolve();
        });
      });
    });
});
