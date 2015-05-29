# GendyJS

**Author:** Andrew Bernstein

**Contributors:** Ben Taylor

**Overview:** GendyJS is a Web Audio API dynamic stochastic synthesis oscilator. Dynamic stochastic synthesis is a technique pioneered by the composer and theoretician [Iannis Xenakis](http://en.wikipedia.org/wiki/Iannis_Xenakis).

### How to Use GendyJS

Download gendy.js and include it in a script tag at the top of your page.

```html
<head>
	<script src="gendy.js"></script>
</head>
```

Create a GendyJS instance, specifying the Audio Context as a creation argument.

```js
var gendy = new Gendy(audioContext);
```
### Controls

Users have access to 4 parameters to control the oscilator.

Frequency
```js
gendy.freq = 0.5;
```

X Axis Step Size
```js
gendy.xStep = 10;
```

Y Axis Bounds
```js
gendy.yMax = 0.5;
gendy.yMin = 0.1;
```

Y Step Size
```js
gendy.yStep = 0.25;
```

The ```js init()``` method can be called to reinitialize the waveform with a new number of breakpoints.

```js
gendy.init(10);
```
### Demo

[GendyJS Demo](http://abbernie.github.io/gendy)
