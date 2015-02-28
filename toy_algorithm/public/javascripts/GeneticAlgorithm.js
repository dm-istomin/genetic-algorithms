"use strict";

// Factors of the genetic algorithm.

var geneticAlgorithm = {};

geneticAlgorithm.crossoverRate   = 0.7;
geneticAlgorithm.mutationRate    = 0.001;

// Encoder to generate bit strings.

var encoder = {};

encoder.bitStringLength = 36;

encoder.generateBitString = function() {
  var string = '';
  for (var i = 0; i < this.bitStringLength; i++) {
    Math.random() > 0.5 ? string += '1': string += '0';
  }
  return string;
};

encoder.mutateBitString = function(string) {
  var splitString = string.split("");

  for (var i = 0; i < splitString.length; i++) {
    if (Math.random() <= geneticAlgorithm.mutationRate) {
      if (splitString[i] === "0") {
        splitString[i] = "1";
      } else {
        splitString[i] = "0";
      }
    }
  }
  return splitString.join("");
}

// Parser to convert bit strings to numbers.

var parser = {};

// Extending String prototype for utility functions to help with parsing.
String.prototype.isInteger = function() {
  return this.match(/^[0123456789]$/) !== null;
};

String.prototype.isOperator = function() {
  return this.match(/^[-+/*]$/) !== null;
};

String.prototype.isEncodedInteger = function() {
  return this.match(/^(0000|0001|0010|0011|0100|0101|0110|0111|1000|1001)$/)
         !== null;
};

String.prototype.isEncodedOperator = function() {
  return this.match(/^(1010|1011|1100|1101)$/) !== null;
};

// Main parser functions

parser.bitConversions  =  { integers: { "0000": "0",
                                        "0001": "1",
                                        "0010": "2",
                                        "0011": "3",
                                        "0100": "4",
                                        "0101": "5",
                                        "0110": "6",
                                        "0111": "7",
                                        "1000": "8",
                                        "1001": "9" },
                            operators: { "1010": "+",
                                         "1011": "-",
                                         "1100": "*",
                                         "1101": "/" }
                          };

parser.evaluate = function(expressions) {
  var total = 0,
      currentOperation = null;

  for (var i = 0; i < expressions.length; i++) {
    if (expressions[i].match(/\d/)) {
      var integer = parseInt(expressions[i]);
      if (currentOperation === null ) {
        total += integer;
      } else {
        switch (currentOperation) {
          case "+":
            total += integer;
            break;
          case "-":
            total -= integer;
            break;
          case "*":
            total *= integer;
            break;
          case "/":
            if (integer !== 0) { total /= integer; }
            break;
        }
      }
    } else if (expressions[i].match(/[+-/*]/) && i !== 0) {
      currentOperation = expressions[i];
    };
  }
  return total;
};

parser.decodeBitGroup = function(bitGroup) {
  if (bitGroup.length === 4) {
    var convertedChar = parser.bitConversions.operators[bitGroup] ||
                        parser.bitConversions.integers[bitGroup];
    return convertedChar;
  }
};

parser.bitStringToExpression = function(bitString) {
  var bitGroups          = bitString.match(/\d{1,4}/g) || [],
      decodedExpressions = [],
      subExpression      = [];

  for (var i = 0; i < bitGroups.length; i++) {
    var currentChar = parser.decodeBitGroup(bitGroups[i]);

    if (currentChar) {
      if (currentChar.match(/^\d$/)) {
        if (subExpression.length === 0) {
          subExpression.push(currentChar);
        } else if (subExpression.length === 2){
          subExpression.push(currentChar);
          decodedExpressions.push(subExpression.splice(0,2));
        }
      } else {
        if (subExpression.length === 1) {
          subExpression.push(currentChar);
        }
      }
    }
  }
  if (subExpression.length !== 0) { decodedExpressions.push(subExpression[0]) };
  return Array.prototype.concat.apply([], decodedExpressions);
};

// Solution object to hold bit strings generated.

function Solution(string) {
  this.bitString = string || encoder.generateBitString();
  this.fitness = null;
}

Solution.prototype.number = function() {
  return parser.evaluate(parser.bitStringToExpression(this.bitString));
};

// Population initializes random solutions and handles reproduction.

function Population(targetNum, size) {
  this.targetNum = targetNum;
  this.members = Array.apply(null, new Array(size || 10))
    .map(function(){ return new Solution() });
};

Population.prototype.calculateFitnessScores = function() {
  for (var i = 0; i < this.members.length; i++) {
    var currentSolution = this.members[i],
        fitness = 1 / (this.targetNum - currentSolution.number());

    currentSolution.fitness = fitness;
  }
}

Population.prototype.normalizeFitnessScores = function() {
  for (var i = 0; i < this.members.length; i++) {
    if (this.members[i].fitness < 0) {
      this.members[i].fitness = 0.01;
    }
  }
}

Population.prototype.returnSolutionIfFound = function() {
  for (var i = 0; i < this.members.length; i++) {
    if (this.members[i].number() === this.targetNum) { return this.members[i]; }
  }
  return null;
}

Population.prototype.rouletteWheelSelect = function() {
  this.normalizeFitnessScores();
  var randomNum        = Math.random(),
      sumProbabilities = 0,
      sumFitness       = this.members.reduce(function(a,b) {
                                            return { fitness: a.fitness + b.fitness};
                                          }).fitness,
      probabilities    = [];

  for (var i = 0; i < this.members.length; i++) {
    var currentSolution = this.members[i];

    probabilities.push(
      { probability: (currentSolution.fitness / sumFitness + sumProbabilities),
        position: i
    });
    sumProbabilities += currentSolution.fitness / sumFitness;
  }

  for (var i = 0; i < probabilities.length; i++) {
    if (randomNum <= probabilities[i].probability) {
      return this.members[probabilities[i].position];
    }
  }
}

Population.prototype.reproduce = function() {
  var newGeneration = [];
  while (newGeneration.length !== this.members.length) {
    var solution1 = this.rouletteWheelSelect(),
        solution2 = this.rouletteWheelSelect();
    if (Math.random() < geneticAlgorithm.crossoverRate) {
      var crossoverIndex     = Math.round(Math.random() * 36),
          bitStringFragment1 = solution1.bitString.slice(crossoverIndex),
          bitStringFragment2 = solution2.bitString.slice(0, crossoverIndex),
          newBitString       = bitStringFragment1 + bitStringFragment2,
          newSolution        = new Solution(encoder.mutateBitString(newBitString));

      newGeneration.push(newSolution);
    }
  }
  this.members = newGeneration;
  return this.members;
}

var runner = {};

runner.findSolutionFor = function(num) {
  var population = new Population(num, Math.abs(num) * 5);

  while (!population.returnSolutionIfFound()) {
    population.calculateFitnessScores();
    console.log(population.members);
    population.reproduce();
    population.calculateFitnessScores();
  };
var solution = population.returnSolutionIfFound()
console.log(parser.bitStringToExpression(solution.bitString));
}

runner.findSolutionFor(10);
