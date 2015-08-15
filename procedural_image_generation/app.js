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

constants.MUTATION_RATE = 0.01;
constants.CROSSOVER_RATE = 0.7;

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
    var canvas = args.canvas,
        ctx = args.ctx,
        numShapes = args.numShapes || 50,
        numOfShapeVertices = args.numOfShapeVertices || 3;

    var path = new Path2D();

    for (var shape = 0; shape < numShapes; shape++) {
        var origin = {x: randomNum(canvas.height), y: randomNum(canvas.width)},
            randomColor = generateRandomColor();

        path.moveTo(origin.x, origin.y);

        for (var vertex = 0; vertex < numOfShapeVertices; vertex++) {
            path.lineTo(randomNum(canvas.height), randomNum(canvas.width));
        }
        ctx.fillStyle = randomColor;
        ctx.fill(path);
        ctx.closePath();
    }

    var generatedPixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    console.log('DATA URL, GENERATED CANVAS: ', canvas.toDataURL());
    console.log('GENERATED LENGTH: ', canvas.toDataURL().length);
    console.log('GENERATED PIXEL DATA: ', generatedPixelData);
    console.log('GENERATED IMAGE DATA LENGTH: ', generatedPixelData.length);

    console.log('OVERALL FITNESS: ', getFitnessScore(args.targetData, generatedPixelData));
}

function getFitnessScore(targetPixelData, generatedPixelData) {
  var diffs = [];

  for (var i = 0; i < generatedPixelData.length; i++) {
    var fitness = 1 / Math.abs(targetPixelData[i] - generatedPixelData[i]);
    fitness === 1 ? fitness = 0.99 : fitness;
    fitness === Infinity ? fitness = 1.0 : fitness;

    diffs.push(fitness);
  }
  var avgFitness = diffs.reduce(function(sum, val) {
    return sum += val;
  }) / generatedPixelData.length;

  return avgFitness;
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

function SeedImage(args) {
  this.numShapes   = args.numShapes || 50;
  this.numVertices = args.numVertices || 3;
  this.xMax        = args.xMax;
  this.yMax        = args.yMax;
  this.shapeData   = [];

  for (var i = 0; i < this.numShapes; i++) {
    this.shapeData.push({color: generateRandomColor(), vertices: []});
    for (var j = 0; j < this.numVertices; j++) {
      this.shapeData[i].vertices.push({x: randomNum(this.xMax), y:randomNum(this.yMax)});
    }
  }
}

// Get image data out of a file uploaded by the user and draw it to canvas:

document.addEventListener('DOMContentLoaded', function() {
    var inputField = document.querySelector('input'),
        uploadForm = document.querySelector('form');

    var generatedCanvas = document.getElementById('generated-image'),
        originCanvas    = document.getElementById('original-image'),
        ctxGenerated = generatedCanvas.getContext('2d'),
        ctxOrigin    = originCanvas.getContext('2d');

    uploadForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!inputField.files.item(0)) { alert('No file submitted!'); return; }

        fileToCanvas({
          canvas: originCanvas,
          ctx: ctxOrigin,
          file: inputField.files.item(0)
        });

        drawCanvas({
          canvas: generatedCanvas,
          ctx: ctxGenerated,
          targetData: ctxGenerated.getImageData(0, 0, generatedCanvas.width, generatedCanvas.height).data
        });
    });
});
