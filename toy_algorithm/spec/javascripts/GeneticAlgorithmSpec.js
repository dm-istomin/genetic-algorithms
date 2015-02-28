describe("encoder", function() {
  describe(".generateBitString()", function(){
    it("should generate a string of 36 characters", function() {
      expect(encoder.generateBitString().length).toEqual(36);
    });

    it("should generate a string that includes only 1 and 0", function() {
      expect(encoder.generateBitString()).toMatch(/(1|0)/);
      expect(encoder.generateBitString().match(/[2-9]/g)).toBeFalsy();
    });
  });
});

describe("String.prototype utility functions", function() {
  describe(".isOperator()", function() {
    it("should return false if the string is not a type of operator", function() {
      expect("*".isOperator()).toBe(true);
      expect("-".isOperator()).toBe(true);
      expect("/".isOperator()).toBe(true);
      expect("*".isOperator()).toBe(true);
    });

    it("should return true if the string is a type of operator", function() {
      expect("1010".isOperator()).toBe(false);
      expect("asdf".isOperator()).toBe(false);
      expect("-$@".isOperator()).toBe(false);
      expect("1011".isOperator()).toBe(false);
    });
  });

  describe(".isInteger()", function() {
    it("should return false if the string is not an integer(0-9)", function() {
      expect("10".isInteger()).toBe(false);
      expect("9999".isInteger()).toBe(false);
      expect("a".isInteger()).toBe(false);
      expect("000s".isInteger()).toBe(false);
    });

    it("should return true if the string is an integer(0-9)", function() {
      expect("1".isInteger()).toBe(true);
      expect("9".isInteger()).toBe(true);
      expect("4".isInteger()).toBe(true);
      expect("0".isInteger()).toBe(true);
    });
  });

  describe(".isEncodedInteger()", function() {
    it("should return false for strings that are not encoded integers", function() {
      expect("1010".isEncodedInteger()).toBe(false);
      expect("1011".isEncodedInteger()).toBe(false);
      expect("1100".isEncodedInteger()).toBe(false);
      expect("1101".isEncodedInteger()).toBe(false);
      expect("1111".isEncodedInteger()).toBe(false);
    })

    it("should return true for integer(0-9) bit strings", function() {
      expect("0000".isEncodedInteger()).toBe(true);
      expect("0001".isEncodedInteger()).toBe(true);
      expect("0010".isEncodedInteger()).toBe(true);
      expect("0011".isEncodedInteger()).toBe(true);
      expect("0100".isEncodedInteger()).toBe(true);
      expect("0101".isEncodedInteger()).toBe(true);
      expect("0110".isEncodedInteger()).toBe(true);
      expect("0111".isEncodedInteger()).toBe(true);
      expect("1000".isEncodedInteger()).toBe(true);
      expect("1001".isEncodedInteger()).toBe(true);
    });
  });

  describe(".isEncodedOperator()", function() {
    it("should return false for strings that are not encoded operators", function() {
      expect("0000".isEncodedOperator()).toBe(false);
      expect("0001".isEncodedOperator()).toBe(false);
      expect("0010".isEncodedOperator()).toBe(false);
      expect("0011".isEncodedOperator()).toBe(false);
      expect("0100".isEncodedOperator()).toBe(false);
      expect("0101".isEncodedOperator()).toBe(false);
      expect("0110".isEncodedOperator()).toBe(false);
      expect("0111".isEncodedOperator()).toBe(false);
      expect("1000".isEncodedOperator()).toBe(false);
      expect("1001".isEncodedOperator()).toBe(false);
      expect("ads5".isEncodedOperator()).toBe(false);
      expect("1111".isEncodedOperator()).toBe(false);
    })

    it("should return true for operator(+-/*) bit strings", function() {
      expect("1010".isEncodedOperator()).toBe(true);
      expect("1011".isEncodedOperator()).toBe(true);
      expect("1100".isEncodedOperator()).toBe(true);
      expect("1101".isEncodedOperator()).toBe(true);
    });
  });
});

describe("parser", function() {
  describe(".evaluate()", function() {
    it("should return the correct answer for simple cases", function() {
      expect(parser.evaluate(['2','+','7'])).toEqual(9);
      expect(parser.evaluate(['2','-','1'])).toEqual(1);
      expect(parser.evaluate(['5','*','3'])).toEqual(15);
      expect(parser.evaluate(['4','/','2'])).toEqual(2);
    });

    it("should return the correct answer for a baseline cases", function() {
      expect(parser.evaluate([ '6', '+', '5', '*', '4', '/', '2', '+', '1' ]))
             .toEqual(23);
      expect(parser.evaluate(['7', '-', '3', '*', '2', '/', '8', '+', '9']))
             .toEqual(10);
    });

    it("should return the correct answer for an empty array", function() {
      expect(parser.evaluate([])).toEqual(0);
    });
  });

  describe(".decodeBitGroup()", function() {
    it("should decode all operator bit strings", function() {
      expect(parser.decodeBitGroup("1100")).toEqual("*");
      expect(parser.decodeBitGroup("1011")).toEqual("-");
      expect(parser.decodeBitGroup("1101")).toEqual("/");
      expect(parser.decodeBitGroup("1010")).toEqual("+");
    });

    it("should decode all integer bit strings", function() {
      expect(parser.decodeBitGroup("0000")).toEqual("0");
      expect(parser.decodeBitGroup("0001")).toEqual("1");
      expect(parser.decodeBitGroup("0010")).toEqual("2");
      expect(parser.decodeBitGroup("0011")).toEqual("3");
      expect(parser.decodeBitGroup("0100")).toEqual("4");
      expect(parser.decodeBitGroup("0101")).toEqual("5");
      expect(parser.decodeBitGroup("0110")).toEqual("6");
      expect(parser.decodeBitGroup("0111")).toEqual("7");
      expect(parser.decodeBitGroup("1000")).toEqual("8");
      expect(parser.decodeBitGroup("1001")).toEqual("9");
    });

    it("should return undefined for incorrect input", function() {
      expect(parser.decodeBitGroup("123")).toBe(undefined);
      expect(parser.decodeBitGroup("a490")).toBe(undefined);
      expect(parser.decodeBitGroup("00001")).toBe(undefined);
      expect(parser.decodeBitGroup("1111")).toBe(undefined);
      expect(parser.decodeBitGroup("1110")).toBe(undefined);
    })
  });

  describe(".bitStringToExpression()", function() {
    it("should handle input with a single integer", function() {
      expect(parser.bitStringToExpression("0001")).toEqual(['1']);
    });

    it("should handle input with a single operator", function() {
      expect(parser.bitStringToExpression("1101")).toEqual([]);
    });

    it("should handle input with a single undefined expression", function() {
      expect(parser.bitStringToExpression("1111")).toEqual([]);
    });

    it("should handle input with just operators", function() {
      expect(parser.bitStringToExpression("1010101111001101")).toEqual([]);
    });

    it("should handle longer, valid input", function() {
      expect(parser.bitStringToExpression("011010100101110001001101001010100001"))
      .toEqual([ '6', '+', '5', '*', '4', '/', '2', '+', '1' ]);
    });

    it("should handle malformed input by removing unknown expressions", function() {
      expect(parser.bitStringToExpression("0010001010101110101101110010"))
      .toEqual(['2','+','7']);
      expect(parser.bitStringToExpression("1010101111001101"))
      .toEqual([]);
    });
  });
});

describe("Solution()", function() {
  var solution;
  beforeEach(function() {
    solution = new Solution();
  });

  describe(".number()", function(){
    it("should give the value of the expression encoded in the bit string", function() {
      solution.bitString = "0010001010101110101101110010";
      expect(solution.number()).toEqual(9);
    });
  });
});

describe("Population()", function() {
  describe(".members", function(){
    it("should contain the correct number of elements", function() {
      expect(new Population(9, 10).members.length).toEqual(10);
    });

    it("should be filled with objects that have a bitString property", function() {
      expect((new Population(9, 5)).members.filter(function(el) {
        return el.bitString !== undefined; }).length).toEqual(5);
    });
  });

  describe(".returnSolutionIfFound()", function(){
    it("should return null if no solution exists in the population", function() {
      population = new Population(9);
      population.members = [ new Solution("1000") ];
      expect(population.returnSolutionIfFound()).toBe(null);
    });

    it("should return true if a solution exists in the population", function() {
      population = new Population(9);
      population.members = [ new Solution("1001") ];
      expect(population.returnSolutionIfFound()).toEqual(new Solution("1001"));
    });
  });

  describe(".calculateFitnessScores()", function() {
    it("should change fitness scores from null to a number", function() {
      population = new Population(30);
      expect(population.members.map(function(e) { return e.fitness }))
        .toContain(null);
      population.calculateFitnessScores();
      expect(population.members.filter(function(e) { return typeof e.fitness == "number" })
        .length).toBe(10);
    })
  });

  describe(".normalizeFitnessScores()", function() {
    it("should change any negative fitness scores to 0.01", function() {
      population = new Population(30);
      population.members = [ new Solution() ];
      population.members[0].fitness = -0.5;
      population.normalizeFitnessScores();
      expect(population.members[0].fitness).toEqual(0.01);
    });

    it("should not change positive fitness scores", function() {
      population = new Population(30);
      population.members = [ new Solution() ];
      population.members[0].fitness = 0.3;
      population.normalizeFitnessScores();
      expect(population.members[0].fitness).toEqual(0.3);
    });
  });
});
