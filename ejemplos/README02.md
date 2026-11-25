## La propiedad dx (Delta X)

```js 
dx: 3
```
En desarrollo de videojuegos, dx significa diferencia en X (velocidad horizontal) y dy significa diferencia en Y (velocidad vertical). Al darle un valor de 3, se indica a Kontra que  el objeto avance 3 píxeles hacia la derecha en cada actualización. 


## kontra.GameLoop()
Dibuja una imagen, la borra, calcula la nueva posición de los objetos y vuelve a dibujar todo 60 veces por segundo (60 FPS).

* **GameLoop** ejecuta este ciclo en dos funciones:

* update() (Lógica y matemáticas): Se calculan movimientos, colisiones, puntajes y reglas. Al llamar a cuadrado.update(), Kontra suma automáticamente dx a x (y dy a y).

* render() (Dibujo): Antes de ejecutar tu función render(), Kontra limpia automáticamente todo el lienzo (clearRect) para borrar el fotograma anterior y evitar que el cuadrado deje una estela pintada. 


## loop.start()
GameLoop solo lo prepara en memoria, al llamar a loop.start() enciende el motor (usando requestAnimationFrame del navegador por debajo) e inicia la animación.
