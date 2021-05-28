(function () {
  // Globals
  var Animator, ani;
  var Shape;
  var Utils;

  // Math aliases
  var π = Math.PI;
  var random = Math.random;
  var round = Math.round;
  var floor = Math.floor;
  var abs = Math.abs;
  var sin = Math.sin;
  var cos = Math.cos;
  var tan = Math.tan;

  // Animator
  // --------
  // Controller for canvas animation.

  Animator = (function () {
    function Animator(options) {
      ani = this;
      ani.utils = new Utils();

      // Overwrite defaults with any options passed
      ani.utils.assign(ani.config, options || {});

      // Basic setup on instantiation
      ani.canvas = document.querySelector(ani.config.selector);
      ani.canvas.width = window.innerWidth;
      ani.canvas.height = window.innerHeight;
      ani.ctx = ani.canvas.getContext("2d");
      ani.shapes = [];

      // and lastly, update our canvas dimensions on window resize
      window.addEventListener("resize", function () {
        requestAnimFrame(function () {
          ani.canvas.width = window.innerWidth;
          ani.canvas.height = window.innerHeight;
        });
      });
    }

    Animator.prototype.config = {
      density: 25,
      minSize: 18,
      maxSize: 64,
      minSpeed: 1,
      maxSpeed: 1.5,
      selector: ".js-canvas",
      colors: [
        "#ffffff", // cyan
        "#ffffff", // mango
        "#ffffff", // magenta
        "#ffffff", // noir
        "#ffffff", // slate
        "#ffffff", // silver
      ],
      // colors: [
      //   '#000', // cyan
      //   '#F79623', // mango
      //   '#C9187C', // magenta
      //   '#294F5A', // noir
      //   '#8D9A9E', // slate
      //   '#D6D6D7'  // silver
      // ]
    };

    Animator.prototype.run = function (callback) {
      for (var i = 0; i < ani.config.density; i++) {
        ani.shapes.push(new Shape());
      }
      callback();
    };

    Animator.prototype.update = function () {
      // clear the canvas before the next render
      ani.ctx.clearRect(0, 0, ani.canvas.width, ani.canvas.height);

      // for each shape, check for collisions and update position,
      // velocity and rotation accordingly
      for (var i = 0, numShapes = ani.shapes.length; i < numShapes; i++) {
        var shape = ani.shapes[i];
        shape.checkLimits();
        shape.update();
      }
    };

    Animator.prototype.render = function () {
      for (var i = 0, length = ani.shapes.length; i < length; i++) {
        ani.shapes[i].render();
      }
    };

    return Animator;
  })();

  // Shape Factory
  // -------------
  // Base class for creating new shapes.

  Shape = (function () {
    var types = ["square", "triangle", "circle"];

    function Shape() {
      // generate a random size, within our min/max bounds
      var maxSize = ani.config.maxSize;
      var minSize = ani.config.minSize;
      this.size = round(random() * (maxSize - minSize)) + minSize;

      // generate a random position, with offsets based on size
      // to prevent the element from spawning off the canvas
      this.pos = {
        x: round(random() * (ani.canvas.width - this.size * 2)) + this.size,
        y: round(random() * (ani.canvas.height - this.size * 2)) + this.size,
      };

      // generate random boolean to determine
      // if the shape will be stroked or filled
      this.hollow = round(random());

      // generate random velocity using our maxSpeed, and then randomize the
      // direction (positive/negative)
      var minSpeed = ani.config.minSpeed;
      var maxSpeed = ani.config.maxSpeed;
      this.velocity = {
        x: (random() * (maxSpeed - minSpeed) + minSpeed) * randomSign(),
        y: (random() * (maxSpeed - minSpeed) + minSpeed) * randomSign(),
      };

      // shape rotation requires a few steps...
      var rotationDirection = randomSign();
      this.rotation = {
        // randomly generated starting angle (in radians)
        angle: round(random() * π * 2) * rotationDirection,

        // random direction, ie. clockwise (1) or counter-clockwise (-1)
        direction: rotationDirection,

        // the amount of rotation per frame, created with a simple formula
        // using the shape’s velocity and size
        spin:
          ((abs(this.velocity.x) + abs(this.velocity.y)) / this.size) *
          rotationDirection,
      };

      // select a random index from the Animator color array
      this.color =
        ani.config.colors[floor(random() * ani.config.colors.length)];

      // select a random index from the types array
      this.type = types[floor(random() * types.length)];
    }

    Shape.prototype.update = function () {
      this.pos.x += this.velocity.x;
      this.pos.y += this.velocity.y;

      // we only need to update rotation for non-circle shapes
      if (this.type !== "circle") {
        this.rotation.angle += this.rotation.spin;
      }
    };

    Shape.prototype.checkLimits = function () {
      var width = ani.canvas.width;
      var height = ani.canvas.height;

      switch (this.type) {
        case "square":
        case "triangle":
          // pointed shapes must compare each limit to canvas bounds
          if (this.limits) {
            for (var i = 0, length = this.limits.length; i < length; i++) {
              var limitX = this.pos.x + this.limits[i].x;
              var limitY = this.pos.y + this.limits[i].y;
              if (limitX < 0) this.velocity.x = abs(this.velocity.x);
              if (limitX > width) this.velocity.x = abs(this.velocity.x) * -1;
              if (limitY < 0) this.velocity.y = abs(this.velocity.y);
              if (limitY > height) this.velocity.y = abs(this.velocity.y) * -1;
            }
          }
          break;

        // circles only need to compare their position + radius to canvas bounds
        case "circle":
          var posX = this.pos.x;
          var posY = this.pos.y;
          var radius = this.size / 2;
          if (posX - radius < 0) this.velocity.x = abs(this.velocity.x);
          if (posX + radius > width)
            this.velocity.x = abs(this.velocity.x) * -1;
          if (posY - radius < 0) this.velocity.y = abs(this.velocity.y);
          if (posY + radius > height)
            this.velocity.y = abs(this.velocity.y) * -1;
          break;
      }
    };

    Shape.prototype.render = function () {
      var ctx = ani.ctx;
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.rotation.angle);
      ctx.fillStyle = this.color;

      switch (this.type) {
        case "square":
          var half = this.size / 2;
          var third = this.size / 3;

          // draw square (clockwise)
          ctx.beginPath();
          ctx.moveTo(-half, half);
          ctx.lineTo(half, half);
          ctx.lineTo(half, -half);
          ctx.lineTo(-half, -half);

          // capture relative coordinates for each point,
          // and then adjust for shape rotation
          this.limits = [
            { x: -half, y: half },
            { x: half, y: half },
            { x: half, y: -half },
            { x: -half, y: -half },
          ];
          for (var i = 0, length = this.limits.length; i < length; i++) {
            this.limits[i] = rotateCoord(this.limits[i], this.rotation.angle);
          }

          // create a smaller square (counter-clockwise)
          // to "cut" its shape from the larger one
          if (this.hollow) {
            ctx.moveTo(-third, third);
            ctx.lineTo(-third, -third);
            ctx.lineTo(third, -third);
            ctx.lineTo(third, third);
          }

          ctx.closePath();
          ctx.fill();
          break;

        case "triangle":
          var half = this.size / 2;
          var quarter = half / 2;
          var apothem = this.size / (2 * tan(π / 3));
          var height = round(Math.sqrt(3) * half);

          // draw triangle (clockwise)
          ctx.beginPath();
          ctx.moveTo(0, -height + apothem);
          ctx.lineTo(half, apothem);
          ctx.lineTo(-half, apothem);

          // capture relative coordinates for each point,
          // and adjust for shape rotation
          this.limits = [
            { x: 0, y: -height + apothem },
            { x: half, y: apothem },
            { x: -half, y: apothem },
          ];
          for (var i = 0, length = this.limits.length; i < length; i++) {
            this.limits[i] = rotateCoord(this.limits[i], this.rotation.angle);
          }

          // create a smaller triangle (counter-clockwise)
          // to "cut" its shape from the larger one
          if (this.hollow) {
            height /= 2;
            apothem /= 2;
            ctx.moveTo(0, -height + apothem);
            ctx.lineTo(-quarter, apothem);
            ctx.lineTo(quarter, apothem);
          }

          ctx.closePath();
          ctx.fill();
          break;

        case "circle":
          var radius = this.size / 2;
          ctx.beginPath();

          // draw circle (clockwise)
          ctx.arc(0, 0, radius, 0, π * 2);

          // create a smaller circle (counter-clockwise)
          // to "cut" its shape from the larger one
          if (this.hollow) {
            ctx.arc(0, 0, (radius * 2) / 3, 0, π * 2, true);
          }

          ctx.closePath();
          ctx.fill();
          break;
      }

      ctx.restore();
    };

    function randomSign() {
      return round(random()) == 1 ? 1 : -1;
    }

    // rotates a point, maintaining distance from the center point
    // more info: https://goo.gl/Ht2S0g
    function rotateCoord(original, angle) {
      return {
        x: original.x * cos(angle) - original.y * sin(angle),
        y: original.y * cos(angle) + original.x * sin(angle),
      };
    }

    return Shape;
  })();

  // Utilities
  // ---------
  // Helper methods when working with objects.

  Utils = (function () {
    function Utils() {}

    Utils.prototype.isObject = function (object) {
      return (
        object !== null &&
        typeof object === "object" &&
        object.constructor == Object
      );
    };

    Utils.prototype.forOwn = function (object, callback) {
      if (!this.isObject(object)) {
        throw new TypeError(
          'Expected "object", but received "' + typeof object + '".'
        );
      } else {
        for (var property in object) {
          if (object.hasOwnProperty(property)) {
            callback(property);
          }
        }
      }
    };

    Utils.prototype.assign = function (target, source) {
      this.forOwn(
        source,
        function (property) {
          if (this.isObject(source[property])) {
            if (!target[property] || !this.isObject(target[property])) {
              target[property] = {};
            }
            this.assign(target[property], source[property]);
          } else {
            target[property] = source[property];
          }
        }.bind(this)
      );
      return target;
    };

    return Utils;
  })();

  // Polyfill ////////////////////////////////////////////////////////////////////////

  window.requestAnimFrame = (function () {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      // Fallback for IE9
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      }
    );
  })();

  // Showtime! ///////////////////////////////////////////////////////////////////////

  var animator = new Animator();

  animator.run(function animate() {
    animator.update();
    animator.render();
    requestAnimFrame(animate);
  });
})();
