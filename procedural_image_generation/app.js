/* NOTES =======================================================================

There are several problems that this code must solve to work, namely...

Encoding:
+ Allowing upload of an image from the user.
+ Extracting image data from a .png or .jpeg file using Javascript.
+ Encoding shapes, positional data, and color in a string.
+ Comparing the difference between the base 64 encoding of the generated image
  and the original image.

Reproduction:
+ Fitness function for determining the suitability of the generated image.
+ Splicing new generations and not allowing corrupted encodings to be generated
  or failing that, discarding any noise that comes with the input.(PRETTY TOUGH ACTUALLY)

Ok, apparently pixel data is the answer. Uniform length - 1,000,000 ints
between 0 and 255. Need a function that will loop over, take the difference.
If all one million are identical, should return 1.0. If all million are on
opposite sides of the range (one has 0, the other 255 for all pairs) then
returns 0. Some sort of ratio will be involved I think.

Loop over each, take absolute value of (origin value - generated value).

 for each 1 / Math.abs(targetImgVal - generatedImgVal) => sum and divide by 1,000,000.


============================================================================= */

'use strict';

var constants = {};

constants.MUTATION_RATE          = 0.01;
constants.CROSSOVER_RATE         = 0.7;
constants.POPULATION_SIZE        = 20;
constants.NUM_SHAPES_PER_IMAGE   = 50;
constants.NUM_VERTICES_PER_SHAPE = 3;
constants.SAMPLE_SIZE            = 50000;

// generate random number given a max and min

function randomNum(max, min) {
    min = min || 0;
    return Math.random() * (max - min) + min;
}

function randomInt(max, min) {
  min = min || 0;
  return Math.round(randomNum(max, min));
}

function generateRandomColor() {
    return 'rgba(' + (Math.floor(Math.random() * 256))
            + ',' + (Math.floor(Math.random() * 256))
            + ',' + (Math.floor(Math.random() * 256))
            + ',' + (Math.round(Math.random() * 10) / 10) + ')';
}

// create random shapes on canvas

function drawCanvas(args) {
    var canvas    = args.canvas,
        ctx       = args.ctx,
        imageData = args.imageData;

    var path = new Path2D();

    for (var i = 0; i < constants.NUM_SHAPES_PER_IMAGE; i++) {
      path.moveTo(imageData.shapeData[i].vertices[0].x, imageData.shapeData[i].vertices[0].y);

      for(var j = 1; j < constants.NUM_VERTICES_PER_SHAPE; j++) {
        path.lineTo(imageData.shapeData[i].vertices[j].x, imageData.shapeData[i].vertices[j].y);
      }
      ctx.fillStyle = imageData.shapeData[i].color;
      ctx.fill(path);
      ctx.closePath(path);
    }

    // var generatedPixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // console.log('DATA URL, GENERATED CANVAS: ', canvas.toDataURL());
    // console.log('GENERATED LENGTH: ', canvas.toDataURL().length);
    // console.log('GENERATED PIXEL DATA: ', generatedPixelData);
    // console.log('GENERATED IMAGE DATA LENGTH: ', generatedPixelData.length);
}

function fileToCanvas(args) {
  var file   = args.file,
      ctx    = args.ctx,
      canvas = args.canvas;

  var img    = new Image(),
      reader = new FileReader();

  reader.onload = function() {
    img.src = reader.result;
    ctx.drawImage(img, 0, 0, canvas.height, canvas.width);
    console.log('ORIGIN LENGTH: ', canvas.toDataURL().length);
    console.log('ORIGIN PIXEL DATA: ', ctx.getImageData(0, 0, canvas.width, canvas.height).data);
    console.log('ORIGIN IMAGE DATA LENGTH: ', ctx.getImageData(0, 0, canvas.width, canvas.height).data.length);
  };
  reader.readAsDataURL(file);
}

function SeedImage(canvas) {
  this.shapeData   = [];
  this.canvas      = canvas;
  this.ctx         = canvas.getContext('2d');

  for (var i = 0; i < constants.NUM_SHAPES_PER_IMAGE; i++) {
    this.shapeData.push({color: generateRandomColor(), vertices: []});
    for (var j = 0; j < constants.NUM_VERTICES_PER_SHAPE; j++) {
      this.shapeData[i].vertices.push({
        x: randomNum(constants.X_LIMIT),
        y: randomNum(constants.Y_LIMIT)
      });
    }
  }
}

function Population(container) {
  this.members   = [];

  for (var i = 0; i < constants.POPULATION_SIZE; i++) {
    container.innerHTML += '<canvas height="500" width="500" class="generated-canvas" data-id="' + i + '"></canvas>';
    this.members.push(new SeedImage(container.children[i]));

    drawCanvas({
      canvas: this.members[i].canvas,
      ctx: this.members[i].ctx,
      imageData: this.members[i]
    })
  }
}

Population.prototype.assignFitness = function(targetRGBA) {
  var start = Date.now();

  for (var i = 0; i < this.members.length; i++) {
    var diffs          = [],
        diffSum        = 0,
        checkedIndices = {};

    var generatedRGBA = this.members[i].ctx
        .getImageData(0, 0, constants.X_LIMIT, constants.Y_LIMIT).data;

    for (var j = 0; j < constants.SAMPLE_SIZE; j++) {
      var randomIndex = randomInt(generatedRGBA.length);

      if(randomIndex !== 0 && randomIndex % 4 == 0) { continue; } // ignore alpha values
      if (checkedIndices[randomIndex] === true) { continue; }     // do not re-check values

      var fitness = 1 / Math.abs(targetRGBA[randomIndex] - generatedRGBA[randomIndex]);
      fitness === 1 ? fitness = 0.99 : fitness;       // normalize values
      fitness === Infinity ? fitness = 1.0 : fitness; // handle division by 0

      diffs.push(fitness);
      diffSum += fitness;
      checkedIndices[randomIndex] = true;
    }
    this.members[i].fitness = diffSum / diffs.length;
  }

  var end = Date.now();
  console.log('RUNTIME FOR FITNESS FUNCTION: ', end - start, 'ms');
};

Population.prototype.rouletteWheelSelect = function() {

};



// Get image data out of a file uploaded by the user and draw it to canvas:

var inputField      = document.querySelector('input'),
    uploadForm      = document.querySelector('form'),
    clearButton     = document.getElementById('clear-canvas'),
    generatedCanvas = document.getElementById('generated-image'),
    originCanvas    = document.getElementById('original-image');

var ctxGenerated = generatedCanvas.getContext('2d'),
    ctxOrigin    = originCanvas.getContext('2d');

constants.X_LIMIT = generatedCanvas.width;
constants.Y_LIMIT = generatedCanvas.height;

clearButton.addEventListener('click', function() {
  ctxGenerated.clearRect(0, 0, constants.X_LIMIT, constants.Y_LIMIT);
});

var population = new Population(document.getElementsByClassName('all-images')[0]);

uploadForm.addEventListener('submit', function(event) {
  event.preventDefault();
  if (!inputField.files.item(0)) { alert('No file submitted!'); return; }

  fileToCanvas({
    canvas: originCanvas,
    ctx: ctxOrigin,
    file: inputField.files.item(0)
  });

  ctxGenerated.putImageData(population.members[4].ctx.getImageData(0, 0, 500, 500), 0, 0);
  population.assignFitness(ctxOrigin.getImageData(0,0,500,500).data);
  console.log('POPULATION: ', population);
});
