# Genetic Algorithms #

This is a set of small projects exploring [genetic algorithms](http://en.wikipedia.org/wiki/Genetic_algorithm), methods for
finding solutions to problems in ways that mimic natural selection. All of the projects are written in JavaScript, and
for now, not all of them have a web UI, so you should run them locally with [Node](http://nodejs.org/). Here are the projects
currently included in the repo:

## Toy Algorithm ##

A very simple program that attempts to find a set of mathematical expressions which will produce the desired number.
For instance, if you want an expression that produces the value 42, you would enter:
```javascript 
runner.findSolutionFor(42);
```
The program generates a set of random solutions and then reproduces sucessive generations until it can find an expresion
that matches the desired number, such as ```[ '7', '*', '5', '+', '7' ]```.
