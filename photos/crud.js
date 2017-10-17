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

const express = require('express');
const images = require('../lib/images');
const oauth2 = require('../lib/oauth2');
const config = require('../config');


function getModel () {
  return require(`./model-${require('../config').get('DATA_BACKEND')}`);
}

const Vision = require('@google-cloud/vision');

const vision = Vision();

const router = express.Router();

// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
router.use(oauth2.template);

// Set Content-Type for all responses for these routes
router.use((req, res, next) => {
  res.set('Content-Type', 'text/html');
  next();
});

/**
 * GET /photos/add
 *
 * Display a page of 10 photos (up to ten at a time).
 */
router.get('/', (req, res, next) => {
  getModel().list(10, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err);
      return;
    }
    res.render('photos/list.pug', {
      photos: entities,
      nextPageToken: cursor
    });
  });
});

// [START mine]
// Use the oauth2.required middleware to ensure that only logged-in users
// can access this handler.
router.get('/mine', oauth2.required, (req, res, next) => {
  getModel().listBy(
    req.user.id,
    10,
    req.query.pageToken,
    (err, entities, cursor, apiResponse) => {
      if (err) {
        next(err);
        return;
      }
      res.render('photos/list.pug', {
        photos: entities,
        nextPageToken: cursor
      });
    }
  );
});
// [END mine]

/**
 * GET /photos/add
 *
 * Display a form for creating a photo.
 */
router.get('/add', (req, res) => {
  res.render('photos/form.pug', {
    photo: {},
    action: 'Add'
  });
});

/**
 * POST /photos/add
 *
 * Create a photo entry.
 */
// [START add]
router.post(
  '/add',
  images.multer.single('image'),
  images.sendUploadToGCS,
  (req, res, next) => {
    const data = req.body;

    // If the user is logged in, set them as the creator of the book.
    if (req.user) {
      data.createdBy = req.user.displayName;
      data.createdById = req.user.id;
    } else {
      data.createdBy = 'Anonymous';
    }

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
      const imgLabels = [];
      vision.labelDetection({ source: { imageUri: data.imageUrl } })
        .then((results) => {
          const labels = results[0].labelAnnotations;
          console.log('Labels:');
          labels.forEach((label) => {
            console.log(label.description);
            imgLabels.push(label.description);
          });
          data.category = images.getCategoryFromLabels(imgLabels);
          // req.body.category = data.category;
          console.log("Category may be : ",data.category);
          getModel().create(data, (err, savedData) => {
            if (err) {
              next(err);
              return;
            }
            res.redirect(`${req.baseUrl}/${savedData.id}`);
          });
        })
        .catch((err) => {
          console.error('ERROR:', err);
        });

    }

    // Save the data to the database.

  }
);
// [END add]

/**
 * GET /photos/:id/edit
 *
 * Display a photo for editing its details.
 */
router.get('/:photo/edit', (req, res, next) => {
  getModel().read(req.params.photo, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.render('photos/form.pug', {
      photo: entity,
      action: 'Edit'
    });
  });
});

/**
 * POST /photos/:id/edit
 *
 * Update a photo.
 */
router.post(
  '/:photo/edit',
  images.multer.single('image'),
  images.sendUploadToGCS,
  (req, res, next) => {
    const data = req.body;

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      req.body.imageUrl = req.file.cloudStoragePublicUrl;

      const imgLabels = [];
      vision.labelDetection({ source: { imageUri: data.imageUrl } })
        .then((results) => {
          const labels = results[0].labelAnnotations;
          console.log('Labels:');
          labels.forEach((label) => {
            console.log(label.description);
            imgLabels.push(label.description);
          });
          data.category = images.getCategoryFromLabels(imgLabels);
          console.log("Reupload Category may be : ",data.category);
          getModel().update(req.params.photo, data, (err, savedData) => {
            if (err) {
              next(err);
              return;
            }
            res.redirect(`${req.baseUrl}/${savedData.id}`);
          });
        })
        .catch((err) => {
          console.error('ERROR:', err);
        });

    }


  }
);

/**
 * GET /photos/:id
 *
 * Display a photo.
 */
router.get('/:photo', (req, res, next) => {
  getModel().read(req.params.photo, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.render('photos/view.pug', {
      photo: entity
    });
  });
});

/**
 * GET /photos/:id/delete
 *
 * Delete a photo.
 */
router.get('/:photo/delete', (req, res, next) => {
  getModel().delete(req.params.photo, (err) => {
    if (err) {
      next(err);
      return;
    }
    res.redirect(req.baseUrl);
  });
});

/**
 * Errors on "/photos/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  next(err);
});

module.exports = router;
