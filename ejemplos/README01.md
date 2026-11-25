
```js
let cuadrado = kontra.Sprite({
        x: canvas.width / 2 - 25, // Centrado horizontalmente
        y: canvas.height / 2 - 25, // Centrado verticalmente
        width: 50, // Ancho de 50px
        height: 50, // Alto de 50px
        color: "red", // Color de relleno
      });
```

* Posición (x, y): los rectángulos  se dibujan desde su esquina superior izquierda, restar la mitad de su tamaño (25) al centro del lienzo (canvas.width / 2) permite que el centro geométrico del cuadrado coincida con el centro de la pantalla.
* Dimensiones (width, height): Define un área de 50x50 píxeles.
* Apariencia (color): Le asigna el relleno "red". 


```js
cuadrado.render();
```

* Ejecuta el ciclo de dibujado interno del Sprite:
	1. Guarda el estado actual del pincel (context.save()).
	2. Mueve el origen de dibujo a las coordenadas (x, y) del cuadrado (context.translate(this.x, this.y)).
	3. Aplica el color rojo (context.fillStyle = "red") y pinta el rectángulo desde ese nuevo punto de origen (context.fillRect(0, 0, 50, 50)).
	4. Restaura el estado original del pincel (context.restore()) para no afectar a futuros objetos.
