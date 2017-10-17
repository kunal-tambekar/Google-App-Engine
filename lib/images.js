// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const Storage = require('@google-cloud/storage');
const config = require('../config');

const CLOUD_BUCKET = config.get('CLOUD_BUCKET');

const storage = Storage({
  projectId: config.get('GCLOUD_PROJECT')
});
const bucket = storage.bucket(CLOUD_BUCKET);

// Returns the public, anonymously accessable URL to a given Cloud Storage
// object.
// The object's ACL has to be set to public read.
function getPublicUrl (filename) {
  return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`;
}

// Express middleware that will automatically pass uploads to Cloud Storage.
// req.file is processed and will have two new properties:
// * ``cloudStorageObject`` the object name in cloud storage.
// * ``cloudStoragePublicUrl`` the public url to the object.
function sendUploadToGCS (req, res, next) {
  if (!req.file) {
    return next();
  }

  const gcsname = Date.now() + req.file.originalname;
  const file = bucket.file(gcsname);
  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  stream.on('error', (err) => {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    req.file.cloudStorageObject = gcsname;
    file.makePublic().then(() => {
      req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
      next();
    });
  });

  stream.end(req.file.buffer);
}

function getCategoryFromLabels(imgLabels){
  const strPeople = "people, social, person, head, smile, human, forehead, chin, man, face, hair, Facial Hair, nose, girl, boy, hair, cheek, friend,hug, neck, happy, happiness, child, children, eyebrow, blond, model, supermodel, president, minister, lip, gathering, lady, woman,social group ,suit  business executive business professional businessperson white collar worker public relations management team";
  const strAnimals = "cat, dog, bat, rat, mouse, lion, tiger, bird, feather, roar, elephant, mammal, reptile, snake, amphibian, frog, fish, bird, duck, dove, insect, animal, panda, bear, claw, paw, dinosaur, fox, Arctic Fox Coyote Liger Lynx Octopus Penguin Skunk Squirrel Monkey Starfish Tarsier Thorny Devil Tortoise Toucan Zonkey Arctic Wolf Crocodile Grizzly Bear Hippopotamus Jaguar Killer Whale Komodo Dragon Puffer Fish Snapping Turtle Stingray Tiger Shark Pet pets Bearded Collie Bearded Dragon Chinchilla Cow Duck Gecko Guinea Pig Hamster Hound Clouded Leopard Giant Panda Bear Ocelot Okapi Panther Polar Bear Proboscis Monkey Red Panda Rhinoceros River Dolphin Sloth White Tiger";
  const strFlowers = "flower, rose, lotus, tulip, cardinal, daisy, lavender, sunflower, petal, thorn, leaf, leaves, bloom, flora, fauna, plant";

  for(var i = 0; i< imgLabels.length;i++){
    if(strPeople.includes(imgLabels[i])){
      return "People";
    }else if(strAnimals.includes(imgLabels[i])){
      return"Animals";
    }else if(strFlowers.includes(imgLabels[i])){
      return "Flowers";
    }
  }

  return "Others";
}




// Multer handles parsing multipart/form-data requests.
// This instance is configured to store images in memory.
// This makes it straightforward to upload to Cloud Storage.
const Multer = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 15 * 1024 * 1024 // no larger than 15mb
  }
});

module.exports = {
  getPublicUrl,
  sendUploadToGCS,
  getCategoryFromLabels,
  multer
};
